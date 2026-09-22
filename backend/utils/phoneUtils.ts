/**
 * Phone number normalization and E.164 compliance utility.
 * Specifically handles Indian mobile phone numbers seamlessly, as well
 * as general international E.164 phone numbers.
 */

// Standard E.164 regex: + followed by 7 to 15 digits (starting with non-zero country code)
export const E164_REGEX = /^\+[1-9]\d{6,14}$/;

export interface PhoneNormalizationResult {
  valid: boolean;
  normalized?: string;
  error?: string;
}

/**
 * Normalizes an input phone number to standard E.164 format.
 *
 * Handles:
 * - 10-digit Indian numbers starting with 6, 7, 8, 9 (e.g., "9121314151") -> "+919121314151"
 * - 11-digit Indian numbers with trunk prefix "0" (e.g., "09121314151") -> "+919121314151"
 * - 12-digit Indian numbers with country code without plus (e.g., "919121314151") -> "+919121314151"
 * - Formatted Indian numbers (e.g., "+91 91213 14151", "+91-9121314151") -> "+919121314151"
 * - International numbers already containing country codes (e.g., "+1 555-999-8888") -> "+15559998888"
 * - International double-zero prefix (e.g., "0015559998888") -> "+15559998888"
 */
export function normalizePhoneNumber(rawPhone: string | null | undefined): PhoneNormalizationResult {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return { valid: false, error: 'Phone number is required.' };
  }

  const trimmed = rawPhone.trim();
  if (!trimmed) {
    return { valid: false, error: 'Phone number cannot be empty.' };
  }

  // Remove whitespace, hyphens, brackets, dots
  let cleaned = trimmed.replace(/[\s\-().]/g, '');

  // 1. Handle international prefix "00"
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }

  // 2. If it already starts with "+"
  if (cleaned.startsWith('+')) {
    const digitsOnly = cleaned.slice(1);
    if (!/^\d+$/.test(digitsOnly)) {
      return { valid: false, error: 'Phone number contains invalid characters.' };
    }

    const normalized = '+' + digitsOnly;
    if (!E164_REGEX.test(normalized)) {
      return {
        valid: false,
        error: 'Invalid international phone number format. Please check country code and digits.',
      };
    }

    return { valid: true, normalized };
  }

  // Ensure remaining characters are all digits
  if (!/^\d+$/.test(cleaned)) {
    return { valid: false, error: 'Phone number contains invalid characters.' };
  }

  // 3. Indian Trunk prefix "0" followed by 10 digits (e.g., "09121314151")
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    const tenDigits = cleaned.slice(1);
    if (/^[6-9]\d{9}$/.test(tenDigits)) {
      return { valid: true, normalized: `+91${tenDigits}` };
    }
  }

  // 4. 10-digit Indian Mobile Number (starts with 6, 7, 8, 9)
  if (cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned)) {
    return { valid: true, normalized: `+91${cleaned}` };
  }

  // 5. 12-digit Indian number without "+" (starts with 91 followed by 6, 7, 8, 9 and 9 more digits)
  if (cleaned.length === 12 && cleaned.startsWith('91') && /^91[6-9]\d{9}$/.test(cleaned)) {
    return { valid: true, normalized: `+${cleaned}` };
  }

  // 6. 11-digit North American Number without "+" (e.g., "15559998888")
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return { valid: true, normalized: `+${cleaned}` };
  }

  // 7. Check if adding "+" makes it a valid general E.164 number (7-15 digits)
  const candidate = `+${cleaned}`;
  if (E164_REGEX.test(candidate)) {
    return { valid: true, normalized: candidate };
  }

  return {
    valid: false,
    error: 'Invalid phone number format. Please enter a valid 10-digit mobile number or full international format with country code.',
  };
}
