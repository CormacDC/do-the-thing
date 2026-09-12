import { useCallback, useEffect, useRef, useState } from 'react';

import { cancelAccountability, scheduleAccountability } from '@/lib/accountability';
import { getNextDeadlineISO } from '@/lib/deadline';
import { performDevDayReset } from '@/lib/devReset';
import { supabase } from '@/lib/supabase';
import type {
  AccountabilityStatus,
  Deadline,
  DeadlineRow,
  DeadlineStatus,
} from '@/types/deadline';

function fromRow(row: DeadlineRow): Deadline {
  return {
    id: row.id,
    deadlineAt: row.deadline_at,
    dailyQuota: row.daily_quota,
    tasksCompletedToday: row.tasks_completed_today,
    lastResetAt: row.last_reset_at,
    lastQuotaAdjustedAt: row.last_quota_adjusted_at,
    status: row.status as DeadlineStatus,
    accountabilityStatus: (row.accountability_status ?? 'idle') as AccountabilityStatus,
    accountabilitySentAt: row.accountability_sent_at ?? null,
  };
}

export type UseDeadlineResult = {
  deadline: Deadline | null;
  loading: boolean;
  error: string | null;
  mutationError: string | null;
  dismissMutationError: () => void;
  /** EMPTY/EXPIRED/COMPLETE → ACTIVE. Sets quota, resets counts, targets tonight's midnight. */
  confirmQuota: (dailyQuota: number) => Promise<void>;
  /** ACTIVE → ACTIVE. Increments tasks_completed_today; returns the new count. */
  incrementTasksCompletedToday: () => Promise<number>;
  /**
   * Runs the daily reset. Idempotent with server-side dispatch: if the deadline
   * was already expired/sent by cron, syncs local state without double-notifying.
   */
  runDailyReset: () => Promise<void>;
  /** ACTIVE → ACTIVE (once per day). Updates daily_quota and records the adjustment timestamp. */
  adjustQuota: (newQuota: number) => Promise<void>;
  /** Parks the deadline as complete (called when quota is confirmed met). */
  markComplete: () => Promise<void>;
  /** Dev-only: restart the quota timer without changing tasks. */
  devResetDay: () => Promise<void>;
  reload: () => void;
};

