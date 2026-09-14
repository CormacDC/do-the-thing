import type { DeadlineStatus } from '@/types/deadline';

/**
 * The app's high-level lifecycle state. Derived from the user's tasks and
 * their single deadline record — never stored on its own.
 *
 * Completion is quota-based: COMPLETE is reached when tasks_completed_today
 * reaches daily_quota, not when every task is checked off.
 */
export enum AppState {
  EMPTY = 'EMPTY', // no deadline committed and no tasks
  ACTIVE = 'ACTIVE', // quota set and counting down to midnight
  EXPIRED = 'EXPIRED', // midnight passed without meeting quota; push sent / skipped
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
  // Deadline status wins so deleting the last task does not drop an in-progress
  // day back to EMPTY (and re-open the quota picker).
  if (deadlineStatus === 'complete') return AppState.COMPLETE;
  if (deadlineStatus === 'active') return AppState.ACTIVE;
  if (deadlineStatus === 'expired') return AppState.EXPIRED;
  if (!hasTasks) return AppState.EMPTY;
  // Tasks with no deadline record yet → force a quota before the user continues.
  return AppState.EXPIRED;
}
