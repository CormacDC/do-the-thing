import { SMS_COPY, type SmsMissType } from '@/lib/smsCopy';

export type SmsTokenValues = {
  name: string;
  completed: number;
  quota: number;
};

/** Replace {name}, {completed}, and {quota} tokens in an SMS template. */
export function replaceSmsTokens(template: string, values: SmsTokenValues): string {
  return template
    .replaceAll('{name}', values.name)
    .replaceAll('{completed}', String(values.completed))
    .replaceAll('{quota}', String(values.quota));
}

export function determineSmsMissType(
  completed: number,
  quota: number,
  hasPriorityTasks: boolean,
): SmsMissType {
  if (completed === 0 && hasPriorityTasks) {
    return 'priorityMiss';
  }
  if (completed > 0 && completed < quota) {
    return 'partialMiss';
  }
  return 'fullMiss';
}

/** Resolve the SMS body from custom copy or the default template for the miss type. */
export function resolveSmsMessage(
  customSms: string | null | undefined,
  missType: SmsMissType,
  values: SmsTokenValues,
): string {
  const trimmed = customSms?.trim();
  const template = trimmed ? trimmed : SMS_COPY[missType];
  return replaceSmsTokens(template, values);
}
