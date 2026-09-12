import {
  evaluateAccountabilityEligibility,
  resolveAccountabilityMessage,
} from '../_shared/accountabilityMessage.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { collectInvalidPushTokens, sendExpoPush } from '../_shared/expoPush.ts';
import { jsonResponse } from '../_shared/response.ts';
import { getSupabaseAdmin } from '../_shared/supabase.ts';

/**
 * Cron-only dispatcher: claim due pending deadlines, push to targets, expire.
 * Auth: Authorization Bearer must match CRON_SECRET (verify_jwt = false).
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const cronSecret = Deno.env.get('CRON_SECRET');
    if (!cronSecret) {
      console.error('[dispatch-accountability] CRON_SECRET is not set');
      return jsonResponse({ error: 'Server misconfigured' }, 500);
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : authHeader;

    if (token !== cronSecret) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const admin = getSupabaseAdmin();
    const nowIso = new Date().toISOString();

    // Atomically claim due pending rows by flipping status to a transient claim
    // via update...returning. We use 'skipped' only after evaluation; claim by
    // setting accountability_sent_at sentinel? Better: select then update with
    // pending filter. Overlap protection: update where pending AND deadline due
    // AND accountability_sent_at is null, setting a claim timestamp first.

    const { data: claimed, error: claimError } = await admin
      .from('deadlines')
      .update({ accountability_sent_at: nowIso })
      .eq('status', 'active')
      .eq('accountability_status', 'pending')
      .lte('deadline_at', nowIso)
      .is('accountability_sent_at', null)
      .select(
        'id, user_id, daily_quota, tasks_completed_today, status, accountability_status, deadline_at',
      );

    if (claimError) {
      console.error('[dispatch-accountability] claim failed:', claimError);
      return jsonResponse({ error: 'Failed to claim deadlines' }, 500);
    }

    const rows = claimed ?? [];
    let sent = 0;
    let skipped = 0;
    let cancelled = 0;

    for (const row of rows) {
      const userId = row.user_id as string;

      const { data: targets, error: targetsError } = await admin
        .from('accountability_targets')
        .select('partner_id')
        .eq('user_id', userId);

      if (targetsError) {
        console.error('[dispatch-accountability] targets failed:', targetsError);
        await markSkipped(admin, userId, 'targets_error', row.deadline_at as string);
        skipped += 1;
        continue;
      }

      const partnerIds = (targets ?? []).map((t) => t.partner_id as string);

      let tokens: string[] = [];
      if (partnerIds.length > 0) {
        const { data: tokenRows, error: tokenError } = await admin
          .from('push_tokens')
          .select('expo_push_token')
          .in('user_id', partnerIds);

        if (tokenError) {
          console.error('[dispatch-accountability] tokens failed:', tokenError);
          await markSkipped(admin, userId, 'tokens_error', row.deadline_at as string);
          skipped += 1;
          continue;
        }
        tokens = (tokenRows ?? []).map((t) => t.expo_push_token as string);
      }

      const { count: priorityCount } = await admin
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_priority', true)
        .eq('is_complete', false);

      const decision = evaluateAccountabilityEligibility({
        deadlineStatus: row.status as string,
        accountabilityStatus: 'pending',
        tasksCompletedToday: row.tasks_completed_today as number,
        dailyQuota: row.daily_quota as number,
        hasPriorityTasks: (priorityCount ?? 0) > 0,
        targetCount: partnerIds.length,
        tokenCount: tokens.length,
      });

      if (decision.action === 'cancel') {
        await admin
          .from('deadlines')
          .update({
            accountability_status: 'cancelled',
            status: 'complete',
            tasks_completed_today: 0,
            last_reset_at: nowIso,
            deadline_at: advanceDeadline(row.deadline_at as string),
          })
          .eq('user_id', userId);
        cancelled += 1;
        continue;
      }

      if (decision.action === 'skip') {
        await expireAsSkipped(admin, userId, nowIso, row.deadline_at as string);
        skipped += 1;
        continue;
      }

      const { data: profile } = await admin
        .from('profiles')
        .select('display_name, custom_sms')
        .eq('id', userId)
        .maybeSingle();

      const body = resolveAccountabilityMessage(
        profile?.custom_sms,
        decision.missType,
        {
          name: profile?.display_name ?? 'Someone',
          completed: row.tasks_completed_today as number,
          quota: row.daily_quota as number,
        },
      );

      const messages = tokens.map((to) => ({
        to,
        title: 'Do The Thing',
        body,
        sound: 'default' as const,
        data: { type: 'accountability', user_id: userId },
      }));

      try {
        const tickets = await sendExpoPush(messages);
        const invalid = collectInvalidPushTokens(messages, tickets);
        if (invalid.length > 0) {
          await admin.from('push_tokens').delete().in('expo_push_token', invalid);
        }
      } catch (err) {
        console.error('[dispatch-accountability] push failed:', err);
        await expireAsSkipped(admin, userId, nowIso, row.deadline_at as string);
        skipped += 1;
        continue;
      }

      await admin
        .from('deadlines')
        .update({
          accountability_status: 'sent',
          accountability_sent_at: nowIso,
          status: 'expired',
          tasks_completed_today: 0,
          last_reset_at: nowIso,
          deadline_at: advanceDeadline(row.deadline_at as string),
        })
        .eq('user_id', userId);

      sent += 1;
    }

    return jsonResponse({
      ok: true,
      claimed: rows.length,
      sent,
      skipped,
      cancelled,
    });
  } catch (err) {
    console.error('[dispatch-accountability] unexpected error:', err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      500,
    );
  }
});

async function markSkipped(
  admin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  reason: string,
  previousDeadlineAt: string,
): Promise<void> {
  console.warn(`[dispatch-accountability] skip user=${userId} reason=${reason}`);
  await expireAsSkipped(admin, userId, new Date().toISOString(), previousDeadlineAt);
}

async function expireAsSkipped(
  admin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  nowIso: string,
  previousDeadlineAt?: string,
): Promise<void> {
  await admin
    .from('deadlines')
    .update({
      accountability_status: 'skipped',
      accountability_sent_at: nowIso,
      status: 'expired',
      tasks_completed_today: 0,
      last_reset_at: nowIso,
      ...(previousDeadlineAt
        ? { deadline_at: advanceDeadline(previousDeadlineAt) }
        : {}),
    })
    .eq('user_id', userId);
}

function advanceDeadline(deadlineAtIso: string): string {
  const next = new Date(deadlineAtIso);
  if (Number.isNaN(next.getTime())) {
    return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  }
  next.setTime(next.getTime() + 24 * 60 * 60 * 1000);
  return next.toISOString();
}
