import { corsHeaders } from '../_shared/cors.ts';
import { jsonResponse } from '../_shared/response.ts';
import {
  describeUnknownError,
  getSupabaseAdmin,
  requireMatchingUser,
} from '../_shared/supabase.ts';

type ScheduleRequest = {
  user_id?: string;
};

/**
 * Marks the user's deadline as pending accountability delivery.
 * Actual push happens at deadline time via dispatch-accountability.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = (await req.json()) as ScheduleRequest;
    const userId = body.user_id;

    if (!userId) {
      return jsonResponse({ error: 'user_id is required' }, 400);
    }

    const auth = await requireMatchingUser(req, userId);
    if (!auth.ok) return auth.response;

    const admin = getSupabaseAdmin();

    // GET + limit(1), not HEAD count: head:true returns an empty body, so
    // PostgREST/Kong errors surface as `{ message: "" }` from Edge Functions.
    const { data: targets, error: targetError } = await admin
      .from('accountability_targets')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (targetError) {
      console.error(
        '[schedule-accountability] target count failed:',
        describeUnknownError(targetError),
      );
      return jsonResponse({ error: 'Failed to load targets' }, 500);
    }

    if (!targets || targets.length < 1) {
      const { error: skipError } = await admin
        .from('deadlines')
        .update({
          accountability_status: 'skipped',
          accountability_sent_at: null,
        })
        .eq('user_id', userId);

      if (skipError) {
        console.error(
          '[schedule-accountability] skip update failed:',
          describeUnknownError(skipError),
        );
        return jsonResponse({ error: 'Failed to update deadline' }, 500);
      }

      return jsonResponse({ ok: true, status: 'skipped', reason: 'no_targets' });
    }

    const { error: updateError } = await admin
      .from('deadlines')
      .update({
        accountability_status: 'pending',
        accountability_sent_at: null,
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error(
        '[schedule-accountability] pending update failed:',
        describeUnknownError(updateError),
      );
      return jsonResponse({ error: 'Failed to schedule accountability' }, 500);
    }

    return jsonResponse({ ok: true, status: 'pending' });
  } catch (err) {
    console.error('[schedule-accountability] unexpected error:', err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      500,
    );
  }
});
