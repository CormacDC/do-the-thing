import { DEADLINE_HOUR, DEADLINE_MINUTE } from '@/lib/config';

/**
 * Returns an ISO string for the next future occurrence of
 * {@link DEADLINE_HOUR}:{@link DEADLINE_MINUTE} in local time. If that time has
 * already passed today, the deadline is tomorrow.
 */
export function getNextDeadlineISO(from: Date = new Date()): string {
  const next = new Date(from);
  next.setHours(DEADLINE_HOUR, DEADLINE_MINUTE, 0, 0);
  if (next.getTime() <= from.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next.toISOString();
}

/**
 * True when a deadline has passed since {@link lastResetAt} without a reset
 * running (e.g. the app was closed at deadline time).
 */
export function shouldRunMissedReset(lastResetAt: string, now: Date = new Date()): boolean {
  const lastReset = new Date(lastResetAt);
  const nextDeadline = new Date(lastReset);
  nextDeadline.setHours(DEADLINE_HOUR, DEADLINE_MINUTE, 0, 0);
  if (nextDeadline.getTime() <= lastReset.getTime()) {
    nextDeadline.setDate(nextDeadline.getDate() + 1);
  }
  return now.getTime() >= nextDeadline.getTime();
}
