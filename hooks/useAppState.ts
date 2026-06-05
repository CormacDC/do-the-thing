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
  advanceDeadline: () => Promise<void>;
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
  const deadlineActive = deadlineApi.deadline?.status === 'active';

  const state = useMemo(
    () => deriveAppState({ hasTasks, allComplete, deadlineActive }),
    [hasTasks, allComplete, deadlineActive],
  );

  const { markComplete, restartFromNow, advanceIfExpired } = deadlineApi;
  const deadlineStatus = deadlineApi.deadline?.status;

  // ACTIVE → COMPLETE: park the running deadline once every task is done.
  useEffect(() => {
    if (state === AppState.COMPLETE && deadlineStatus === 'active') {
      void markComplete();
    }
  }, [state, deadlineStatus, markComplete]);

  // ACTIVE → ACTIVE: roll a lapsed deadline forward on session start and
  // whenever the app returns to the foreground.
  useEffect(() => {
    if (state !== AppState.ACTIVE) return;

    void advanceIfExpired();

    const subscription = RNAppState.addEventListener('change', (status) => {
      if (status === 'active') void advanceIfExpired();
    });

    return () => subscription.remove();
  }, [state, advanceIfExpired]);

  const loading = tasksApi.loading || deadlineApi.loading;
  const error = tasksApi.error ?? deadlineApi.error;
  const mutationError = tasksApi.mutationError ?? deadlineApi.mutationError;

  const toggleComplete = useCallback(
    async (id: string) => {
      const currentTasks = tasksApi.tasks;
      const currentTask = currentTasks.find((task) => task.id === id);

      const shouldRestartDeadline =
        state === AppState.ACTIVE &&
        deadlineStatus === 'active' &&
        !!currentTask &&
        !currentTask.isComplete &&
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
      advanceDeadline: deadlineApi.advanceIfExpired,
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
