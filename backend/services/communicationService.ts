import nodemailer from 'nodemailer';

export class ProviderNotConfiguredError extends Error {
  public readonly providerType: 'email' | 'sms';
  public readonly requiredVars: string[];

  constructor(providerType: 'email' | 'sms', requiredVars: string[]) {
    super(
      `${providerType.toUpperCase()} delivery provider is not configured. Required environment variables: ${requiredVars.join(', ')}`
    );
    this.name = 'ProviderNotConfiguredError';
    this.providerType = providerType;
    this.requiredVars = requiredVars;
  }
}

export class DeliveryFailedError extends Error {
  public readonly providerType: 'email' | 'sms';

  constructor(providerType: 'email' | 'sms', message: string) {
    super(`${providerType.toUpperCase()} delivery failed: ${message}`);
    this.name = 'DeliveryFailedError';
    this.providerType = providerType;
  }
}

export interface EmailProvider {
  isConfigured(): boolean;
  sendVerificationEmail(to: string, code: string): Promise<{ success: boolean; messageId?: string }>;
}

export interface SmsProvider {
  isConfigured(): boolean;
  sendVerificationSms(to: string, code: string): Promise<{ success: boolean; messageId?: string }>;
}

// -------------------------------------------------------------
// Real SMTP Email Provider
// -------------------------------------------------------------
export class SmtpEmailProvider implements EmailProvider {
  private transporter: nodemailer.Transporter | null = null;

  isConfigured(): boolean {
    return Boolean(
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    );
  }

  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      const port = Number(process.env.SMTP_PORT) || 587;
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
    return this.transporter;
  }

  async sendVerificationEmail(to: string, code: string): Promise<{ success: boolean; messageId?: string }> {
    if (!this.isConfigured()) {
      throw new ProviderNotConfiguredError('email', ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM']);
    }

    const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || 'noreply@fashionforeveryone.com';
    const transporter = this.getTransporter();

    try {
      const info = await transporter.sendMail({
        from: `"Fashion for Everyone" <${from}>`,
        to,
        subject: 'Your Fashion for Everyone Verification Code',
        text: `Your verification code is: ${code}\n\nThis code will expire in 5 minutes. If you did not request this change, please secure your account immediately.`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px; background-color: #FFFFFF;">
            <h2 style="color: #0F172A; margin-top: 0;">Verify Your New Email Address</h2>
            <p style="color: #475569; font-size: 15px; line-height: 24px;">
              You recently requested to update the email address linked to your Fashion for Everyone account. Please use the verification code below to confirm this change:
            </p>
            <div style="background-color: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
              <span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #4F46E5;">${code}</span>
            </div>
            <p style="color: #64748B; font-size: 13px; line-height: 20px;">
              This code is valid for <strong>5 minutes</strong>. If you did not make this request, your account remains secure and no changes have been applied.
            </p>
          </div>
        `,
      });

      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      console.error('SMTP email transmission failure:', err?.message || err);
      throw new DeliveryFailedError('email', err?.message || 'Unable to deliver verification email.');
    }
  }
}

// -------------------------------------------------------------
// Real Twilio SMS Provider
// -------------------------------------------------------------
export class TwilioSmsProvider implements SmsProvider {
  isConfigured(): boolean {
    return Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
    );
  }

  async sendVerificationSms(to: string, code: string): Promise<{ success: boolean; messageId?: string }> {
    if (!this.isConfigured()) {
      throw new ProviderNotConfiguredError('sms', [
        'TWILIO_ACCOUNT_SID',
        'TWILIO_AUTH_TOKEN',
        'TWILIO_PHONE_NUMBER',
      ]);
    }

    const sid = process.env.TWILIO_ACCOUNT_SID!;
    const token = process.env.TWILIO_AUTH_TOKEN!;
    const from = process.env.TWILIO_PHONE_NUMBER!;
    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;

    const body = new URLSearchParams();
    body.append('To', to);
    body.append('From', from);
    body.append('Body', `Your Fashion for Everyone verification code is: ${code}. Valid for 5 minutes.`);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Twilio HTTP ${res.status}`);
      }

      const data: any = await res.json();
      return { success: true, messageId: data.sid };
    } catch (err: any) {
      console.error('Twilio SMS transmission failure:', err?.message || err);
      throw new DeliveryFailedError('sms', err?.message || 'Unable to deliver verification SMS.');
    }
  }
}

// -------------------------------------------------------------
// Isolated Test-Mode Sink (Strictly disabled in production)
// -------------------------------------------------------------
interface CapturedTestMessage {
  target: string;
  code: string;
  type: 'email' | 'sms';
  timestamp: Date;
}

const testMessageSink: CapturedTestMessage[] = [];

export function isTestModeAllowed(): boolean {
  return (
    process.env.NODE_ENV === 'test' &&
    process.env.ALLOW_TEST_OTP_SINK === 'true' &&
    process.env.NODE_ENV !== 'production'
  );
}

export function recordTestDelivery(target: string, code: string, type: 'email' | 'sms'): void {
  if (!isTestModeAllowed()) return;
  testMessageSink.push({
    target: target.toLowerCase().trim(),
    code,
    type,
    timestamp: new Date(),
  });
}

/**
 * Strictly accessible by isolated test scripts in NODE_ENV=test.
 * Throws in all other environments.
 */
export function getLatestTestVerificationCode(target: string): string | null {
  if (!isTestModeAllowed()) {
    throw new Error('Access denied: Test verification sink is only available when NODE_ENV=test and ALLOW_TEST_OTP_SINK=true.');
  }

  const normalized = target.toLowerCase().trim();
  const match = [...testMessageSink]
    .reverse()
    .find((m) => m.target === normalized);

  return match ? match.code : null;
}

export function clearTestVerificationCodes(): void {
  if (!isTestModeAllowed()) return;
  testMessageSink.length = 0;
}

// -------------------------------------------------------------
// Composite Communication Service
// -------------------------------------------------------------
export const emailProvider: EmailProvider = new SmtpEmailProvider();
export const smsProvider: SmsProvider = new TwilioSmsProvider();

export const communicationService = {
  async sendVerificationEmail(to: string, code: string): Promise<{ success: boolean; messageId?: string }> {
    // 1. If in isolated test mode, capture into test sink
    if (isTestModeAllowed()) {
      recordTestDelivery(to, code, 'email');
      return { success: true, messageId: `test_email_${Date.now()}` };
    }

    // 2. If SMTP is configured, send via real SMTP
    if (emailProvider.isConfigured()) {
      return emailProvider.sendVerificationEmail(to, code);
    }

    // 3. Neither configured nor test mode -> throw explicit configuration error
    throw new ProviderNotConfiguredError('email', ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM']);
  },

  async sendVerificationSms(to: string, code: string): Promise<{ success: boolean; messageId?: string }> {
    // 1. If in isolated test mode, capture into test sink
    if (isTestModeAllowed()) {
      recordTestDelivery(to, code, 'sms');
      return { success: true, messageId: `test_sms_${Date.now()}` };
    }

    // 2. If Twilio is configured, send via real SMS
    if (smsProvider.isConfigured()) {
      return smsProvider.sendVerificationSms(to, code);
    }

    // 3. Neither configured nor test mode -> throw explicit configuration error
    throw new ProviderNotConfiguredError('sms', [
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN',
      'TWILIO_PHONE_NUMBER',
    ]);
  },
};
