import { useMemo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/lib/theme';

type SettingsRowProps = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  showSeparator?: boolean;
};

export function SettingsRow({
  icon,
  title,
  subtitle,
  trailing,
  showSeparator = true,
}: SettingsRowProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.row, showSeparator && styles.separator]}>
      <AppIcon icon={icon} color={theme.colors.textSecondary} size="md" />
      <View style={styles.meta}>
        <Text style={styles.title}>{title}</Text>
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
    meta: {
      flex: 1,
      gap: 2,
    },
    title: {
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
