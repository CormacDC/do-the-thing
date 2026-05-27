import { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { TaskRow } from '@/components/TaskRow';
import { useTasks } from '@/hooks/useTasks';
import { colors, spacing, typography } from '@/lib/theme';

export function TaskList() {
  const { tasks, addTask, toggleComplete, togglePriority } = useTasks();
  const [draft, setDraft] = useState('');

  const canSubmit = draft.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    addTask(draft);
    setDraft('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Do The Thing</Text>
        <Text style={styles.subtitle}>
          Complete a priority task before the clock resets.
        </Text>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskRow
            task={item}
            onToggleComplete={toggleComplete}
            onTogglePriority={togglePriority}
          />
        )}
        style={styles.list}
        contentContainerStyle={
          tasks.length === 0 ? styles.listContentEmpty : styles.listContent
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nothing yet.</Text>
            <Text style={styles.emptyBody}>
              Add a task. Set a deadline. Your partner gets the text if you don&apos;t.
            </Text>
          </View>
        }
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="What needs doing?"
          placeholderTextColor={colors.textMuted}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
          blurOnSubmit={false}
          autoCorrect={false}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSubmit }}
          style={({ pressed }) => [
            styles.addButton,
            !canSubmit && styles.addButtonDisabled,
            pressed && canSubmit && styles.addButtonPressed,
          ]}
          disabled={!canSubmit}
          onPress={handleSubmit}
        >
          <Text style={styles.addButtonLabel}>Add</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.label,
    color: colors.text,
  },
  emptyBody: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  input: {
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
  addButton: {
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.text,
  },
  addButtonDisabled: {
    opacity: 0.3,
  },
  addButtonPressed: {
    opacity: 0.85,
  },
  addButtonLabel: {
    ...typography.label,
    color: colors.background,
  },
});
