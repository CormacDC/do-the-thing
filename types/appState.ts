import type { DeadlineStatus } from '@/types/deadline';

/**
 * The app's high-level lifecycle state. Derived from the user's tasks and
 * their single deadline record — never stored on its own.
 *
 * There is no "tasks but no deadline" resting state: a deadline is mandatory
 * and is set as part of adding the first task, so a task can never exist
 * without one (except after a deadline expires).
 */
export enum AppState {
  EMPTY = 'EMPTY', // no tasks present, no deadline set
  ACTIVE = 'ACTIVE', // deadline set and counting down
  EXPIRED = 'EXPIRED', // deadline passed, SMS fired, awaiting new deadline
  COMPLETE = 'COMPLETE', // all tasks completed, eligible for fresh start
}

export type DeriveAppStateParams = {
  hasTasks: boolean;
  allComplete: boolean;
  deadlineStatus: DeadlineStatus | null;
};

export function deriveAppState({
  hasTasks,
  allComplete,
  deadlineStatus,
}: DeriveAppStateParams): AppState {
  if (!hasTasks) return AppState.EMPTY;
  if (allComplete) return AppState.COMPLETE;
  if (deadlineStatus === 'active') return AppState.ACTIVE;
  // Incomplete tasks with no running deadline: the deadline has lapsed (or a
  // partial failure left tasks without one). Treat as EXPIRED so a fresh
  // deadline is forced before the user can continue.
  return AppState.EXPIRED;
}
