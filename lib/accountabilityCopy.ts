/** Default accountability push templates. Tokens: {name}, {completed}, {quota} */
export const ACCOUNTABILITY_COPY = {
  fullMiss: "{name} didn't complete any of their tasks yesterday.",
  partialMiss: '{name} completed {completed} of {quota} tasks yesterday.',
  priorityMiss: "{name} didn't complete any of their Priority tasks yesterday.",
} as const;

export type MissType = keyof typeof ACCOUNTABILITY_COPY;

export const ACCOUNTABILITY_TOKEN_HINT =
  'Use {name}, {completed}, and {quota} as placeholders in custom messages.';

export const ACCOUNTABILITY_DEFAULT_PREVIEW = ACCOUNTABILITY_COPY.fullMiss;
