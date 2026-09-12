import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RotateCcw } from 'lucide-react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { useAppState } from '@/hooks/useAppState';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/lib/theme';

export function DevResetButton() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { deadline, loading, devResetDay } = useAppState();
  const [resetting, setResetting] = useState(false);

  const disabled = loading || resetting || !deadline || deadline.dailyQuota < 1;

  const handlePress = async () => {
    if (disabled) return;
    setResetting(true);
    await devResetDay();
    setResetting(false);
  };

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dev reset day"
        disabled={disabled}
        style={({ pressed }) => [
          styles.button,
          disabled && styles.buttonDisabled,
          pressed && !disabled && styles.buttonPressed,
        ]}
        onPress={handlePress}
      >
        <AppIcon icon={RotateCcw} color={theme.colors.textSecondary} size="sm" />
        <Text style={styles.label}>
          {resetting ? 'Resetting…' : 'Dev: Reset day'}
        </Text>
      </Pressable>
      <Text style={styles.hint}>Restarts quota timer. Tasks unchanged.</Text>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      gap: theme.spacing.xs,
      paddingBottom: theme.spacing.sm,
    },
    button: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radius.sm,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      borderStyle: 'dashed',
    },
    buttonDisabled: {
      opacity: 0.4,
    },
    buttonPressed: {
      opacity: 0.7,
    },
    label: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    hint: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
    },
  });
}
