import type { MissType } from '@/lib/accountabilityCopy';
import { determineMissType } from '@/lib/accountabilityMessage';

export type AccountabilityEligibilityInput = {
  deadlineStatus: 'active' | 'complete' | 'expired' | string;
  accountabilityStatus: 'idle' | 'pending' | 'cancelled' | 'sent' | 'skipped' | string;
  tasksCompletedToday: number;
  dailyQuota: number;
  hasPriorityTasks: boolean;
  targetCount: number;
  tokenCount: number;
};

export type AccountabilityEligibilityResult =
  | { action: 'send'; missType: MissType }
  | { action: 'skip'; reason: string }
  | { action: 'cancel'; reason: string };

/**
 * Pure decision for midnight accountability dispatch.
 * Used by the Edge Function and unit-tested in isolation.
 */
export function evaluateAccountabilityEligibility(
  input: AccountabilityEligibilityInput,
): AccountabilityEligibilityResult {
  if (input.accountabilityStatus === 'cancelled') {
    return { action: 'cancel', reason: 'already_cancelled' };
  }
  if (input.accountabilityStatus === 'sent') {
    return { action: 'skip', reason: 'already_sent' };
  }
  if (input.accountabilityStatus !== 'pending') {
    return { action: 'skip', reason: 'not_pending' };
  }
  if (input.deadlineStatus === 'complete') {
    return { action: 'cancel', reason: 'quota_met' };
  }
  if (input.tasksCompletedToday >= input.dailyQuota) {
    return { action: 'cancel', reason: 'quota_met' };
  }
  if (input.targetCount <= 0) {
    return { action: 'skip', reason: 'no_targets' };
  }
  if (input.tokenCount <= 0) {
    return { action: 'skip', reason: 'no_tokens' };
  }

  return {
    action: 'send',
    missType: determineMissType(
      input.tasksCompletedToday,
      input.dailyQuota,
      input.hasPriorityTasks,
    ),
  };
}
