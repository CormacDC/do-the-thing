import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { registerForPushNotificationsAsync, savePushToken } from '@/lib/pushToken';

export type UsePushTokenResult = {
  token: string | null;
  permissionGranted: boolean | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

/**
 * Registers for Expo push on login and app foreground. Failures never crash the app.
 */
export function usePushToken(userId: string | null): UsePushTokenResult {
  const [token, setToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshing = useRef(false);

  const refresh = useCallback(async () => {
    if (!userId || refreshing.current) return;
    refreshing.current = true;
    setLoading(true);
    setError(null);

    try {
      const result = await registerForPushNotificationsAsync();
      if (!result.ok) {
        setPermissionGranted(false);
        setToken(null);
        setError(result.reason);
        return;
      }

      setPermissionGranted(true);
      setToken(result.token);
      await savePushToken(userId, result.token);
    } finally {
      setLoading(false);
      refreshing.current = false;
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state === 'active') {
        void refresh();
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [refresh]);

  return { token, permissionGranted, loading, error, refresh };
}
