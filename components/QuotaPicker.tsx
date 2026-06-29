import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, spacing, typography } from '@/lib/theme';

type QuotaPickerProps = {
  visible: boolean;
  submitting?: boolean;
  /** Shows the "day reset" heading and accountability-partner copy. */
  expired?: boolean;
  /** Shows "adjust quota" heading and one-time-adjustment copy. */
  adjusting?: boolean;
  /** Starting value for the stepper (defaults to 1). */
  initialQuota?: number;
  /**
   * When true, the user may back out — used for the new-task flow where
   * cancelling discards the unsaved task. Setting a quota itself is never
   * optional; this only abandons adding the task.
   */
  cancelable?: boolean;
  onConfirm: (quota: number) => void;
  onCancel?: () => void;
};

export function QuotaPicker({
  visible,
  submitting = false,
  expired = false,
  adjusting = false,
  initialQuota = 1,
  cancelable = false,
  onConfirm,
  onCancel,
}: QuotaPickerProps) {
  const [quota, setQuota] = useState(Math.max(1, initialQuota));

  // Sync the stepper to initialQuota each time the modal opens.
  useEffect(() => {
    if (visible) {
      setQuota(Math.max(1, initialQuota));
    }
  }, [visible, initialQuota]);

  const decrement = () => setQuota((q) => Math.max(1, q - 1));
  const increment = () => setQuota((q) => q + 1);

  const title = adjusting
    ? 'Adjust quota'
    : expired
      ? 'Day reset'
      : "Set today's quota";

  const subtitle = adjusting
    ? 'You can adjust your quota once per day. This change takes effect immediately.'
    : expired
      ? 'Your accountability partner was notified. Set a new quota to keep going.'
      : 'How many tasks will you complete today?';

  const confirmLabel = submitting ? 'Saving…' : adjusting ? 'Update' : 'Commit';

  const handleConfirm = () => {
    if (submitting) return;
    onConfirm(quota);
  };

  const handleCancel = () => {
    if (submitting) return;
    onCancel?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      // Non-dismissible: hardware back / swipe only backs out when cancelable.
      onRequestClose={cancelable ? handleCancel : undefined}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <View style={styles.stepper}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Decrease quota"
              disabled={quota <= 1 || submitting}
              style={({ pressed }) => [
                styles.stepButton,
                (quota <= 1 || submitting) && styles.stepButtonDisabled,
                pressed && quota > 1 && !submitting && styles.stepButtonPressed,
              ]}
              onPress={decrement}
            >
              <Text style={styles.stepSymbol}>−</Text>
            </Pressable>

            <Text style={styles.quotaNumber}>{quota}</Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Increase quota"
              disabled={submitting}
              style={({ pressed }) => [
                styles.stepButton,
                submitting && styles.stepButtonDisabled,
                pressed && !submitting && styles.stepButtonPressed,
              ]}
              onPress={increment}
            >
              <Text style={styles.stepSymbol}>+</Text>
            </Pressable>
          </View>

          <Text style={styles.quotaUnit}>{quota === 1 ? 'task today' : 'tasks today'}</Text>

          <Pressable
            accessibilityRole="button"
            disabled={submitting}
            style={({ pressed }) => [
              styles.confirmButton,
              submitting && styles.confirmButtonDisabled,
              pressed && !submitting && styles.confirmButtonPressed,
            ]}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmLabel}>{confirmLabel}</Text>
          </Pressable>

          {cancelable ? (
            <Pressable
              accessibilityRole="button"
              disabled={submitting}
              style={styles.dismiss}
              onPress={handleCancel}
            >
              <Text style={styles.dismissLabel}>Cancel</Text>
            </Pressable>
          ) : null}
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
    alignItems: 'center',
  },
  title: {
    ...typography.title,
    color: colors.text,
    alignSelf: 'flex-start',
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    alignSelf: 'flex-start',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.md,
  },
  stepButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonDisabled: {
    opacity: 0.3,
  },
  stepButtonPressed: {
    opacity: 0.7,
  },
  stepSymbol: {
    fontSize: 22,
    color: colors.text,
    lineHeight: 26,
  },
  quotaNumber: {
    fontSize: 56,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
    minWidth: 64,
    textAlign: 'center',
  },
  quotaUnit: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: -spacing.sm,
  },
  confirmButton: {
    width: '100%',
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.text,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  confirmButtonDisabled: {
    opacity: 0.4,
  },
  confirmButtonPressed: {
    opacity: 0.85,
  },
  confirmLabel: {
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
