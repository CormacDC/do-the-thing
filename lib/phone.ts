/** E.164 phone numbers: + followed by 2–15 digits, first digit non-zero. */
const E164_PATTERN = /^\+[1-9]\d{1,14}$/;

export function isValidE164Phone(value: string): boolean {
  return E164_PATTERN.test(value.trim());
}

export function formatPhoneHint(): string {
  return 'Include country code, e.g. +14155552671';
}
