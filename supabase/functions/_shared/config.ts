// Keep in sync with /lib/config.ts — used when deadline_at is unavailable.
export const DEADLINE_HOUR = 0;
export const DEADLINE_MINUTE = 0;

/** Default SMS copy when the user has not set a custom message. */
export const DEFAULT_SMS_TEMPLATE =
  "{name} didn't complete all of their tasks yesterday.";

/** Twilio requires scheduled messages to be at least 15 minutes in the future. */
export const TWILIO_MIN_SCHEDULE_MS = 15 * 60 * 1000;
