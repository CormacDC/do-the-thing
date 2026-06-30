import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppState } from '@/hooks/useAppState';
import { colors, spacing, typography } from '@/lib/theme';

export function DevResetButton() {
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
        <Text style={styles.label}>{resetting ? 'Resetting…' : 'Dev: Reset day'}</Text>
      </Pressable>
      <Text style={styles.hint}>Restarts quota timer. Tasks unchanged.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  button: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '500',
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
