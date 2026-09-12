import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Check, Star } from 'lucide-react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/lib/theme';
import type { Task } from '@/types/task';

type TaskRowProps = {
  task: Task;
  /** Locks completion/priority toggles when no deadline is actively running. */
  disabled?: boolean;
  onToggleComplete: (id: string) => void;
  onTogglePriority: (id: string) => void;
};

export function TaskRow({
  task,
  disabled = false,
  onToggleComplete,
  onTogglePriority,
}: TaskRowProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.row, disabled && styles.rowDisabled]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.isComplete, disabled }}
        accessibilityLabel={task.isComplete ? 'Mark as incomplete' : 'Mark as complete'}
        hitSlop={8}
        disabled={disabled}
        style={[styles.checkbox, task.isComplete && styles.checkboxComplete]}
        onPress={() => onToggleComplete(task.id)}
      >
        {task.isComplete ? (
          <AppIcon
            icon={Check}
            size="sm"
            color={theme.colors.textOnAccent}
          />
        ) : null}
      </Pressable>

      <Text
        style={[styles.title, task.isComplete && styles.titleComplete]}
        numberOfLines={2}
      >
        {task.title}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: task.isPriority, disabled }}
        accessibilityLabel={task.isPriority ? 'Remove priority' : 'Mark as priority'}
        hitSlop={8}
        disabled={disabled}
        style={styles.priorityHit}
        onPress={() => onTogglePriority(task.id)}
      >
        <AppIcon
          icon={Star}
          size="md"
          color={task.isPriority ? theme.colors.priority : theme.colors.textTertiary}
          fill={task.isPriority ? theme.colors.priority : 'none'}
        />
      </Pressable>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    rowDisabled: {
      opacity: 0.6,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.colors.borderStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxComplete: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accent,
    },
    title: {
      flex: 1,
      ...theme.typography.body,
      color: theme.colors.textPrimary,
    },
    titleComplete: {
      color: theme.colors.textTertiary,
      textDecorationLine: 'line-through',
    },
    priorityHit: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
