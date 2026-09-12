import { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/lib/theme';

type TextFieldProps = Omit<TextInputProps, 'style' | 'placeholderTextColor'> & {
  label?: string;
  icon?: LucideIcon;
  containerStyle?: StyleProp<ViewStyle>;
};

export function TextField({
  label,
  icon,
  containerStyle,
  editable = true,
  multiline = false,
  ...inputProps
}: TextFieldProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.field, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputRow, multiline && styles.inputRowMultiline, !editable && styles.disabled]}>
        {icon ? (
          <AppIcon icon={icon} color={theme.colors.textSecondary} size="md" />
        ) : null}
        <TextInput
          {...inputProps}
          editable={editable}
          multiline={multiline}
          placeholderTextColor={theme.colors.textSecondary}
          style={[styles.input, multiline && styles.multiline]}
        />
      </View>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    field: {
      gap: theme.spacing.sm,
    },
    label: {
      ...theme.typography.label,
      color: theme.colors.textPrimary,
    },
    inputRow: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.md,
    },
    inputRowMultiline: {
      alignItems: 'flex-start',
      paddingVertical: theme.spacing.sm,
    },
    input: {
      flex: 1,
      ...theme.typography.body,
      color: theme.colors.textPrimary,
      paddingVertical: theme.spacing.sm + 2,
    },
    multiline: {
      minHeight: 100,
      paddingTop: theme.spacing.sm + 2,
      textAlignVertical: 'top',
    },
    disabled: {
      opacity: 0.5,
    },
  });
}
