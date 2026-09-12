import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/lib/theme';

type SectionHeaderProps = {
  title: string;
  caption?: string;
};

export function SectionHeader({ title, caption }: SectionHeaderProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    wrap: {
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.sm,
    },
    title: {
      ...theme.typography.overline,
      color: theme.colors.textSecondary,
    },
    caption: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
    },
  });
}
