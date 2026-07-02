import { getSupabase } from '@/lib/supabase';

/**
 * Fire-and-forget Edge Function invocation. Errors are logged in dev only and
 * never propagate to callers — SMS failures must not block state transitions.
 */
function invokeSilent(functionName: 'schedule-sms' | 'cancel-sms', userId: string): void {
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

/** Schedule accountability SMS when the app enters ACTIVE state. */
export function scheduleAccountabilitySms(userId: string): void {
  invokeSilent('schedule-sms', userId);
}

/** Cancel accountability SMS when the daily quota is met. */
export function cancelAccountabilitySms(userId: string): void {
  invokeSilent('cancel-sms', userId);
}
