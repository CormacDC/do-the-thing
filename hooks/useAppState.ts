import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { AppState as RNAppState } from 'react-native';

import { useDeadline } from '@/hooks/useDeadline';
import { useTasks } from '@/hooks/useTasks';
import { shouldRunMissedReset } from '@/lib/deadline';
import { AppState, deriveAppState } from '@/types/appState';
import type { Deadline } from '@/types/deadline';
import type { Task } from '@/types/task';

export type AppStateValue = {
  state: AppState;
  tasks: Task[];
  deadline: Deadline | null;
  loading: boolean;
  error: string | null;
  mutationError: string | null;
  dismissMutationError: () => void;
  addTask: (title: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  togglePriority: (id: string) => Promise<void>;
  /** EMPTY/EXPIRED/COMPLETE → ACTIVE. Sets quota and targets tonight's midnight. */
  confirmQuota: (dailyQuota: number) => Promise<void>;
  /** ACTIVE → ACTIVE (once per day). Adjusts the quota without resetting the day. */
  adjustQuota: (newQuota: number) => Promise<void>;
  /** True when the user is still allowed to adjust their quota today. */
  canAdjustQuota: boolean;
  /** Called by the countdown when it reaches midnight; triggers the daily reset. */
  expireDeadline: () => Promise<void>;
  /** Dev-only: restart the quota timer without changing tasks. */
  devResetDay: () => Promise<void>;
  retry: () => void;
};

export const AppStateContext = createContext<AppStateValue | null>(null);

function isQualifyingTask(task: Task, tasks: Task[]): boolean {
  // Only Priority tasks count when any incomplete Priority tasks exist.
  const hasIncompletePriorityTasks = tasks.some(
    (candidate) => candidate.isPriority && !candidate.isComplete,
  );
  return hasIncompletePriorityTasks ? task.isPriority : true;
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * The single source of truth for app lifecycle state. Composes tasks and the
 * deadline record, derives the current {@link AppState}, and owns every state
 * transition so components never have to reason about them.
 */
export function useAppStateController(userId: string | null): AppStateValue {
  const tasksApi = useTasks(userId);
  const deadlineApi = useDeadline(userId);

  const hasTasks = tasksApi.tasks.length > 0;
  const deadlineStatus = deadlineApi.deadline?.status ?? null;

  const state = useMemo(
    () => deriveAppState({ hasTasks, deadlineStatus }),
    [hasTasks, deadlineStatus],
  );

  const { markComplete, runDailyReset, incrementTasksCompletedToday } = deadlineApi;
  const dailyQuota = deadlineApi.deadline?.dailyQuota;
  const tasksCompletedToday = deadlineApi.deadline?.tasksCompletedToday;
  const lastResetAt = deadlineApi.deadline?.lastResetAt;
  const lastQuotaAdjustedAt = deadlineApi.deadline?.lastQuotaAdjustedAt;
  const deadlineId = deadlineApi.deadline?.id;

  // Session restore: if the deadline is active but the quota was already met
  // (e.g. the app was killed after completing the quota but before markComplete
  // persisted), park it now.
  useEffect(() => {
    if (
      state === AppState.ACTIVE &&
      deadlineStatus === 'active' &&
      tasksCompletedToday !== undefined &&
      dailyQuota !== undefined &&
      tasksCompletedToday >= dailyQuota
    ) {
      void markComplete();
    }
  }, [state, deadlineStatus, tasksCompletedToday, dailyQuota, markComplete]);

  // Daily reset check: on mount and whenever the app returns to the foreground,
  // compare last_reset_at's calendar date against today. If they differ, a reset
  // was missed while the app was closed (e.g. the user didn't open it at midnight).
  // Also fires in COMPLETE so a successful day transitions back to ACTIVE the next
  // morning with the same quota — no quota re-entry required.
  useEffect(() => {
    if ((state !== AppState.ACTIVE && state !== AppState.COMPLETE) || !lastResetAt) return;

    const checkAndReset = async () => {
      if (shouldRunMissedReset(lastResetAt)) {
        await runDailyReset();
      }
    };

    void checkAndReset();

    const subscription = RNAppState.addEventListener('change', (status) => {
      if (status === 'active') void checkAndReset();
    });

    return () => subscription.remove();
  }, [deadlineId, state, lastResetAt, runDailyReset]);

  const loading = tasksApi.loading || deadlineApi.loading;
  const error = tasksApi.error ?? deadlineApi.error;
  const mutationError = tasksApi.mutationError ?? deadlineApi.mutationError;

  const toggleComplete = useCallback(
    async (id: string) => {
      // Completions are allowed in ACTIVE and COMPLETE states.
      // ACTIVE: qualifying completions increment the counter and may meet the quota.
      // COMPLETE: quota already met; the task is marked done but nothing is counted.
      if (state !== AppState.ACTIVE && state !== AppState.COMPLETE) return;

      const currentTasks = tasksApi.tasks;
      const currentTask = currentTasks.find((task) => task.id === id);

      // Completion is one-way: a completed task cannot be reopened.
      if (!currentTask || currentTask.isComplete) return;

      if (state === AppState.ACTIVE) {
        const qualifying = isQualifyingTask(currentTask, currentTasks);
        const updated = await tasksApi.toggleComplete(id);
        if (!updated) return;

        if (qualifying) {
          const newCount = await incrementTasksCompletedToday();
          if (dailyQuota !== undefined && newCount >= dailyQuota) {
            await markComplete();
          }
        }
      } else {
        // COMPLETE: mark done, no quota impact.
        await tasksApi.toggleComplete(id);
      }
    },
    [state, tasksApi, incrementTasksCompletedToday, dailyQuota, markComplete],
  );

  const canAdjustQuota = useMemo(() => {
    if (state !== AppState.ACTIVE) return false;
    if (!lastQuotaAdjustedAt) return true;
    return !isSameCalendarDay(new Date(lastQuotaAdjustedAt), new Date());
  }, [state, lastQuotaAdjustedAt]);

  return useMemo(
    () => ({
      state,
      tasks: tasksApi.tasks,
      deadline: deadlineApi.deadline,
      loading,
      error,
      mutationError,
      dismissMutationError: () => {
        tasksApi.dismissMutationError();
        deadlineApi.dismissMutationError();
      },
      addTask: tasksApi.addTask,
      toggleComplete,
      togglePriority: tasksApi.togglePriority,
      confirmQuota: deadlineApi.confirmQuota,
      adjustQuota: deadlineApi.adjustQuota,
      canAdjustQuota,
      expireDeadline: runDailyReset,
      devResetDay: deadlineApi.devResetDay,
      retry: () => {
        tasksApi.retry();
        deadlineApi.reload();
      },
    }),
    [
      state,
      tasksApi,
      deadlineApi,
      loading,
      error,
      mutationError,
      toggleComplete,
      canAdjustQuota,
      runDailyReset,
    ],
  );
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState must be used inside an <AppStateProvider>.');
  }
  return ctx;
}
