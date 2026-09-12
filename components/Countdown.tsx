import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/lib/theme';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

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
  /** ISO timestamp to count down toward. */
  deadlineAt: string;
  /** Called once when the deadline arrives so the daily reset can run. */
  onExpire: () => void;
};

export function Countdown({ deadlineAt, onExpire }: CountdownProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [now, setNow] = useState(() => Date.now());
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
  }, [deadlineAt]);

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

  const urgent = remaining > 0 && remaining < TWO_HOURS_MS;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Time remaining</Text>
      <Text style={[styles.time, urgent && styles.timeUrgent]}>
        {formatRemaining(remaining)}
      </Text>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      gap: theme.spacing.xs,
    },
    label: {
      ...theme.typography.overline,
      color: theme.colors.textSecondary,
    },
    time: {
      ...theme.typography.display,
      color: theme.colors.textPrimary,
    },
    timeUrgent: {
      color: theme.colors.warning,
    },
  });
}
