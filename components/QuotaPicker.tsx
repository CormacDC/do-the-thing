import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { PrimaryButton, TextButton } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/lib/theme';

type QuotaPickerProps = {
  visible: boolean;
  submitting?: boolean;
  /** Shows the "day reset" heading and friends-notified copy. */
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
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [quota, setQuota] = useState(Math.max(1, initialQuota));

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
      ? 'Your friends were notified. Set a new quota to keep going.'
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
              <AppIcon icon={Minus} color={theme.colors.textPrimary} size="md" />
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
              <AppIcon icon={Plus} color={theme.colors.textPrimary} size="md" />
            </Pressable>
          </View>

          <Text style={styles.quotaUnit}>
            {quota === 1 ? 'task today' : 'tasks today'}
          </Text>

          <PrimaryButton
            label={confirmLabel}
            loading={submitting}
            onPress={handleConfirm}
          />

          {cancelable ? (
            <TextButton label="Cancel" disabled={submitting} onPress={handleCancel} />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: theme.colors.overlay,
    },
    sheet: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: theme.radius.xl,
      borderTopRightRadius: theme.radius.xl,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
      gap: theme.spacing.md,
      alignItems: 'center',
    },
    title: {
      ...theme.typography.title,
      color: theme.colors.textPrimary,
      alignSelf: 'flex-start',
    },
    subtitle: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
      alignSelf: 'flex-start',
    },
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xl,
      paddingVertical: theme.spacing.md,
    },
    stepButton: {
      width: 44,
      height: 44,
      borderRadius: theme.radius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepButtonDisabled: {
      opacity: 0.3,
    },
    stepButtonPressed: {
      opacity: 0.7,
    },
    quotaNumber: {
      ...theme.typography.numeric,
      color: theme.colors.textPrimary,
      minWidth: 64,
      textAlign: 'center',
    },
    quotaUnit: {
      ...theme.typography.overline,
      color: theme.colors.textSecondary,
      marginTop: -theme.spacing.sm,
    },
  });
}
