import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/lib/theme';

type FriendCodeCardProps = {
  code: string;
  hint?: string;
};

export function FriendCodeCard({
  code,
  hint = 'Share this so friends can add you.',
}: FriendCodeCardProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.card}>
      <Text style={styles.overline}>Your friend code</Text>
      <Text style={styles.code}>{code}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: theme.radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    overline: {
      ...theme.typography.overline,
      color: theme.colors.textSecondary,
    },
    code: {
      ...theme.typography.title,
      color: theme.colors.textPrimary,
      letterSpacing: 4,
      fontVariant: ['tabular-nums'],
    },
    hint: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });
}
