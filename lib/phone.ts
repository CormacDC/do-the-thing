/** E.164 phone numbers: + followed by 2–15 digits, first digit non-zero. */
const E164_PATTERN = /^\+[1-9]\d{1,14}$/;

/**
 * ITU E.164 country calling codes that are three digits long.
 * Checked before the default two-digit rule so e.g. +358… → 358, not 35.
 */
const THREE_DIGIT_CALLING_CODES = new Set([
  '211', '212', '213', '216', '218', '220', '221', '222', '223', '224', '225', '226', '227', '228', '229',
  '230', '231', '232', '233', '234', '235', '236', '237', '238', '239', '240', '241', '242', '243', '244',
  '245', '246', '247', '248', '249', '250', '251', '252', '253', '254', '255', '256', '257', '258', '260',
  '261', '262', '263', '264', '265', '266', '267', '268', '269', '290', '291', '297', '298', '299',
  '350', '351', '352', '353', '354', '355', '356', '357', '358', '359', '370', '371', '372', '373', '374',
  '375', '376', '377', '378', '380', '381', '382', '383', '385', '386', '387', '389', '420', '421', '423',
  '500', '501', '502', '503', '504', '505', '506', '507', '508', '509', '590', '591', '592', '593', '594',
  '595', '596', '597', '598', '599', '670', '672', '673', '674', '675', '676', '677', '678', '679', '680',
  '681', '682', '683', '685', '686', '687', '688', '689', '690', '691', '692', '850', '852', '853', '855',
  '856', '880', '886', '960', '961', '962', '963', '964', '965', '966', '967', '968', '970', '971', '972',
  '973', '974', '975', '976', '977', '992', '993', '994', '995', '996', '998',
]);

/** Returns the length of the E.164 country calling code (1–3 digits). */
function callingCodeLength(digits: string): number {
  if (digits.length === 0) return 0;

  const first = digits[0];

  // North America and Russia/Kazakhstan use a single-digit calling code.
  if (first === '1' || first === '7') return 1;

  if (digits.length >= 3) {
    const prefix = digits.slice(0, 3);
    if (THREE_DIGIT_CALLING_CODES.has(prefix)) return 3;
  }

  // Most other countries use a two-digit calling code (France +33, Germany +49, etc.).
  if ('23456789'.includes(first)) return 2;

  return 1;
}

export function isValidE164Phone(value: string): boolean {
  return E164_PATTERN.test(value.trim());
}

export function formatPhoneHint(): string {
  return 'Include country code, e.g. +14155552671';
}

/** Masks a phone number for display, e.g. +1 •••• ••• 4567 or +33 •••• ••• 5678 */
export function maskPhoneNumber(phone: string): string {
  const trimmed = phone.trim();
  if (!E164_PATTERN.test(trimmed)) return '•••• ••••';

  const digits = trimmed.slice(1);
  const last4 = digits.slice(-4);

  if (digits.length <= 4) {
    return `•••• ${last4}`;
  }

  const ccLen = callingCodeLength(digits);
  if (ccLen >= digits.length - 4) {
    return `•••• ••• ${last4}`;
  }

  const countryCode = digits.slice(0, ccLen);
  return `+${countryCode} •••• ••• ${last4}`;
}
