import { corsHeaders } from '../_shared/cors.ts';
import { jsonResponse } from '../_shared/response.ts';
import { getSupabaseAdmin, requireMatchingUser } from '../_shared/supabase.ts';

type CancelRequest = {
  user_id?: string;
};

/**
 * Cancels pending accountability delivery when the daily quota is met.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = (await req.json()) as CancelRequest;
    const userId = body.user_id;

    if (!userId) {
      return jsonResponse({ error: 'user_id is required' }, 400);
    }

    const auth = await requireMatchingUser(req, userId);
    if (!auth.ok) return auth.response;

    const admin = getSupabaseAdmin();

    const { data: deadline, error: deadlineError } = await admin
      .from('deadlines')
      .select('accountability_status')
      .eq('user_id', userId)
      .maybeSingle();

    if (deadlineError) {
      console.error('[cancel-accountability] deadline fetch failed:', deadlineError);
      return jsonResponse({ error: 'Failed to load deadline' }, 500);
    }

    if (!deadline) {
      return jsonResponse({ ok: true, canceled: false, reason: 'no_deadline' });
    }

    if (deadline.accountability_status !== 'pending') {
      return jsonResponse({
        ok: true,
        canceled: false,
        reason: 'not_pending',
        status: deadline.accountability_status,
      });
    }

    const { error: updateError } = await admin
      .from('deadlines')
      .update({ accountability_status: 'cancelled' })
      .eq('user_id', userId)
      .eq('accountability_status', 'pending');

    if (updateError) {
      console.error('[cancel-accountability] update failed:', updateError);
      return jsonResponse({ error: 'Failed to cancel accountability' }, 500);
    }

    return jsonResponse({ ok: true, canceled: true });
  } catch (err) {
    console.error('[cancel-accountability] unexpected error:', err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      500,
    );
  }
});
