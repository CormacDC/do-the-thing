import { ACCOUNTABILITY_CHANNEL } from '@/lib/config';
import { getSupabase } from '@/lib/supabase';

type AccountabilityFunction =
  | 'schedule-accountability'
  | 'cancel-accountability'
  | 'schedule-sms'
  | 'cancel-sms';

/**
 * Fire-and-forget Edge Function invocation. Errors are logged in dev only and
 * never propagate to callers — accountability failures must not block state transitions.
 */
function invokeSilent(functionName: AccountabilityFunction, userId: string): void {
  try {
    const supabase = getSupabase();
    void supabase.functions
      .invoke(functionName, { body: { user_id: userId } })
      .then(({ error }) => {
        if (error && __DEV__) {
          console.warn(`[Do The Thing] ${functionName} failed:`, error);
        }
      })
      .catch((err: unknown) => {
        if (__DEV__) console.warn(`[Do The Thing] ${functionName} failed:`, err);
      });
  } catch (err) {
    if (__DEV__) console.warn(`[Do The Thing] ${functionName} failed:`, err);
  }
}

/**
 * Schedule accountability delivery when the app enters ACTIVE state.
 * Push path marks pending intent in Supabase; SMS path is intentionally inert.
 */
export function scheduleAccountability(userId: string): void {
  if (ACCOUNTABILITY_CHANNEL === 'sms') {
    scheduleAccountabilitySms(userId);
    return;
  }
  invokeSilent('schedule-accountability', userId);
}

/**
 * Cancel pending accountability delivery when the daily quota is met.
 */
export function cancelAccountability(userId: string): void {
  if (ACCOUNTABILITY_CHANNEL === 'sms') {
    cancelAccountabilitySms(userId);
    return;
  }
  invokeSilent('cancel-accountability', userId);
}

/**
 * SMS stub — logs in dev and does not invoke Twilio.
 * Kept so the channel can be revived without rewriting callers.
 */
export function scheduleAccountabilitySms(userId: string): void {
  if (__DEV__) {
    console.warn(
      `[Do The Thing] scheduleAccountabilitySms no-op (SMS disabled). userId=${userId}`,
    );
  }
}

/**
 * SMS stub — logs in dev and does not invoke Twilio.
 */
export function cancelAccountabilitySms(userId: string): void {
  if (__DEV__) {
    console.warn(
      `[Do The Thing] cancelAccountabilitySms no-op (SMS disabled). userId=${userId}`,
    );
  }
}
