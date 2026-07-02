import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { jsonResponse } from './response.ts';

export function getSupabaseAdmin(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(url, serviceRoleKey);
}

export function getSupabaseUserClient(authHeader: string): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!url || !anonKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  }

  return createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
}

export async function requireMatchingUser(
  req: Request,
  userId: string,
): Promise<{ ok: true } | { ok: false; response: Response }> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return { ok: false, response: jsonResponse({ error: 'Unauthorized' }, 401) };
  }

  const supabase = getSupabaseUserClient(authHeader);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false, response: jsonResponse({ error: 'Unauthorized' }, 401) };
  }

  if (user.id !== userId) {
    return { ok: false, response: jsonResponse({ error: 'Forbidden' }, 403) };
  }

  return { ok: true };
}

export function getTwilioEnv(): {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
} {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const phoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

  if (!accountSid || !authToken || !phoneNumber) {
    throw new Error(
      'Missing Twilio secrets. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.',
    );
  }

  return { accountSid, authToken, phoneNumber };
}
