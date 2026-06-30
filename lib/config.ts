// Hour (0-23, local time) at which the daily deadline resets.
// Default is 0 (midnight). Change for testing purposes.
export const DEADLINE_HOUR = 15;

// Minute (0-59) at which the daily deadline resets.
// Default is 0. Change for testing purposes.
export const DEADLINE_MINUTE = 0;

// Dev-only: show "Reset day" button to restart the quota timer for expiry testing.
// Set to false to hide without deleting dev reset files.
export const ENABLE_DEV_RESET = __DEV__;
