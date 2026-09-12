import { useMemo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/lib/theme';

type EmptyStateProps = {
  title: string;
  body?: string;
  icon?: LucideIcon;
  action?: ReactNode;
};

export function EmptyState({ title, body, icon, action }: EmptyStateProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.wrap}>
      {icon ? (
        <AppIcon icon={icon} color={theme.colors.textSecondary} size="lg" />
      ) : null}
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    wrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
    },
    title: {
      ...theme.typography.label,
      color: theme.colors.textPrimary,
      textAlign: 'center',
    },
    body: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      maxWidth: 280,
    },
    action: {
      marginTop: theme.spacing.md,
      alignSelf: 'stretch',
      alignItems: 'center',
    },
  });
}
