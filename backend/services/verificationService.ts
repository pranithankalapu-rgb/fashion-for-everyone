import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import { communicationService, ProviderNotConfiguredError, DeliveryFailedError } from './communicationService';
import { normalizePhoneNumber } from '../utils/phoneUtils';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_ATTEMPTS = 5;

export class VerificationError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;

  constructor(message: string, statusCode: number = 400, code?: string) {
    super(message);
    this.name = 'VerificationError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function sanitizeContact(raw: string): string {
  return raw.replace(/[\u0000-\u001F\u007F]/g, '').trim();
}

export const verificationService = {
  /**
   * Generates an unpredictable 6-digit one-time code.
   */
  generateOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  },

  /**
   * Request an OTP to update the user's email address.
   */
  async requestEmailVerification(userId: string, newEmailRaw: string) {
    if (!userId) {
      throw new VerificationError('Authentication required.', 401);
    }

    if (!newEmailRaw || typeof newEmailRaw !== 'string') {
      throw new VerificationError('A valid email address is required.', 400);
    }

    const newEmail = sanitizeContact(newEmailRaw).toLowerCase();
    if (!EMAIL_REGEX.test(newEmail)) {
      throw new VerificationError('Invalid email address format.', 400);
    }

    // 1. Check current user
    const currentUser = await prisma.userProfile.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw new VerificationError('User account not found.', 404);
    }

    if (currentUser.email && currentUser.email.toLowerCase() === newEmail) {
      throw new VerificationError('New email must be different from your current email.', 400);
    }

    // 2. Check if email is already taken by another account
    const existing = await prisma.userProfile.findFirst({
      where: {
        email: { equals: newEmail, mode: 'insensitive' },
        NOT: { id: userId },
      },
    });

    if (existing) {
      // Clean, unrevealing message
      throw new VerificationError('This email address cannot be used. Please choose another.', 409);
    }

    // 3. Enforce resend cooldown
    const activePending = await prisma.verificationCode.findFirst({
      where: {
        userId,
        type: 'EMAIL_CHANGE',
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (activePending && activePending.resendAfter > new Date()) {
      const waitSeconds = Math.ceil((activePending.resendAfter.getTime() - Date.now()) / 1000);
      throw new VerificationError(
        `Please wait ${waitSeconds} second${waitSeconds === 1 ? '' : 's'} before requesting a new code.`,
        429,
        'COOLDOWN_ACTIVE'
      );
    }

    // 4. Generate OTP & secure hash
    const otp = this.generateOtp();
    const codeHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
    const resendAfter = new Date(Date.now() + RESEND_COOLDOWN_MS);

    // 5. Invalidate any previous unconsumed codes for this user & type
    await prisma.verificationCode.updateMany({
      where: {
        userId,
        type: 'EMAIL_CHANGE',
        consumedAt: null,
      },
      data: {
        consumedAt: new Date(0), // Mark invalidated
      },
    });

    // 6. Create new verification record
    const record = await prisma.verificationCode.create({
      data: {
        userId,
        target: newEmail,
        type: 'EMAIL_CHANGE',
        codeHash,
        expiresAt,
        resendAfter,
        maxAttempts: MAX_ATTEMPTS,
        attempts: 0,
      },
    });

    // 7. Dispatch via provider abstraction
    try {
      await communicationService.sendVerificationEmail(newEmail, otp);
    } catch (err: any) {
      // Delivery failed: immediately delete the record to avoid dangling codes
      await prisma.verificationCode.delete({ where: { id: record.id } }).catch(() => {});

      if (err instanceof ProviderNotConfiguredError) {
        console.error(
          `[VerificationService] EMAIL provider not configured. Missing required environment variables: ${err.requiredVars.join(', ')}`
        );
        throw new VerificationError(
          'Verification service is temporarily unavailable. Please try again later.',
          503,
          'PROVIDER_NOT_CONFIGURED'
        );
      }
      if (err instanceof DeliveryFailedError) {
        console.error('[VerificationService] EMAIL delivery failed:', err.message);
        throw new VerificationError(
          'Unable to deliver verification email. Please try again later.',
          502,
          'DELIVERY_FAILED'
        );
      }
      throw new VerificationError('Failed to dispatch verification code. Please try again.', 500);
    }

    return {
      success: true,
      message: 'Verification code sent successfully to your new email.',
      resendCooldown: Math.ceil(RESEND_COOLDOWN_MS / 1000),
    };
  },

  /**
   * Verify OTP and atomically update the user's email address.
   */
  async verifyAndUpdateEmail(userId: string, newEmailRaw: string, codeRaw: string) {
    if (!userId) {
      throw new VerificationError('Authentication required.', 401);
    }

    if (!newEmailRaw || typeof newEmailRaw !== 'string') {
      throw new VerificationError('Email address is required.', 400);
    }

    if (!codeRaw || typeof codeRaw !== 'string') {
      throw new VerificationError('Verification code is required.', 400);
    }

    const newEmail = sanitizeContact(newEmailRaw).toLowerCase();
    const code = codeRaw.trim();

    if (!/^\d{6}$/.test(code)) {
      throw new VerificationError('Please enter a valid 6-digit verification code.', 400);
    }

    // 1. Find active pending verification record
    const record = await prisma.verificationCode.findFirst({
      where: {
        userId,
        target: newEmail,
        type: 'EMAIL_CHANGE',
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new VerificationError('No active verification request found for this email. Please request a new code.', 400);
    }

    // Check expiry
    if (record.expiresAt < new Date()) {
      throw new VerificationError('Verification code has expired. Please request a new code.', 400, 'CODE_EXPIRED');
    }

    // Check maximum attempts
    if (record.attempts >= record.maxAttempts) {
      throw new VerificationError('Maximum verification attempts exceeded. Please request a new code.', 400, 'MAX_ATTEMPTS_EXCEEDED');
    }

    // Check code hash
    const isValid = await bcrypt.compare(code, record.codeHash);
    if (!isValid) {
      const updated = await prisma.verificationCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });

      const remaining = Math.max(0, record.maxAttempts - updated.attempts);
      if (remaining === 0) {
        throw new VerificationError('Maximum verification attempts exceeded. Please request a new code.', 400, 'MAX_ATTEMPTS_EXCEEDED');
      }

      throw new VerificationError(`Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`, 400, 'INVALID_CODE');
    }

    // 2. Atomic consumption and update within transaction
    const updatedProfile = await prisma.$transaction(async (tx) => {
      // Atomically claim the verification code
      const claim = await tx.verificationCode.updateMany({
        where: {
          id: record.id,
          consumedAt: null,
          expiresAt: { gt: new Date() },
          attempts: { lt: record.maxAttempts },
        },
        data: {
          consumedAt: new Date(),
        },
      });

      if (claim.count === 0) {
        throw new VerificationError('Verification code is invalid, expired, or already used.', 400, 'ALREADY_CONSUMED');
      }

      // Re-check email uniqueness
      const conflict = await tx.userProfile.findFirst({
        where: {
          email: { equals: newEmail, mode: 'insensitive' },
          NOT: { id: userId },
        },
      });

      if (conflict) {
        throw new VerificationError('This email address cannot be used. Please choose another.', 409);
      }

      // Update user profile
      const user = await tx.userProfile.update({
        where: { id: userId },
        data: { email: newEmail },
      });

      return user;
    });

    return {
      success: true,
      message: 'Email address updated successfully.',
      email: updatedProfile.email!,
      profile: updatedProfile,
    };
  },

  /**
   * Request an OTP to update the user's mobile number.
   */
  async requestMobileVerification(userId: string, newPhoneRaw: string) {
    if (!userId) {
      throw new VerificationError('Authentication required.', 401);
    }

    if (!newPhoneRaw || typeof newPhoneRaw !== 'string') {
      throw new VerificationError('A valid mobile number is required.', 400);
    }

    const normResult = normalizePhoneNumber(newPhoneRaw);
    if (!normResult.valid || !normResult.normalized) {
      throw new VerificationError(
        normResult.error || 'Invalid mobile number format. Please enter a valid 10-digit mobile number or full international format with country code.',
        400
      );
    }

    const newPhone = normResult.normalized;
    const rawSanitized = sanitizeContact(newPhoneRaw);

    // 1. Check current user
    const currentUser = await prisma.userProfile.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw new VerificationError('User account not found.', 404);
    }

    if (currentUser.phone) {
      const currentNorm = normalizePhoneNumber(currentUser.phone);
      if (
        (currentNorm.valid && currentNorm.normalized === newPhone) ||
        currentUser.phone.trim() === newPhone ||
        currentUser.phone.trim() === rawSanitized
      ) {
        throw new VerificationError('New mobile number must be different from your current mobile number.', 400);
      }
    }

    // 2. Check if mobile number is already taken
    const existing = await prisma.userProfile.findFirst({
      where: {
        OR: [
          { phone: newPhone },
          { phone: rawSanitized },
        ],
        NOT: { id: userId },
      },
    });

    if (existing) {
      throw new VerificationError('This mobile number cannot be used. Please choose another.', 409);
    }

    // 3. Enforce resend cooldown
    const activePending = await prisma.verificationCode.findFirst({
      where: {
        userId,
        type: 'PHONE_CHANGE',
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (activePending && activePending.resendAfter > new Date()) {
      const waitSeconds = Math.ceil((activePending.resendAfter.getTime() - Date.now()) / 1000);
      throw new VerificationError(
        `Please wait ${waitSeconds} second${waitSeconds === 1 ? '' : 's'} before requesting a new code.`,
        429,
        'COOLDOWN_ACTIVE'
      );
    }

    // 4. Generate OTP & secure hash
    const otp = this.generateOtp();
    const codeHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
    const resendAfter = new Date(Date.now() + RESEND_COOLDOWN_MS);

    // 5. Invalidate previous unconsumed codes
    await prisma.verificationCode.updateMany({
      where: {
        userId,
        type: 'PHONE_CHANGE',
        consumedAt: null,
      },
      data: {
        consumedAt: new Date(0),
      },
    });

    // 6. Create record
    const record = await prisma.verificationCode.create({
      data: {
        userId,
        target: newPhone,
        type: 'PHONE_CHANGE',
        codeHash,
        expiresAt,
        resendAfter,
        maxAttempts: MAX_ATTEMPTS,
        attempts: 0,
      },
    });

    // 7. Dispatch via provider abstraction
    try {
      await communicationService.sendVerificationSms(newPhone, otp);
    } catch (err: any) {
      await prisma.verificationCode.delete({ where: { id: record.id } }).catch(() => {});

      if (err instanceof ProviderNotConfiguredError) {
        console.error(
          `[VerificationService] SMS provider not configured. Missing required environment variables: ${err.requiredVars.join(', ')}`
        );
        throw new VerificationError(
          'Verification service is temporarily unavailable. Please try again later.',
          503,
          'PROVIDER_NOT_CONFIGURED'
        );
      }
      if (err instanceof DeliveryFailedError) {
        console.error('[VerificationService] SMS delivery failed:', err.message);
        throw new VerificationError(
          'Unable to deliver verification code. Please try again later.',
          502,
          'DELIVERY_FAILED'
        );
      }
      throw new VerificationError('Failed to dispatch verification code. Please try again.', 500);
    }

    return {
      success: true,
      message: 'Verification code sent successfully to your mobile number.',
      resendCooldown: Math.ceil(RESEND_COOLDOWN_MS / 1000),
    };
  },

  /**
   * Verify OTP and atomically update the user's mobile number.
   */
  async verifyAndUpdateMobile(userId: string, newPhoneRaw: string, codeRaw: string) {
    if (!userId) {
      throw new VerificationError('Authentication required.', 401);
    }

    if (!newPhoneRaw || typeof newPhoneRaw !== 'string') {
      throw new VerificationError('Mobile number is required.', 400);
    }

    if (!codeRaw || typeof codeRaw !== 'string') {
      throw new VerificationError('Verification code is required.', 400);
    }

    const normResult = normalizePhoneNumber(newPhoneRaw);
    if (!normResult.valid || !normResult.normalized) {
      throw new VerificationError(
        normResult.error || 'Invalid mobile number format.',
        400
      );
    }

    const newPhone = normResult.normalized;
    const rawSanitized = sanitizeContact(newPhoneRaw);
    const code = codeRaw.trim();

    if (!/^\d{6}$/.test(code)) {
      throw new VerificationError('Please enter a valid 6-digit verification code.', 400);
    }

    // 1. Find active pending verification record
    const record = await prisma.verificationCode.findFirst({
      where: {
        userId,
        target: { in: [newPhone, rawSanitized] },
        type: 'PHONE_CHANGE',
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new VerificationError('No active verification request found for this mobile number. Please request a new code.', 400);
    }

    // Check expiry
    if (record.expiresAt < new Date()) {
      throw new VerificationError('Verification code has expired. Please request a new code.', 400, 'CODE_EXPIRED');
    }

    // Check maximum attempts
    if (record.attempts >= record.maxAttempts) {
      throw new VerificationError('Maximum verification attempts exceeded. Please request a new code.', 400, 'MAX_ATTEMPTS_EXCEEDED');
    }

    // Check code hash
    const isValid = await bcrypt.compare(code, record.codeHash);
    if (!isValid) {
      const updated = await prisma.verificationCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });

      const remaining = Math.max(0, record.maxAttempts - updated.attempts);
      if (remaining === 0) {
        throw new VerificationError('Maximum verification attempts exceeded. Please request a new code.', 400, 'MAX_ATTEMPTS_EXCEEDED');
      }

      throw new VerificationError(`Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`, 400, 'INVALID_CODE');
    }

    // 2. Atomic consumption and update within transaction
    const updatedProfile = await prisma.$transaction(async (tx) => {
      const claim = await tx.verificationCode.updateMany({
        where: {
          id: record.id,
          consumedAt: null,
          expiresAt: { gt: new Date() },
          attempts: { lt: record.maxAttempts },
        },
        data: {
          consumedAt: new Date(),
        },
      });

      if (claim.count === 0) {
        throw new VerificationError('Verification code is invalid, expired, or already used.', 400, 'ALREADY_CONSUMED');
      }

      // Re-check phone uniqueness
      const conflict = await tx.userProfile.findFirst({
        where: {
          OR: [
            { phone: newPhone },
            { phone: rawSanitized },
          ],
          NOT: { id: userId },
        },
      });

      if (conflict) {
        throw new VerificationError('This mobile number cannot be used. Please choose another.', 409);
      }

      // Update user profile
      const user = await tx.userProfile.update({
        where: { id: userId },
        data: { phone: newPhone },
      });

      return user;
    });

    return {
      success: true,
      message: 'Mobile number updated successfully.',
      phone: updatedProfile.phone!,
      profile: updatedProfile,
    };
  },
};

