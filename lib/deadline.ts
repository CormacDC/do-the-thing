import { DEADLINE_HOUR, DEADLINE_MINUTE } from '@/lib/config';

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

/**
 * Formats remaining time as `HH:MM:SS`. Hours are not wrapped at 24 so a
 * stray long deadline still reads honestly (e.g. `25:00:00`).
 */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Start of the countdown window: the previous local occurrence of the same
 * clock time as {@link deadlineAt} (one calendar day earlier).
 */
export function getDeadlineWindowStart(deadlineAt: string): Date {
  const start = new Date(deadlineAt);
  start.setDate(start.getDate() - 1);
  return start;
}

/** Duration of the current deadline window in milliseconds. */
export function getDeadlineWindowMs(deadlineAt: string): number {
  const end = new Date(deadlineAt).getTime();
  const start = getDeadlineWindowStart(deadlineAt).getTime();
  return Math.max(0, end - start);
}

/**
 * Remaining portion of the deadline window, clamped to 0–1. `1` is a full
 * window remaining; `0` is the deadline.
 */
export function getRemainingRatio(remainingMs: number, deadlineAt: string): number {
  const windowMs = getDeadlineWindowMs(deadlineAt);
  if (windowMs <= 0) return 0;
  return Math.min(1, Math.max(0, remainingMs / windowMs));
}

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
