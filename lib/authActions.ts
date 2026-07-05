import type { Provider, Session } from '@supabase/supabase-js';

import { friendlyAuthError } from '@/lib/authErrors';
import { getSupabase } from '@/lib/supabase';

export type AuthActionResult = {
  error: string | null;
};

function isAnonymousSession(session: Session | null): boolean {
  return session?.user.is_anonymous === true;
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthActionResult> {
  const client = getSupabase();

  const { error } = await client.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  return { error: error ? friendlyAuthError(error) : null };
}

/**
 * Creates a new account, or upgrades an anonymous session to a permanent
 * email/password account via updateUser (preserving the same auth.uid()).
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  currentSession: Session | null,
): Promise<AuthActionResult> {
  const client = getSupabase();
  const trimmedEmail = email.trim();

  if (isAnonymousSession(currentSession)) {
    const { error } = await client.auth.updateUser({
      email: trimmedEmail,
      password,
    });
    return { error: error ? friendlyAuthError(error) : null };
  }

  const { error } = await client.auth.signUp({
    email: trimmedEmail,
    password,
  });

  return { error: error ? friendlyAuthError(error) : null };
}

/**
 * Upgrades an anonymous session to a permanent OAuth account, or starts a
 * fresh OAuth sign-in when no anonymous session exists.
 */
export async function signInWithOAuthProvider(
  provider: Provider,
  currentSession: Session | null,
  redirectTo: string,
): Promise<AuthActionResult & { url: string | null }> {
  const client = getSupabase();

  if (isAnonymousSession(currentSession)) {
    const { data, error } = await client.auth.linkIdentity({
      provider,
      options: { redirectTo, skipBrowserRedirect: true },
    });
    return {
      error: error ? friendlyAuthError(error) : null,
      url: data?.url ?? null,
    };
  }

  const { data, error } = await client.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });

  return {
    error: error ? friendlyAuthError(error) : null,
    url: data?.url ?? null,
  };
}

export async function signOut(): Promise<AuthActionResult> {
  const client = getSupabase();
  const { error } = await client.auth.signOut();
  return { error: error ? friendlyAuthError(error) : null };
}
