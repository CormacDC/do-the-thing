import { describe, expect, it } from 'vitest';

import { evaluateAccountabilityEligibility } from '@/lib/accountabilityEligibility';
import { determineMissType, resolveAccountabilityMessage } from '@/lib/accountabilityMessage';
import {
  generateFriendCode,
  isValidFriendCode,
  normalizeFriendCode,
} from '@/lib/friendCode';

describe('determineMissType', () => {
  it('returns priorityMiss when nothing completed and priority tasks exist', () => {
    expect(determineMissType(0, 3, true)).toBe('priorityMiss');
  });

  it('returns partialMiss when some but not all completed', () => {
    expect(determineMissType(2, 3, false)).toBe('partialMiss');
  });

  it('returns fullMiss otherwise', () => {
    expect(determineMissType(0, 3, false)).toBe('fullMiss');
  });
});

describe('resolveAccountabilityMessage', () => {
  it('uses custom template when provided', () => {
    expect(
      resolveAccountabilityMessage('{name} blew it ({completed}/{quota})', 'fullMiss', {
        name: 'Alex',
        completed: 0,
        quota: 2,
      }),
    ).toBe('Alex blew it (0/2)');
  });

  it('falls back to default copy', () => {
    expect(
      resolveAccountabilityMessage(null, 'partialMiss', {
        name: 'Sam',
        completed: 1,
        quota: 3,
      }),
    ).toBe('Sam completed 1 of 3 tasks yesterday.');
  });
});

describe('evaluateAccountabilityEligibility', () => {
  const base = {
    deadlineStatus: 'active',
    accountabilityStatus: 'pending',
    tasksCompletedToday: 0,
    dailyQuota: 2,
    hasPriorityTasks: false,
    targetCount: 1,
    tokenCount: 1,
  };

  it('sends when pending, unmet, and recipients exist', () => {
    expect(evaluateAccountabilityEligibility(base)).toEqual({
      action: 'send',
      missType: 'fullMiss',
    });
  });

  it('cancels when quota already met', () => {
    expect(
      evaluateAccountabilityEligibility({
        ...base,
        tasksCompletedToday: 2,
      }),
    ).toEqual({ action: 'cancel', reason: 'quota_met' });
  });

  it('skips when no tokens', () => {
    expect(
      evaluateAccountabilityEligibility({
        ...base,
        tokenCount: 0,
      }),
    ).toEqual({ action: 'skip', reason: 'no_tokens' });
  });

  it('skips when no targets', () => {
    expect(
      evaluateAccountabilityEligibility({
        ...base,
        targetCount: 0,
      }),
    ).toEqual({ action: 'skip', reason: 'no_targets' });
  });
});

describe('friendCode', () => {
  it('normalizes and validates codes', () => {
    expect(normalizeFriendCode(' abc12z ')).toBe('ABC12Z');
    expect(isValidFriendCode('ABCDEF')).toBe(true);
    expect(isValidFriendCode('ABC0IO')).toBe(false);
    expect(isValidFriendCode('SHORT')).toBe(false);
  });

  it('generates a valid code', () => {
    const code = generateFriendCode(() => 0);
    expect(isValidFriendCode(code)).toBe(true);
    expect(code).toHaveLength(6);
  });
});
