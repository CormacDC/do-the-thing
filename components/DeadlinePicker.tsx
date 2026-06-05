import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors, spacing, typography } from '@/lib/theme';

const PRESETS: { label: string; seconds: number }[] = [
  { label: '1 hour', seconds: 1 * 3600 },
  { label: '2 hours', seconds: 2 * 3600 },
  { label: '4 hours', seconds: 4 * 3600 },
  { label: '8 hours', seconds: 8 * 3600 },
  { label: '24 hours', seconds: 24 * 3600 },
];

type DeadlinePickerProps = {
  visible: boolean;
  submitting?: boolean;
  onConfirm: (durationSeconds: number) => void;
  onDismiss: () => void;
};

export function DeadlinePicker({
  visible,
  submitting = false,
  onConfirm,
  onDismiss,
}: DeadlinePickerProps) {
  const [customHours, setCustomHours] = useState('');

  const parsedHours = Number.parseFloat(customHours);
  const customSeconds = Math.round(parsedHours * 3600);
  const customValid = Number.isFinite(customSeconds) && customSeconds > 0;

  const handleConfirm = (seconds: number) => {
    if (submitting) return;
    onConfirm(seconds);
    setCustomHours('');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Set your deadline</Text>
          <Text style={styles.subtitle}>
            Choose how long you have. Miss it, and your partner hears about it.
          </Text>

          <View style={styles.options}>
            {PRESETS.map((preset) => (
              <Pressable
                key={preset.seconds}
                accessibilityRole="button"
                disabled={submitting}
                style={({ pressed }) => [
                  styles.option,
                  pressed && !submitting && styles.optionPressed,
                ]}
                onPress={() => handleConfirm(preset.seconds)}
              >
                <Text style={styles.optionLabel}>{preset.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.customRow}>
            <TextInput
              style={styles.customInput}
              placeholder="Custom hours"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={customHours}
              onChangeText={setCustomHours}
              editable={!submitting}
              returnKeyType="done"
              onSubmitEditing={() => customValid && handleConfirm(customSeconds)}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !customValid || submitting }}
              disabled={!customValid || submitting}
              style={({ pressed }) => [
                styles.customButton,
                (!customValid || submitting) && styles.customButtonDisabled,
                pressed && customValid && !submitting && styles.optionPressed,
              ]}
              onPress={() => handleConfirm(customSeconds)}
            >
              <Text style={styles.customButtonLabel}>Set</Text>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={submitting}
            style={styles.dismiss}
            onPress={onDismiss}
          >
            <Text style={styles.dismissLabel}>Not yet</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#00000055',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
  },
  options: {
    gap: spacing.sm,
  },
  option: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBackground,
  },
  optionPressed: {
    opacity: 0.7,
  },
  optionLabel: {
    ...typography.label,
    color: colors.text,
  },
  customRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  customInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  customButton: {
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 4,
    borderRadius: 10,
    backgroundColor: colors.text,
  },
  customButtonDisabled: {
    opacity: 0.3,
  },
  customButtonLabel: {
    ...typography.label,
    color: colors.background,
  },
  dismiss: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  dismissLabel: {
    ...typography.label,
    color: colors.textMuted,
  },
});
