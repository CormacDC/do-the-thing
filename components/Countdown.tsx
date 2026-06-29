import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/lib/theme';

/** Returns an ISO string for 00:00:00 of tomorrow (midnight tonight) in local time. */
function getMidnightISO(): string {
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  return midnight.toISOString();
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

type CountdownProps = {
  /** Called once when midnight arrives so the daily reset can run. */
  onExpire: () => void;
};

export function Countdown({ onExpire }: CountdownProps) {
  // Midnight is computed once on mount. If the app is open continuously, this
  // component will be unmounted when the state transitions after onExpire fires,
  // so there is no need to re-arm for the following day.
  const [deadlineAt] = useState(getMidnightISO);
  const [now, setNow] = useState(() => Date.now());
  const firedRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const remaining = new Date(deadlineAt).getTime() - now;

  useEffect(() => {
    if (remaining <= 0 && !firedRef.current) {
      firedRef.current = true;
      onExpire();
    }
  }, [remaining, onExpire]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Time remaining</Text>
      <Text style={styles.time}>{formatRemaining(remaining)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  time: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
});
