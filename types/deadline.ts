import type { Tables } from '@/types/database';

export type DeadlineRow = Tables<'deadlines'>;

export type DeadlineStatus = 'active' | 'complete' | 'expired';

export type AccountabilityStatus =
  | 'idle'
  | 'pending'
  | 'cancelled'
  | 'sent'
  | 'skipped';

/** Client-side, camelCased view of a deadline record. */
export type Deadline = {
  id: string;
  deadlineAt: string;
  dailyQuota: number;
  tasksCompletedToday: number;
  lastResetAt: string;
  lastQuotaAdjustedAt: string | null;
  status: DeadlineStatus;
  accountabilityStatus: AccountabilityStatus;
  accountabilitySentAt: string | null;
};
