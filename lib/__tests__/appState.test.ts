import { describe, expect, it } from 'vitest';

import { AppState, deriveAppState } from '@/types/appState';

describe('deriveAppState', () => {
  it('keeps an active day active after the last task is deleted', () => {
    expect(deriveAppState({ hasTasks: false, deadlineStatus: 'active' })).toBe(
      AppState.ACTIVE,
    );
  });

  it('keeps a completed day complete after the last task is deleted', () => {
    expect(deriveAppState({ hasTasks: false, deadlineStatus: 'complete' })).toBe(
      AppState.COMPLETE,
    );
  });

  it('keeps an expired day expired after the last task is deleted', () => {
    expect(deriveAppState({ hasTasks: false, deadlineStatus: 'expired' })).toBe(
      AppState.EXPIRED,
    );
  });

  it('returns EMPTY only when there is no deadline and no tasks', () => {
    expect(deriveAppState({ hasTasks: false, deadlineStatus: null })).toBe(
      AppState.EMPTY,
    );
  });

  it('returns EXPIRED when tasks exist without a deadline', () => {
    expect(deriveAppState({ hasTasks: true, deadlineStatus: null })).toBe(
      AppState.EXPIRED,
    );
  });

  it('prefers deadline status over the presence of tasks', () => {
    expect(deriveAppState({ hasTasks: true, deadlineStatus: 'active' })).toBe(
      AppState.ACTIVE,
    );
    expect(deriveAppState({ hasTasks: true, deadlineStatus: 'complete' })).toBe(
      AppState.COMPLETE,
    );
    expect(deriveAppState({ hasTasks: true, deadlineStatus: 'expired' })).toBe(
      AppState.EXPIRED,
    );
  });
});
