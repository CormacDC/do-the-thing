import { corsHeaders } from '../_shared/cors.ts';
import { DEFAULT_SMS_TEMPLATE } from '../_shared/config.ts';
import { jsonResponse } from '../_shared/response.ts';
import { getSupabaseAdmin, getTwilioEnv, requireMatchingUser } from '../_shared/supabase.ts';
import {
  cancelTwilioMessage,
  replaceNameToken,
  resolveSendAtIso,
  scheduleTwilioMessage,
} from '../_shared/twilio.ts';

type ScheduleSmsRequest = {
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
    const body = (await req.json()) as ScheduleSmsRequest;
    const userId = body.user_id;

    if (!userId) {
      return jsonResponse({ error: 'user_id is required' }, 400);
    }

    const auth = await requireMatchingUser(req, userId);
    if (!auth.ok) return auth.response;

    const admin = getSupabaseAdmin();
    const twilio = getTwilioEnv();

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('display_name, partner_phone, custom_sms')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('[schedule-sms] profile fetch failed:', profileError);
      return jsonResponse({ error: 'Failed to load profile' }, 500);
    }

    if (!profile?.partner_phone) {
      return jsonResponse({ error: 'Accountability partner phone not configured' }, 400);
    }

    const { data: deadline, error: deadlineError } = await admin
      .from('deadlines')
      .select('id, deadline_at, twilio_message_sid')
      .eq('user_id', userId)
      .maybeSingle();

    if (deadlineError) {
      console.error('[schedule-sms] deadline fetch failed:', deadlineError);
      return jsonResponse({ error: 'Failed to load deadline' }, 500);
    }

    if (!deadline?.deadline_at) {
      return jsonResponse({ error: 'No active deadline found' }, 400);
    }

    if (deadline.twilio_message_sid) {
      try {
        await cancelTwilioMessage(twilio, deadline.twilio_message_sid);
      } catch (err) {
        console.warn('[schedule-sms] failed to cancel previous message:', err);
      }
    }

    const template = profile.custom_sms?.trim() || DEFAULT_SMS_TEMPLATE;
    const messageBody = replaceNameToken(template, profile.display_name);
    const sendAt = resolveSendAtIso(deadline.deadline_at);

    const messageSid = await scheduleTwilioMessage(
      twilio,
      profile.partner_phone,
      messageBody,
      sendAt,
    );

    const { error: updateError } = await admin
      .from('deadlines')
      .update({ twilio_message_sid: messageSid })
      .eq('user_id', userId);

    if (updateError) {
      console.error('[schedule-sms] failed to store message SID:', updateError);
      return jsonResponse({ error: 'Failed to store scheduled message' }, 500);
    }

    return jsonResponse({ ok: true, message_sid: messageSid, send_at: sendAt });
  } catch (err) {
    console.error('[schedule-sms] unexpected error:', err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      500,
    );
  }
});
