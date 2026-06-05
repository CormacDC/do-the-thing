import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { AppState as RNAppState } from 'react-native';

import { useDeadline } from '@/hooks/useDeadline';
import { useTasks } from '@/hooks/useTasks';
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
  confirmDeadline: (durationSeconds: number) => Promise<void>;
  expireDeadline: () => Promise<void>;
  retry: () => void;
};

export const AppStateContext = createContext<AppStateValue | null>(null);

function isQualifyingTask(task: Task, tasks: Task[]): boolean {
  // Only incomplete priority tasks gate completion. Once every priority task is
  // done, normal tasks qualify again.
  const hasIncompletePriorityTasks = tasks.some(
    (candidate) => candidate.isPriority && !candidate.isComplete,
  );
  return hasIncompletePriorityTasks ? task.isPriority : true;
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
  const allComplete = hasTasks && tasksApi.tasks.every((task) => task.isComplete);
  const deadlineStatus = deadlineApi.deadline?.status ?? null;

  const state = useMemo(
    () => deriveAppState({ hasTasks, allComplete, deadlineStatus }),
    [hasTasks, allComplete, deadlineStatus],
  );

  const { markComplete, restartFromNow, markExpired } = deadlineApi;
  const deadlineAt = deadlineApi.deadline?.deadlineAt ?? null;

  // ACTIVE/EXPIRED → COMPLETE: park the deadline once every task is done so a
  // later new task (COMPLETE → ACTIVE) doesn't re-derive a stale ACTIVE/EXPIRED.
  useEffect(() => {
    if (
      state === AppState.COMPLETE &&
      (deadlineStatus === 'active' || deadlineStatus === 'expired')
    ) {
      void markComplete();
    }
  }, [state, deadlineStatus, markComplete]);

  // ACTIVE → EXPIRED: when the deadline lapses, mark it expired (status only —
  // deadline_at and duration_seconds are left untouched). Checked on session
  // start and whenever the app returns to the foreground; the live countdown
  // also calls expireDeadline the moment it reaches zero.
  useEffect(() => {
    if (state !== AppState.ACTIVE || !deadlineAt) return;

    const checkExpiry = () => {
      if (new Date(deadlineAt).getTime() <= Date.now()) {
        void markExpired();
      }
    };

    checkExpiry();

    const subscription = RNAppState.addEventListener('change', (status) => {
      if (status === 'active') checkExpiry();
    });

    return () => subscription.remove();
  }, [state, deadlineAt, markExpired]);

  const loading = tasksApi.loading || deadlineApi.loading;
  const error = tasksApi.error ?? deadlineApi.error;
  const mutationError = tasksApi.mutationError ?? deadlineApi.mutationError;

  const toggleComplete = useCallback(
    async (id: string) => {
      // Tasks can only be completed while a deadline is actively running.
      if (state !== AppState.ACTIVE) return;

      const currentTasks = tasksApi.tasks;
      const currentTask = currentTasks.find((task) => task.id === id);

      // Completion is one-way: a completed task can't be reopened or modified.
      if (!currentTask || currentTask.isComplete) return;

      const shouldRestartDeadline =
        deadlineStatus === 'active' &&
        isQualifyingTask(currentTask, currentTasks) &&
        currentTasks.some((task) => task.id !== id && !task.isComplete);

      const updated = await tasksApi.toggleComplete(id);

      if (updated && shouldRestartDeadline) {
        await restartFromNow();
      }
    },
    [deadlineStatus, restartFromNow, state, tasksApi],
  );

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
      confirmDeadline: deadlineApi.confirmDeadline,
      expireDeadline: markExpired,
      retry: () => {
        tasksApi.retry();
        deadlineApi.reload();
      },
    }),
    [state, tasksApi, deadlineApi, loading, error, mutationError, toggleComplete],
  );
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState must be used inside an <AppStateProvider>.');
  }
  return ctx;
}
