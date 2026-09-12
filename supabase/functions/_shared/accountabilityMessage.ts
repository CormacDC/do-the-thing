/** Default accountability push templates. Keep in sync with /lib/accountabilityCopy.ts */
export const ACCOUNTABILITY_COPY = {
  fullMiss: "{name} didn't complete any of their tasks yesterday.",
  partialMiss: '{name} completed {completed} of {quota} tasks yesterday.',
  priorityMiss: "{name} didn't complete any of their Priority tasks yesterday.",
} as const;

export type MissType = keyof typeof ACCOUNTABILITY_COPY;

export type AccountabilityTokenValues = {
  name: string;
  completed: number;
  quota: number;
};

export function replaceAccountabilityTokens(
  template: string,
  values: AccountabilityTokenValues,
): string {
  return template
    .replaceAll('{name}', values.name)
    .replaceAll('{completed}', String(values.completed))
    .replaceAll('{quota}', String(values.quota));
}

export function determineMissType(
  completed: number,
  quota: number,
  hasPriorityTasks: boolean,
): MissType {
  if (completed === 0 && hasPriorityTasks) {
    return 'priorityMiss';
  }
  if (completed > 0 && completed < quota) {
    return 'partialMiss';
  }
  return 'fullMiss';
}

export function resolveAccountabilityMessage(
  customMessage: string | null | undefined,
  missType: MissType,
  values: AccountabilityTokenValues,
): string {
  const trimmed = customMessage?.trim();
  const template = trimmed ? trimmed : ACCOUNTABILITY_COPY[missType];
  return replaceAccountabilityTokens(template, values);
}

export type AccountabilityEligibilityInput = {
  deadlineStatus: string;
  accountabilityStatus: string;
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
