import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CircleAlert, TriangleAlert } from 'lucide-react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/lib/theme';

type BannerTone = 'error' | 'warning' | 'info';

type BannerProps = {
  tone: BannerTone;
  body: string;
  actionLabel?: string;
  onPress?: () => void;
};

export function Banner({ tone, body, actionLabel, onPress }: BannerProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const palette = bannerPalette(theme, tone);
  const icon = tone === 'warning' ? TriangleAlert : CircleAlert;

  const content = (
    <>
      <AppIcon icon={icon} color={palette.fg} size="md" />
      <Text style={[styles.body, { color: palette.fg }]}>{body}</Text>
      {actionLabel ? (
        <Text style={[styles.action, { color: palette.fg }]}>{actionLabel}</Text>
      ) : null}
    </>
  );

  const containerStyle = [
    styles.container,
    { backgroundColor: palette.bg, borderColor: palette.fg },
  ];

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={actionLabel ?? 'Dismiss'}
        onPress={onPress}
        style={containerStyle}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={containerStyle}>{content}</View>;
}

function bannerPalette(theme: Theme, tone: BannerTone) {
  switch (tone) {
    case 'error':
      return { bg: theme.colors.errorMuted, fg: theme.colors.error };
    case 'warning':
      return { bg: theme.colors.warningMuted, fg: theme.colors.warning };
    case 'info':
      return { bg: theme.colors.accentMuted, fg: theme.colors.textSecondary };
  }
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.sm + 2,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.sm,
      borderWidth: StyleSheet.hairlineWidth,
    },
    body: {
      ...theme.typography.caption,
      flex: 1,
    },
    action: {
      ...theme.typography.caption,
      fontWeight: '600',
    },
  });
}
