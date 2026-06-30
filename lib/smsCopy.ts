/** Default SMS templates. Tokens: {name}, {completed}, {quota} */
export const SMS_COPY = {
  fullMiss: "{name} didn't complete any of their tasks yesterday.",
  partialMiss: '{name} completed {completed} of {quota} tasks yesterday.',
  priorityMiss: "{name} didn't complete any of their Priority tasks yesterday.",
} as const;

export type SmsMissType = keyof typeof SMS_COPY;

export const SMS_TOKEN_HINT =
  'Use {name}, {completed}, and {quota} as placeholders in custom messages.';

export const SMS_DEFAULT_PREVIEW = SMS_COPY.fullMiss;
