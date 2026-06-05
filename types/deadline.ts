import type { Tables } from '@/types/database';

export type DeadlineRow = Tables<'deadlines'>;

export type DeadlineStatus = 'active' | 'complete' | 'expired';

/** Client-side, camelCased view of a deadline record. */
export type Deadline = {
  id: string;
  deadlineAt: string;
  durationSeconds: number;
  status: DeadlineStatus;
};
