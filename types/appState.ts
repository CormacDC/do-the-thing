/**
 * The app's high-level lifecycle state. Derived from the user's tasks and
 * their single deadline record — never stored on its own.
 */
export enum AppState {
  EMPTY = 'EMPTY',
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  COMPLETE = 'COMPLETE',
}

export type DeriveAppStateParams = {
  hasTasks: boolean;
  allComplete: boolean;
  deadlineActive: boolean;
};

export function deriveAppState({
  hasTasks,
  allComplete,
  deadlineActive,
}: DeriveAppStateParams): AppState {
  if (!hasTasks) return AppState.EMPTY;
  if (allComplete) return AppState.COMPLETE;
  return deadlineActive ? AppState.ACTIVE : AppState.PENDING;
}
