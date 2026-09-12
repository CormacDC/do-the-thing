import { ACCOUNTABILITY_COPY, type MissType } from '@/lib/accountabilityCopy';

export type AccountabilityTokenValues = {
  name: string;
  completed: number;
  quota: number;
};

/** Replace {name}, {completed}, and {quota} tokens in an accountability template. */
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

/** Resolve the message body from custom copy or the default template for the miss type. */
export function resolveAccountabilityMessage(
  customMessage: string | null | undefined,
  missType: MissType,
  values: AccountabilityTokenValues,
): string {
  const trimmed = customMessage?.trim();
  const template = trimmed ? trimmed : ACCOUNTABILITY_COPY[missType];
  return replaceAccountabilityTokens(template, values);
}
