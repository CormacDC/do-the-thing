import { useMemo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/lib/theme';

type FriendRowProps = {
  displayName: string;
  subtitle?: string;
  trailing?: ReactNode;
  showSeparator?: boolean;
};

export function FriendRow({
  displayName,
  subtitle,
  trailing,
  showSeparator = true,
}: FriendRowProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const initial = displayName.trim().charAt(0).toUpperCase() || '?';

  return (
    <View style={[styles.row, showSeparator && styles.separator]}>
      <View style={styles.avatar}>
        <Text style={styles.initial}>{initial}</Text>
      </View>
      <View style={styles.meta}>
        <Text style={styles.name}>{displayName}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      minHeight: 52,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    separator: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    initial: {
      ...theme.typography.label,
      color: theme.colors.textPrimary,
    },
    meta: {
      flex: 1,
      gap: 2,
    },
    name: {
      ...theme.typography.body,
      color: theme.colors.textPrimary,
    },
    subtitle: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
    },
    trailing: {
      flexShrink: 0,
    },
  });
}
