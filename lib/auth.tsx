import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  signInWithEmail,
  signOut as authSignOut,
  signUpWithEmail,
  type AuthActionResult,
} from '@/lib/authActions';
import { friendlyAuthError } from '@/lib/authErrors';
import { supabase } from '@/lib/supabase';

export type AuthState = {
  session: Session | null;
  userId: string | null;
  isAnonymous: boolean;
  loading: boolean;
  error: string | null;
  retry: () => void;
  signInWithEmail: (email: string, password: string) => Promise<AuthActionResult>;
  signUpWithEmail: (email: string, password: string) => Promise<AuthActionResult>;
  signOut: () => Promise<AuthActionResult>;
};

export const AuthContext = createContext<AuthState | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const bootstrappedRef = useRef(false);
  const sessionRef = useRef<Session | null>(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setError(
        "Supabase isn't configured. Add your project URL and anon key to .env, then restart.",
      );
      return;
    }

    let cancelled = false;
    bootstrappedRef.current = false;

    async function bootstrap() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: sessionError } = await supabase!.auth.getSession();
        if (cancelled) return;
        if (sessionError) throw sessionError;

        setSession(data.session ?? null);
      } catch (err) {
        if (cancelled) return;
        if (__DEV__) {
          console.warn('[Do The Thing] auth bootstrap failed');
        }
        setError(friendlyAuthError(err instanceof Error ? err : null));
      } finally {
        if (!cancelled) {
          bootstrappedRef.current = true;
          setLoading(false);
        }
      }
    }

    bootstrap();

    const { data: listener } = supabase.auth.onAuthStateChange((event, next) => {
      if (!bootstrappedRef.current) return;

      if (event === 'SIGNED_OUT') {
        setSession(null);
        return;
      }

      setSession(next ?? null);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [attempt]);

  const handleSignInWithEmail = useCallback(
    (email: string, password: string) => signInWithEmail(email, password),
    [],
  );

  const handleSignUpWithEmail = useCallback(
    (email: string, password: string) =>
      signUpWithEmail(email, password, sessionRef.current),
    [],
  );

  const handleSignOut = useCallback(() => authSignOut(), []);

  const value: AuthState = {
    session,
    userId: session?.user.id ?? null,
    isAnonymous: session?.user.is_anonymous === true,
    loading,
    error,
    retry: () => setAttempt((n) => n + 1),
    signInWithEmail: handleSignInWithEmail,
    signUpWithEmail: handleSignUpWithEmail,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
