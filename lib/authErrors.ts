import type { AuthError } from '@supabase/supabase-js';

/**
 * Maps Supabase auth errors to user-safe messages. Never includes PII or
 * raw provider responses.
 */
export function friendlyAuthError(error: AuthError | Error | null | undefined): string {
  if (!error) return 'Something went wrong. Try again.';

  const code = 'code' in error ? error.code : undefined;
  const status = 'status' in error ? error.status : undefined;

  switch (code) {
    case 'invalid_credentials':
    case 'invalid_grant':
      return 'Email or password is incorrect.';
    case 'user_already_exists':
    case 'email_exists':
      return 'An account with this email already exists. Try signing in.';
    case 'weak_password':
      return 'Choose a stronger password (at least 6 characters).';
    case 'email_not_confirmed':
      return 'Check your email to confirm your account, then try again.';
    case 'signup_disabled':
      return 'Sign up is not available right now. Try again later.';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'Too many attempts. Wait a moment and try again.';
    case 'session_not_found':
    case 'refresh_token_not_found':
      return 'Your session expired. Please sign in again.';
    case 'identity_already_linked':
      return 'This account is already linked. Try signing in instead.';
    case 'manual_linking_disabled':
      return 'Account linking is not available. Try again later.';
    default:
      break;
  }

  if (status === 401 || status === 403) {
    return 'Your session expired. Please sign in again.';
  }

  return 'Something went wrong. Try again.';
}
