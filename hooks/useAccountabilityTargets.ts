import { useCallback, useEffect, useMemo, useState } from 'react';

import { supabase } from '@/lib/supabase';

export type UseAccountabilityTargetsResult = {
  partnerIds: string[];
  targetCount: number;
  loading: boolean;
  error: string | null;
  mutationError: string | null;
  dismissMutationError: () => void;
  setNotifyTarget: (partnerId: string, enabled: boolean) => Promise<boolean>;
  reload: () => void;
};

/**
 * Owns notify-target fetch/mutations separately from the friends list.
 * Quota gating should depend on {@link targetCount} from this hook.
 */
export function useAccountabilityTargets(
  userId: string | null,
): UseAccountabilityTargetsResult {
  const [partnerIds, setPartnerIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!supabase || !userId) {
      setPartnerIds([]);
      setLoading(false);
      setError(null);
      return;
    }

    const client = supabase;
    const ownerId = userId;
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: queryError } = await client
          .from('accountability_targets')
          .select('partner_id')
          .eq('user_id', ownerId);

        if (cancelled) return;
        if (queryError) throw queryError;

        setPartnerIds((data ?? []).map((row) => row.partner_id));
      } catch (err) {
        if (cancelled) return;
        if (__DEV__) console.warn('[Do The Thing] load targets failed:', err);
        setError("We couldn't load notify targets. Try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [userId, reloadKey]);

  const setNotifyTarget = useCallback(
    async (partnerId: string, enabled: boolean): Promise<boolean> => {
      if (!supabase || !userId) return false;
      setMutationError(null);

      try {
        if (enabled) {
          const { error: rpcError } = await supabase.rpc('set_accountability_target', {
            p_partner_id: partnerId,
          });
          if (rpcError) throw rpcError;
        } else {
          const { error: rpcError } = await supabase.rpc('remove_accountability_target', {
            p_partner_id: partnerId,
          });
          if (rpcError) throw rpcError;
        }
        setReloadKey((k) => k + 1);
        return true;
      } catch (err) {
        if (__DEV__) console.warn('[Do The Thing] notify target failed:', err);
        const message =
          err && typeof err === 'object' && 'message' in err
            ? String((err as { message: string }).message)
            : "We couldn't update notify targets.";
        setMutationError(message);
        return false;
      }
    },
    [userId],
  );

  const dismissMutationError = useCallback(() => setMutationError(null), []);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  return useMemo(
    () => ({
      partnerIds,
      targetCount: partnerIds.length,
      loading,
      error,
      mutationError,
      dismissMutationError,
      setNotifyTarget,
      reload,
    }),
    [
      partnerIds,
      loading,
      error,
      mutationError,
      dismissMutationError,
      setNotifyTarget,
      reload,
    ],
  );
}
