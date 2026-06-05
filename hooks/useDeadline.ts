import { useCallback, useEffect, useRef, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { Deadline, DeadlineRow, DeadlineStatus } from '@/types/deadline';

function fromRow(row: DeadlineRow): Deadline {
  return {
    id: row.id,
    deadlineAt: row.deadline_at,
    durationSeconds: row.duration_seconds,
    status: row.status as DeadlineStatus,
  };
}

export type UseDeadlineResult = {
  deadline: Deadline | null;
  loading: boolean;
  error: string | null;
  mutationError: string | null;
  dismissMutationError: () => void;
  /** PENDING → ACTIVE (and COMPLETE → PENDING → ACTIVE). Starts the clock now. */
  confirmDeadline: (durationSeconds: number) => Promise<void>;
  /** ACTIVE → COMPLETE. Parks the deadline so it stops being treated as running. */
  markComplete: () => Promise<void>;
  /** ACTIVE → ACTIVE. Restarts the clock from now using the existing duration. */
  restartFromNow: () => Promise<void>;
  /** ACTIVE → ACTIVE. Rolls a lapsed deadline forward by whole durations. */
  advanceIfExpired: () => Promise<void>;
  reload: () => void;
};

export function useDeadline(userId: string | null): UseDeadlineResult {
  const [deadline, setDeadline] = useState<Deadline | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const deadlineRef = useRef<Deadline | null>(null);
  const advancingRef = useRef(false);

  deadlineRef.current = deadline;

  useEffect(() => {
    if (!supabase || !userId) {
      setDeadline(null);
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
          .from('deadlines')
          .select('*')
          .eq('user_id', ownerId)
          .maybeSingle();

        if (cancelled) return;
        if (queryError) throw queryError;

        setDeadline(data ? fromRow(data) : null);
      } catch (err) {
        if (cancelled) return;
        if (__DEV__) console.warn('[Do The Thing] load deadline failed:', err);
        setError("We couldn't load your deadline. Pull to retry.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [userId, reloadKey]);

  const confirmDeadline = useCallback(
    async (durationSeconds: number) => {
      if (!supabase || !userId || durationSeconds <= 0) return;

      const previous = deadlineRef.current;
      const deadlineAt = new Date(Date.now() + durationSeconds * 1000).toISOString();

      setDeadline({
        id: previous?.id ?? 'pending-deadline',
        deadlineAt,
        durationSeconds,
        status: 'active',
      });

      const { data, error: upsertError } = await supabase
        .from('deadlines')
        .upsert(
          {
            user_id: userId,
            deadline_at: deadlineAt,
            duration_seconds: durationSeconds,
            status: 'active',
          },
          { onConflict: 'user_id' },
        )
        .select('*')
        .single();

      if (upsertError) {
        if (__DEV__) console.warn('[Do The Thing] set deadline failed:', upsertError);
        setDeadline(previous);
        setMutationError("We couldn't set your deadline. Try again.");
        return;
      }

      setDeadline(fromRow(data));
    },
    [userId],
  );

  const markComplete = useCallback(async () => {
    if (!supabase || !userId) return;

    const previous = deadlineRef.current;
    if (!previous || previous.status === 'complete') return;

    setDeadline({ ...previous, status: 'complete' });

    const { error: updateError } = await supabase
      .from('deadlines')
      .update({ status: 'complete' })
      .eq('user_id', userId);

    if (updateError) {
      if (__DEV__) console.warn('[Do The Thing] mark deadline complete failed:', updateError);
      setDeadline(previous);
    }
  }, [userId]);

  const restartFromNow = useCallback(async () => {
    if (!supabase || !userId) return;

    const previous = deadlineRef.current;
    if (!previous || previous.status !== 'active') return;

    const nextDeadlineAt = new Date(
      Date.now() + previous.durationSeconds * 1000,
    ).toISOString();
    const nextDeadline = {
      ...previous,
      deadlineAt: nextDeadlineAt,
      status: 'active' as const,
    };

    setDeadline(nextDeadline);

    const { error: updateError } = await supabase
      .from('deadlines')
      .update({ deadline_at: nextDeadlineAt, status: 'active' })
      .eq('user_id', userId);

    if (updateError) {
      if (__DEV__) console.warn('[Do The Thing] restart deadline failed:', updateError);
      setDeadline(previous);
      setMutationError("We couldn't reset your deadline. Try again.");
    }
  }, [userId]);

  const advanceIfExpired = useCallback(async () => {
    if (!supabase || !userId || advancingRef.current) return;

    const previous = deadlineRef.current;
    if (!previous || previous.status !== 'active') return;

    const durationMs = previous.durationSeconds * 1000;
    if (durationMs <= 0) return;

    const now = Date.now();
    const current = new Date(previous.deadlineAt).getTime();
    if (current > now) return;

    const periods = Math.floor((now - current) / durationMs) + 1;
    const nextDeadlineAt = new Date(current + periods * durationMs).toISOString();

    advancingRef.current = true;
    setDeadline({ ...previous, deadlineAt: nextDeadlineAt });

    const { error: updateError } = await supabase
      .from('deadlines')
      .update({ deadline_at: nextDeadlineAt })
      .eq('user_id', userId);

    advancingRef.current = false;

    if (updateError) {
      if (__DEV__) console.warn('[Do The Thing] advance deadline failed:', updateError);
      setDeadline(previous);
    }
  }, [userId]);

  const dismissMutationError = useCallback(() => setMutationError(null), []);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  return {
    deadline,
    loading,
    error,
    mutationError,
    dismissMutationError,
    confirmDeadline,
    markComplete,
    restartFromNow,
    advanceIfExpired,
    reload,
  };
}
