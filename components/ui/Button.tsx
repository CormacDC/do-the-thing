import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/lib/theme';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  accessibilityLabel?: string;
  fullWidth?: boolean;
};

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  icon,
  accessibilityLabel,
  fullWidth = true,
}: PrimaryButtonProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primary,
        fullWidth ? styles.fullWidth : styles.hug,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.primaryPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.textOnAccent} />
      ) : icon ? (
        <AppIcon icon={icon} color={theme.colors.textOnAccent} size="md" />
      ) : null}
      <Text style={styles.primaryLabel}>{label}</Text>
    </Pressable>
  );
}

type SecondaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  accessibilityLabel?: string;
};

export function SecondaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  icon,
  accessibilityLabel,
}: SecondaryButtonProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.secondary,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      {icon ? (
        <AppIcon icon={icon} color={theme.colors.textPrimary} size="md" />
      ) : null}
      <Text style={styles.secondaryLabel}>{label}</Text>
    </Pressable>
  );
}

type TextButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: LucideIcon;
  tone?: 'default' | 'danger';
  accessibilityLabel?: string;
};

export function TextButton({
  label,
  onPress,
  disabled = false,
  icon,
  tone = 'default',
  accessibilityLabel,
}: TextButtonProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const color =
    tone === 'danger' ? theme.colors.error : theme.colors.textSecondary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.textButton,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {icon ? <AppIcon icon={icon} color={color} size="sm" /> : null}
      <Text style={[styles.textButtonLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

type IconButtonProps = {
  icon: LucideIcon;
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
  color?: string;
  fill?: string;
};

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  disabled = false,
  color,
  fill,
}: IconButtonProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const iconColor = color ?? theme.colors.textSecondary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <AppIcon icon={icon} color={iconColor} size="md" fill={fill} />
    </Pressable>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    primary: {
      minHeight: 48,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    primaryPressed: {
      backgroundColor: theme.colors.accentPressed,
    },
    primaryLabel: {
      ...theme.typography.label,
      color: theme.colors.textOnAccent,
    },
    secondary: {
      minHeight: 48,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    secondaryLabel: {
      ...theme.typography.label,
      color: theme.colors.textPrimary,
    },
    textButton: {
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.sm,
    },
    textButtonLabel: {
      ...theme.typography.label,
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: theme.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fullWidth: {
      alignSelf: 'stretch',
    },
    hug: {
      alignSelf: 'center',
      paddingHorizontal: theme.spacing.md,
    },
    disabled: {
      opacity: 0.4,
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
