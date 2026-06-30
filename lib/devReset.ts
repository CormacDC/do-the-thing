import { getNextDeadlineISO } from '@/lib/deadline';
import { getSupabase } from '@/lib/supabase';
import type { DeadlineRow } from '@/types/deadline';

export type DevDayResetResult =
  | { ok: true; row: DeadlineRow }
  | { ok: false; error: string };

/**
 * Dev-only: restart the deadline/quota cycle without modifying tasks.
 * Puts the user back into ACTIVE with a fresh countdown and zeroed progress.
 */
export async function performDevDayReset(userId: string): Promise<DevDayResetResult> {
  const supabase = getSupabase();

  const { data: existing, error: fetchError } = await supabase
    .from('deadlines')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError) {
    if (__DEV__) console.warn('[Do The Thing] devReset fetch failed:', fetchError);
    return { ok: false, error: "We couldn't load your deadline. Try again." };
  }

  if (!existing || existing.daily_quota < 1) {
    return { ok: false, error: 'Set a quota first — add a task to get started.' };
  }

  const now = new Date().toISOString();
  const deadlineAt = getNextDeadlineISO();

  const { data, error: updateError } = await supabase
    .from('deadlines')
    .update({
      status: 'active',
      tasks_completed_today: 0,
      deadline_at: deadlineAt,
      last_reset_at: now,
      last_quota_adjusted_at: null,
      twilio_message_sid: null,
    })
    .eq('user_id', userId)
    .select('*')
    .single();

  if (updateError) {
    if (__DEV__) console.warn('[Do The Thing] devReset update failed:', updateError);
    return { ok: false, error: "We couldn't reset the day. Try again." };
  }

  return { ok: true, row: data };
}
