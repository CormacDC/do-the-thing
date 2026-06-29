import type { DeadlineStatus } from '@/types/deadline';

/**
 * The app's high-level lifecycle state. Derived from the user's tasks and
 * their single deadline record — never stored on its own.
 *
 * Completion is quota-based: COMPLETE is reached when tasks_completed_today
 * reaches daily_quota, not when every task is checked off.
 */
export enum AppState {
  EMPTY = 'EMPTY', // no tasks present, no deadline set
  ACTIVE = 'ACTIVE', // quota set and counting down to midnight
  EXPIRED = 'EXPIRED', // midnight passed without meeting quota; SMS fired
  COMPLETE = 'COMPLETE', // daily quota met; eligible for a fresh start
}

export type DeriveAppStateParams = {
  hasTasks: boolean;
  deadlineStatus: DeadlineStatus | null;
};

export function deriveAppState({
  hasTasks,
  deadlineStatus,
}: DeriveAppStateParams): AppState {
  if (!hasTasks) return AppState.EMPTY;
  if (deadlineStatus === 'complete') return AppState.COMPLETE;
  if (deadlineStatus === 'active') return AppState.ACTIVE;
  // Incomplete tasks with no running deadline (expired or null status) →
  // force a new quota before the user can continue.
  return AppState.EXPIRED;
}
