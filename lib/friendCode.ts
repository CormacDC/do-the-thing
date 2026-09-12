/** Unambiguous alphabet (no 0/O, 1/I/L). */
export const FRIEND_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const FRIEND_CODE_LENGTH = 6;

const FRIEND_CODE_PATTERN = new RegExp(
  `^[${FRIEND_CODE_ALPHABET}]{${FRIEND_CODE_LENGTH}}$`,
);

/** Normalize user input: trim + uppercase. */
export function normalizeFriendCode(raw: string): string {
  return raw.trim().toUpperCase();
}

/** True when the code matches the allowed alphabet and length. */
export function isValidFriendCode(raw: string): boolean {
  return FRIEND_CODE_PATTERN.test(normalizeFriendCode(raw));
}

/**
 * Generate a random friend code. Prefer the DB generator for persistence;
 * this is for client-side preview / tests.
 */
export function generateFriendCode(random: () => number = Math.random): string {
  let code = '';
  for (let i = 0; i < FRIEND_CODE_LENGTH; i += 1) {
    const index = Math.floor(random() * FRIEND_CODE_ALPHABET.length);
    code += FRIEND_CODE_ALPHABET[index];
  }
  return code;
}
