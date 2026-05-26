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
import { colors, spacing, typography } from '@/lib/theme';
import type { Task } from '@/types/task';

const DEMO_TASKS: Task[] = [
  { id: '1', title: 'Finish the proposal draft', isPriority: true, isComplete: false },
  { id: '2', title: 'Reply to the client email', isPriority: false, isComplete: false },
  { id: '3', title: 'Go for a 20-minute walk', isPriority: false, isComplete: true },
];

export function TaskList() {
  const [draft, setDraft] = useState('');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Do The Thing</Text>
        <Text style={styles.subtitle}>
          Complete a priority task before the clock resets.
        </Text>
      </View>

      <FlatList
        data={DEMO_TASKS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TaskRow task={item} />}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={
          <Text style={styles.hint}>
            Add a task. Set a deadline. Your partner gets the text if you don&apos;t.
          </Text>
        }
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="What needs doing?"
          placeholderTextColor={colors.textMuted}
          value={draft}
          onChangeText={setDraft}
          editable={false}
        />
        <Pressable
          style={[styles.addButton, !draft && styles.addButtonDisabled]}
          disabled
          onPress={() => {
            // Sprint 1: add task
          }}
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
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.lg,
    paddingBottom: spacing.md,
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
    opacity: 0.4,
  },
  addButtonLabel: {
    ...typography.label,
    color: colors.background,
  },
});
