// Keep in sync with /lib/config.ts — used when deadline_at is unavailable.
export const DEADLINE_HOUR = 0;
export const DEADLINE_MINUTE = 0;

/**
 * Live accountability delivery channel.
 * Keep in sync with /lib/config.ts. SMS Edge Functions short-circuit when not 'sms'.
 */
export type AccountabilityChannel = 'push' | 'sms';
export const ACCOUNTABILITY_CHANNEL: AccountabilityChannel = 'push';

/** Default accountability copy when the user has not set a custom message. */
export const DEFAULT_ACCOUNTABILITY_TEMPLATE =
  "{name} didn't complete all of their tasks yesterday.";

/** @deprecated Prefer DEFAULT_ACCOUNTABILITY_TEMPLATE. Kept for SMS stub path. */
export const DEFAULT_SMS_TEMPLATE = DEFAULT_ACCOUNTABILITY_TEMPLATE;

/** Twilio requires scheduled messages to be at least 15 minutes in the future. */
export const TWILIO_MIN_SCHEDULE_MS = 15 * 60 * 1000;
