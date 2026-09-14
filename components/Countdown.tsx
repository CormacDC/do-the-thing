import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/hooks/useTheme';
import { formatCountdown, getRemainingRatio } from '@/lib/deadline';
import type { Theme } from '@/lib/theme';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const RING_SIZE = 40;
const RING_STROKE = 2.5;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

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
  const progressColor = urgent ? theme.colors.warning : theme.colors.accent;
  const ratio = getRemainingRatio(remaining, deadlineAt);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Time remaining</Text>
      <View style={styles.timeRow}>
        <RemainingDayRing
          ratio={ratio}
          color={progressColor}
          trackColor={theme.colors.border}
        />
        <Text style={[styles.time, { color: progressColor }]}>
          {formatCountdown(remaining)}
        </Text>
      </View>
    </View>
  );
}

type RemainingDayRingProps = {
  ratio: number;
  color: string;
  trackColor: string;
};

function RemainingDayRing({ ratio, color, trackColor }: RemainingDayRingProps) {
  const dashOffset = RING_CIRCUMFERENCE * (1 - ratio);
  const percent = Math.round(ratio * 100);

  return (
    <Svg
      width={RING_SIZE}
      height={RING_SIZE}
      accessibilityRole="image"
      accessibilityLabel={`${percent} percent of the day remaining`}
    >
      <Circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
        stroke={trackColor}
        strokeWidth={RING_STROKE}
        fill="none"
      />
      {ratio > 0.001 ? (
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          stroke={color}
          strokeWidth={RING_STROKE}
          fill="none"
          strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
        />
      ) : null}
    </Svg>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      gap: theme.spacing.sm,
    },
    label: {
      ...theme.typography.overline,
      color: theme.colors.textSecondary,
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    time: {
      ...theme.typography.display,
    },
  });
}
