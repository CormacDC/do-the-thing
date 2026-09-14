import { describe, expect, it } from 'vitest';

import {
  formatCountdown,
  getDeadlineWindowMs,
  getDeadlineWindowStart,
  getRemainingRatio,
} from '@/lib/deadline';

describe('formatCountdown', () => {
  it('formats zero and negative remaining time as 00:00:00', () => {
    expect(formatCountdown(0)).toBe('00:00:00');
    expect(formatCountdown(-1500)).toBe('00:00:00');
  });

  it('formats hours, minutes, and seconds without a day segment', () => {
    expect(formatCountdown(1000)).toBe('00:00:01');
    expect(formatCountdown(61_000)).toBe('00:01:01');
    expect(formatCountdown(3_661_000)).toBe('01:01:01');
  });

  it('does not wrap hours at 24', () => {
    expect(formatCountdown(25 * 60 * 60 * 1000)).toBe('25:00:00');
  });
});

describe('deadline window', () => {
  it('starts one local calendar day before the deadline', () => {
    const deadline = new Date(2026, 5, 15, 0, 0, 0);
    const start = getDeadlineWindowStart(deadline.toISOString());
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(5);
    expect(start.getDate()).toBe(14);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
  });

  it('is 24 hours on a day without a DST transition', () => {
    const deadline = new Date(2026, 5, 15, 0, 0, 0);
    expect(getDeadlineWindowMs(deadline.toISOString())).toBe(24 * 60 * 60 * 1000);
  });

  it('clamps remaining ratio between 0 and 1', () => {
    const deadline = new Date(2026, 5, 15, 0, 0, 0).toISOString();
    const halfDay = 12 * 60 * 60 * 1000;

    expect(getRemainingRatio(halfDay, deadline)).toBe(0.5);
    expect(getRemainingRatio(0, deadline)).toBe(0);
    expect(getRemainingRatio(-1, deadline)).toBe(0);
    expect(getRemainingRatio(48 * 60 * 60 * 1000, deadline)).toBe(1);
  });
});
