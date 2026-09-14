import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Check, Star } from 'lucide-react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/lib/theme';
import type { Task } from '@/types/task';

type TaskRowProps = {
  task: Task;
  /** Locks completion/priority toggles; edit and delete stay available. */
  togglesLocked?: boolean;
  onToggleComplete: (id: string) => void;
  onTogglePriority: (id: string) => void;
  onUpdateTitle: (id: string, title: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onEditStart?: (id: string) => void;
};

function isPersistedTaskId(id: string): boolean {
  return !id.startsWith('temp-');
}

export function TaskRow({
  task,
  togglesLocked = false,
  onToggleComplete,
  onTogglePriority,
  onUpdateTitle,
  onDelete,
  onEditStart,
}: TaskRowProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const swipeableRef = useRef<Swipeable>(null);
  const editingRef = useRef(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);

  const canMutate = isPersistedTaskId(task.id);

  useEffect(() => {
    if (!editing) setDraft(task.title);
  }, [task.title, editing]);

  const beginEdit = () => {
    if (!canMutate) return;
    setDraft(task.title);
    editingRef.current = true;
    setEditing(true);
    swipeableRef.current?.close();
    onEditStart?.(task.id);
  };

  const commitEdit = () => {
    if (!editingRef.current) return;
    editingRef.current = false;
    setEditing(false);

    const trimmed = draft.trim();
    if (!trimmed || trimmed === task.title) {
      setDraft(task.title);
      return;
    }

    void onUpdateTitle(task.id, trimmed);
  };

  const confirmDelete = () => {
    Alert.alert('Delete this task?', undefined, [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => swipeableRef.current?.close(),
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void onDelete(task.id);
        },
      },
    ]);
  };

  const renderRightActions = () => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Delete task"
      onPress={confirmDelete}
      style={styles.deleteAction}
    >
      <Text style={styles.deleteLabel}>Delete</Text>
    </Pressable>
  );

  return (
    <Swipeable
      ref={swipeableRef}
      enabled={canMutate && !editing}
      overshootRight={false}
      renderRightActions={renderRightActions}
    >
      <View style={styles.row}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: task.isComplete, disabled: togglesLocked }}
          accessibilityLabel={task.isComplete ? 'Mark as incomplete' : 'Mark as complete'}
          hitSlop={8}
          disabled={togglesLocked}
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

        {editing ? (
          <TextInput
            accessibilityLabel="Task title"
            style={styles.titleInput}
            value={draft}
            onChangeText={setDraft}
            onBlur={commitEdit}
            onSubmitEditing={commitEdit}
            returnKeyType="done"
            blurOnSubmit
            autoFocus
            autoCorrect={false}
          />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Edit task ${task.title}`}
            disabled={!canMutate}
            onPress={beginEdit}
            style={styles.titleHit}
          >
            <Text
              style={[styles.title, task.isComplete && styles.titleComplete]}
              numberOfLines={2}
            >
              {task.title}
            </Text>
          </Pressable>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: task.isPriority, disabled: togglesLocked }}
          accessibilityLabel={task.isPriority ? 'Remove priority' : 'Mark as priority'}
          hitSlop={8}
          disabled={togglesLocked}
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
    </Swipeable>
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
      backgroundColor: theme.colors.background,
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
    titleHit: {
      flex: 1,
    },
    title: {
      ...theme.typography.body,
      color: theme.colors.textPrimary,
    },
    titleComplete: {
      color: theme.colors.textTertiary,
      textDecorationLine: 'line-through',
    },
    titleInput: {
      flex: 1,
      ...theme.typography.body,
      color: theme.colors.textPrimary,
      paddingVertical: 0,
    },
    priorityHit: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteAction: {
      backgroundColor: theme.colors.error,
      justifyContent: 'center',
      alignItems: 'center',
      width: 88,
    },
    deleteLabel: {
      ...theme.typography.label,
      color: theme.colors.textOnAccent,
    },
  });
}
