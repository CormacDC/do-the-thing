import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { TaskRow } from '@/components/TaskRow';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import { colors, spacing, typography } from '@/lib/theme';

export function TaskList() {
  const auth = useAuth();
  const {
    tasks,
    loading,
    error,
    mutationError,
    dismissMutationError,
    addTask,
    toggleComplete,
    togglePriority,
    retry,
  } = useTasks(auth.userId);

  const [draft, setDraft] = useState('');
  const canSubmit = draft.trim().length > 0 && !!auth.userId;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const value = draft;
    setDraft('');
    await addTask(value);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Do The Thing</Text>
        <Text style={styles.subtitle}>
          Complete a priority task before the clock resets.
        </Text>
      </View>

      {mutationError ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss error"
          style={styles.banner}
          onPress={dismissMutationError}
        >
          <Text style={styles.bannerText}>{mutationError}</Text>
          <Text style={styles.bannerDismiss}>Dismiss</Text>
        </Pressable>
      ) : null}

      <Body
        auth={auth}
        tasks={tasks}
        loading={loading}
        error={error}
        onToggleComplete={toggleComplete}
        onTogglePriority={togglePriority}
        onRetry={retry}
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
          editable={!!auth.userId}
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

type BodyProps = {
  auth: ReturnType<typeof useAuth>;
  tasks: ReturnType<typeof useTasks>['tasks'];
  loading: boolean;
  error: string | null;
  onToggleComplete: (id: string) => void;
  onTogglePriority: (id: string) => void;
  onRetry: () => void;
};

function Body({
  auth,
  tasks,
  loading,
  error,
  onToggleComplete,
  onTogglePriority,
  onRetry,
}: BodyProps) {
  if (auth.error) {
    return (
      <CenteredState
        title="Can't sign in"
        body={auth.error}
        actionLabel="Try again"
        onAction={auth.retry}
      />
    );
  }

  if (auth.loading || (loading && tasks.length === 0)) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.textMuted} />
      </View>
    );
  }

  if (error && tasks.length === 0) {
    return (
      <CenteredState
        title="Couldn't load tasks"
        body={error}
        actionLabel="Try again"
        onAction={onRetry}
      />
    );
  }

  return (
    <FlatList
      data={tasks}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TaskRow
          task={item}
          onToggleComplete={onToggleComplete}
          onTogglePriority={onTogglePriority}
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
  );
}

type CenteredStateProps = {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
};

function CenteredState({ title, body, actionLabel, onAction }: CenteredStateProps) {
  return (
    <View style={styles.centered}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.retry, pressed && styles.retryPressed]}
          onPress={onAction}
        >
          <Text style={styles.retryLabel}>{actionLabel}</Text>
        </Pressable>
      ) : null}
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
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.priorityMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.priority,
  },
  bannerText: {
    ...typography.caption,
    color: colors.priority,
    flex: 1,
  },
  bannerDismiss: {
    ...typography.caption,
    color: colors.priority,
    fontWeight: '600',
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  retry: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  retryPressed: {
    opacity: 0.7,
  },
  retryLabel: {
    ...typography.label,
    color: colors.text,
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
