import { ACCOUNTABILITY_CHANNEL } from '../_shared/config.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { jsonResponse } from '../_shared/response.ts';
import { requireMatchingUser } from '../_shared/supabase.ts';

type CancelSmsRequest = {
  user_id?: string;
};

/**
 * Twilio SMS cancellation — intentionally disabled while ACCOUNTABILITY_CHANNEL !== 'sms'.
 * Full Twilio implementation is preserved in unused helpers under _shared/twilio.ts.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    if (ACCOUNTABILITY_CHANNEL !== 'sms') {
      return jsonResponse({
        ok: true,
        disabled: true,
        canceled: false,
        reason: 'sms_channel_disabled',
        channel: ACCOUNTABILITY_CHANNEL,
      });
    }

    const body = (await req.json()) as CancelSmsRequest;
    const userId = body.user_id;

    if (!userId) {
      return jsonResponse({ error: 'user_id is required' }, 400);
    }

    const auth = await requireMatchingUser(req, userId);
    if (!auth.ok) return auth.response;

    return jsonResponse({
      ok: false,
      disabled: true,
      reason: 'sms_not_implemented',
    }, 501);
  } catch (err) {
    console.error('[cancel-sms] unexpected error:', err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      500,
    );
  }
});
