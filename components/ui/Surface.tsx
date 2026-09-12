import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/lib/theme';

type SurfaceProps = ViewProps & {
  children: ReactNode;
  padded?: boolean;
};

export function Surface({
  children,
  style,
  padded = true,
  ...rest
}: SurfaceProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.base, padded && styles.padded, style]} {...rest}>
      {children}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    base: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    padded: {
      padding: theme.spacing.md,
      gap: theme.spacing.md,
    },
  });
}
