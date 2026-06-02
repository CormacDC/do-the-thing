import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { supabase } from '@/lib/supabase';

export type AuthState = {
  session: Session | null;
  userId: string | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
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

        if (data.session) {
          setSession(data.session);
        } else {
          const { data: signInData, error: signInError } =
            await supabase!.auth.signInAnonymously();
          if (cancelled) return;
          if (signInError) throw signInError;
          setSession(signInData.session ?? null);
        }
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : 'Something went wrong signing in.';
        if (__DEV__) {
          console.warn('[Do The Thing] auth bootstrap failed:', err);
        }
        setError(friendlyAuthError(message));
      } finally {
        if (!cancelled) {
          bootstrappedRef.current = true;
          setLoading(false);
        }
      }
    }

    bootstrap();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      // Only sync state after the initial bootstrap to avoid clobbering loading flow.
      if (bootstrappedRef.current) {
        setSession(next ?? null);
      }
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [attempt]);

  const value: AuthState = {
    session,
    userId: session?.user.id ?? null,
    loading,
    error,
    retry: () => setAttempt((n) => n + 1),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function friendlyAuthError(_message: string): string {
  return "We couldn't sign you in. Check your connection and try again.";
}
