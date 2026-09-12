/** @deprecated Prefer lib/accountabilityMessage. Thin re-export for leftover SMS imports. */
export {
  determineMissType as determineSmsMissType,
  replaceAccountabilityTokens as replaceSmsTokens,
  resolveAccountabilityMessage as resolveSmsMessage,
  type AccountabilityTokenValues as SmsTokenValues,
} from '@/lib/accountabilityMessage';