export function useDeadline(userId: string | null): UseDeadlineResult {
  const [deadline, setDeadline] = useState<Deadline | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const deadlineRef = useRef<Deadline | null>(null);

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

  const confirmQuota = useCallback(
    async (dailyQuota: number) => {
      if (!supabase || !userId || dailyQuota < 1) return;

      const { count: targetCount, error: targetError } = await supabase
        .from('accountability_targets')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (targetError) {
        if (__DEV__) console.warn('[Do The Thing] confirmQuota targets:', targetError);
        setMutationError("We couldn't verify your friends. Try again.");
        return;
      }

      if (!targetCount || targetCount < 1) {
        setMutationError(
          'Add at least one friend as a notify target in Settings before setting a quota.',
        );
        return;
      }

      const previous = deadlineRef.current;
      const deadlineAt = getNextDeadlineISO();
      const now = new Date().toISOString();

      setDeadline({
        id: previous?.id ?? 'pending-deadline',
        deadlineAt,
        dailyQuota,
        tasksCompletedToday: 0,
        lastResetAt: previous?.lastResetAt ?? now,
        lastQuotaAdjustedAt: null,
        status: 'active',
        accountabilityStatus: 'pending',
        accountabilitySentAt: null,
      });

      const { data, error: upsertError } = await supabase
        .from('deadlines')
        .upsert(
          {
            user_id: userId,
            deadline_at: deadlineAt,
            daily_quota: dailyQuota,
            tasks_completed_today: 0,
            last_quota_adjusted_at: null,
            status: 'active',
            accountability_status: 'pending',
            accountability_sent_at: null,
          },
          { onConflict: 'user_id' },
        )
        .select('*')
        .single();

      if (upsertError) {
        if (__DEV__) console.warn('[Do The Thing] confirmQuota failed:', upsertError);
        setDeadline(previous);
        setMutationError("We couldn't save your quota. Try again.");
        return;
      }

      setDeadline(fromRow(data));
      scheduleAccountability(userId);
    },
    [userId],
  );

  const incrementTasksCompletedToday = useCallback(async (): Promise<number> => {
    if (!supabase || !userId) return 0;

    const previous = deadlineRef.current;
    if (!previous) return 0;

    const newCount = previous.tasksCompletedToday + 1;
    setDeadline({ ...previous, tasksCompletedToday: newCount });

    const { error: updateError } = await supabase
      .from('deadlines')
      .update({ tasks_completed_today: newCount })
      .eq('user_id', userId);

    if (updateError) {
      if (__DEV__)
        console.warn('[Do The Thing] incrementTasksCompletedToday failed:', updateError);
      setDeadline(previous);
      setMutationError("We couldn't update your progress. Try again.");
      return previous.tasksCompletedToday;
    }

    return newCount;
  }, [userId]);

  const runDailyReset = useCallback(async () => {
    if (!supabase || !userId) return;

    const previous = deadlineRef.current;
    if (!previous) return;

    // Idempotent sync: server dispatch may have already expired/sent.
    const { data: fresh, error: freshError } = await supabase
      .from('deadlines')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (freshError) {
      if (__DEV__) console.warn('[Do The Thing] runDailyReset refresh failed:', freshError);
      setMutationError("We couldn't process the daily reset. Try again.");
      return;
    }

    if (fresh) {
      const remote = fromRow(fresh);
      if (
        remote.status === 'expired' ||
        remote.accountabilityStatus === 'sent' ||
        remote.accountabilityStatus === 'skipped'
      ) {
        setDeadline(remote);
        return;
      }
      if (previous.status === 'active' && remote.status === 'complete') {
        setDeadline(remote);
        return;
      }
    }

    const now = new Date().toISOString();
    const nextDeadlineAt = getNextDeadlineISO();
    const current = fresh ? fromRow(fresh) : previous;

    if (current.status === 'active') {
      const metQuota = current.tasksCompletedToday >= current.dailyQuota;
      const nextStatus: DeadlineStatus = metQuota ? 'complete' : 'expired';

      setDeadline({
        ...current,
        status: nextStatus,
        lastResetAt: now,
        deadlineAt: nextDeadlineAt,
        accountabilityStatus: metQuota ? 'cancelled' : current.accountabilityStatus,
      });

      const { error: updateError } = await supabase
        .from('deadlines')
        .update({
          status: nextStatus,
          tasks_completed_today: 0,
          last_reset_at: now,
          deadline_at: nextDeadlineAt,
          ...(metQuota ? { accountability_status: 'cancelled' } : {}),
        })
        .eq('user_id', userId)
        .eq('status', 'active');

      if (updateError) {
        if (__DEV__) console.warn('[Do The Thing] runDailyReset failed:', updateError);
        setDeadline(previous);
        setMutationError("We couldn't process the daily reset. Try again.");
        return;
      }

      setDeadline((c) => (c ? { ...c, tasksCompletedToday: 0 } : c));

      if (!metQuota) {
        // Client-side expiry path when cron has not run yet — leave pending
        // so dispatch can still send if the app closed again before cron.
      } else {
        cancelAccountability(userId);
      }
    } else if (current.status === 'complete') {
      setDeadline({
        ...current,
        status: 'active',
        tasksCompletedToday: 0,
        lastResetAt: now,
        lastQuotaAdjustedAt: null,
        deadlineAt: nextDeadlineAt,
        accountabilityStatus: 'pending',
        accountabilitySentAt: null,
      });

      const { error: updateError } = await supabase
        .from('deadlines')
        .update({
          status: 'active',
          tasks_completed_today: 0,
          last_reset_at: now,
          last_quota_adjusted_at: null,
          deadline_at: nextDeadlineAt,
          accountability_status: 'pending',
          accountability_sent_at: null,
        })
        .eq('user_id', userId);

      if (updateError) {
        if (__DEV__)
          console.warn('[Do The Thing] runDailyReset (complete→active) failed:', updateError);
        setDeadline(previous);
        setMutationError("We couldn't start the new day. Try again.");
        return;
      }

      scheduleAccountability(userId);
    }
  }, [userId]);

  const adjustQuota = useCallback(
    async (newQuota: number) => {
      if (!supabase || !userId || newQuota < 1) return;

      const previous = deadlineRef.current;
      if (!previous) return;

      const now = new Date().toISOString();
      setDeadline({ ...previous, dailyQuota: newQuota, lastQuotaAdjustedAt: now });

      const { error: updateError } = await supabase
        .from('deadlines')
        .update({ daily_quota: newQuota, last_quota_adjusted_at: now })
        .eq('user_id', userId);

      if (updateError) {
        if (__DEV__) console.warn('[Do The Thing] adjustQuota failed:', updateError);
        setDeadline(previous);
        setMutationError("We couldn't update your quota. Try again.");
      }
    },
    [userId],
  );

  const markComplete = useCallback(async () => {
    if (!supabase || !userId) return;

    const previous = deadlineRef.current;
    if (!previous || previous.status === 'complete') return;

    setDeadline({
      ...previous,
      status: 'complete',
      accountabilityStatus: 'cancelled',
    });

    const { error: updateError } = await supabase
      .from('deadlines')
      .update({ status: 'complete', accountability_status: 'cancelled' })
      .eq('user_id', userId);

    if (updateError) {
      if (__DEV__) console.warn('[Do The Thing] markComplete failed:', updateError);
      setDeadline(previous);
      return;
    }

    cancelAccountability(userId);
  }, [userId]);

  const devResetDay = useCallback(async () => {
    if (!userId) return;

    const previous = deadlineRef.current;
    if (!previous) {
      setMutationError('Set a quota first — add a task to get started.');
      return;
    }

    const now = new Date().toISOString();
    const deadlineAt = getNextDeadlineISO();

    setDeadline({
      ...previous,
      status: 'active',
      tasksCompletedToday: 0,
      deadlineAt,
      lastResetAt: now,
      lastQuotaAdjustedAt: null,
      accountabilityStatus: 'pending',
      accountabilitySentAt: null,
    });

    const result = await performDevDayReset(userId);

    if (!result.ok) {
      setDeadline(previous);
      setMutationError(result.error);
      return;
    }

    setDeadline(fromRow(result.row));
    scheduleAccountability(userId);
  }, [userId]);

  const dismissMutationError = useCallback(() => setMutationError(null), []);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  return {
    deadline,
    loading,
    error,
    mutationError,
    dismissMutationError,
    confirmQuota,
    incrementTasksCompletedToday,
    runDailyReset,
    adjustQuota,
    markComplete,
    devResetDay,
    reload,
  };
}
