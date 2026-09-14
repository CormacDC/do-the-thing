// Hour (0-23, local time) at which the daily deadline resets.
// Default is 0 (midnight). Change for testing purposes.
export const DEADLINE_HOUR = 0;

// Minute (0-59) at which the daily deadline resets.
// Default is 0. Change for testing purposes.
export const DEADLINE_MINUTE = 0;

// Dev-only: show "Reset day" button to restart the quota timer for expiry testing.
// Set to false to hide without deleting dev reset files.
export const ENABLE_DEV_RESET = typeof __DEV__ !== 'undefined' && __DEV__;

/**
 * Live accountability delivery channel.
 * `'push'` — Expo remote push to in-app friends (current).
 * `'sms'` — Twilio path; kept as a stub and must not be enabled without reviving Edge Functions.
 */
export type AccountabilityChannel = 'push' | 'sms';

export const ACCOUNTABILITY_CHANNEL: AccountabilityChannel = 'push';
