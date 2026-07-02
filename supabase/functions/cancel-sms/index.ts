import { corsHeaders } from '../_shared/cors.ts';
import { jsonResponse } from '../_shared/response.ts';
import { getSupabaseAdmin, getTwilioEnv, requireMatchingUser } from '../_shared/supabase.ts';
import { cancelTwilioMessage } from '../_shared/twilio.ts';

type CancelSmsRequest = {
  user_id?: string;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = (await req.json()) as CancelSmsRequest;
    const userId = body.user_id;

    if (!userId) {
      return jsonResponse({ error: 'user_id is required' }, 400);
    }

    const auth = await requireMatchingUser(req, userId);
    if (!auth.ok) return auth.response;

    const admin = getSupabaseAdmin();

    const { data: deadline, error: deadlineError } = await admin
      .from('deadlines')
      .select('twilio_message_sid')
      .eq('user_id', userId)
      .maybeSingle();

    if (deadlineError) {
      console.error('[cancel-sms] deadline fetch failed:', deadlineError);
      return jsonResponse({ error: 'Failed to load deadline' }, 500);
    }

    const messageSid = deadline?.twilio_message_sid;
    if (!messageSid) {
      return jsonResponse({ ok: true, canceled: false, reason: 'no_sid' });
    }

    const twilio = getTwilioEnv();
    let cancelResult: Awaited<ReturnType<typeof cancelTwilioMessage>>;

    try {
      cancelResult = await cancelTwilioMessage(twilio, messageSid);
    } catch (err) {
      console.error('[cancel-sms] Twilio cancel failed:', err);
      return jsonResponse({ ok: true, canceled: false, reason: 'twilio_error' });
    }

    if (cancelResult === 'already_sent') {
      console.warn(`[cancel-sms] message ${messageSid} was already sent`);
    }

    const { error: updateError } = await admin
      .from('deadlines')
      .update({ twilio_message_sid: null })
      .eq('user_id', userId);

    if (updateError) {
      console.error('[cancel-sms] failed to clear message SID:', updateError);
      return jsonResponse({ error: 'Failed to clear scheduled message' }, 500);
    }

    return jsonResponse({
      ok: true,
      canceled: cancelResult === 'canceled',
      reason: cancelResult,
    });
  } catch (err) {
    console.error('[cancel-sms] unexpected error:', err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      500,
    );
  }
});
