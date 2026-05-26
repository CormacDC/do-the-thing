import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/lib/theme';
import type { Task } from '@/types/task';

type TaskRowProps = {
  task: Task;
};

export function TaskRow({ task }: TaskRowProps) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.isComplete }}
        style={[styles.checkbox, task.isComplete && styles.checkboxComplete]}
        onPress={() => {
          // Sprint 1: toggle completion
        }}
      >
        {task.isComplete ? <Text style={styles.checkmark}>✓</Text> : null}
      </Pressable>

      <Text
        style={[styles.title, task.isComplete && styles.titleComplete]}
        numberOfLines={2}
      >
        {task.title}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={task.isPriority ? 'Priority task' : 'Mark as priority'}
        style={[styles.priorityButton, task.isPriority && styles.priorityActive]}
        onPress={() => {
          // Sprint 1: toggle priority
        }}
      >
        <Text style={[styles.priorityLabel, task.isPriority && styles.priorityLabelActive]}>
          {task.isPriority ? 'Priority' : 'Set'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxComplete: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  checkmark: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    flex: 1,
    ...typography.body,
    color: colors.text,
  },
  titleComplete: {
    color: colors.complete,
    textDecorationLine: 'line-through',
  },
  priorityButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priorityActive: {
    backgroundColor: colors.priorityMuted,
    borderColor: colors.priority,
  },
  priorityLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '500',
  },
  priorityLabelActive: {
    color: colors.priority,
  },
});
