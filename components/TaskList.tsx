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

import { Countdown } from '@/components/Countdown';
import { DeadlinePicker } from '@/components/DeadlinePicker';
import { TaskRow } from '@/components/TaskRow';
import { useAppState } from '@/hooks/useAppState';
import { useAuth } from '@/hooks/useAuth';
import { colors, spacing, typography } from '@/lib/theme';
import { AppState } from '@/types/appState';
import type { Task } from '@/types/task';

export function TaskList() {
  const auth = useAuth();
  const {
    state,
    tasks,
    deadline,
    loading,
    error,
    mutationError,
    dismissMutationError,
    addTask,
    toggleComplete,
    togglePriority,
    confirmDeadline,
    expireDeadline,
    retry,
  } = useAppState();

  const [draft, setDraft] = useState('');
  // A task typed while no deadline is running is held here until the user picks
  // a deadline — the two are committed together so a task never exists without
  // one. Null means no add is in flight.
  const [pendingTitle, setPendingTitle] = useState<string | null>(null);
  const [settingDeadline, setSettingDeadline] = useState(false);

  const isExpired = state === AppState.EXPIRED;
  // Tasks can only be toggled while a deadline is actively running.
  const tasksLocked = state !== AppState.ACTIVE;
  // Adding is blocked while EXPIRED — a new deadline must be set first.
  const canSubmit = draft.trim().length > 0 && !!auth.userId && !isExpired;
  // The picker is forced in EXPIRED, and shown during the new-task flow.
  const pickerVisible = isExpired || pendingTitle !== null;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const value = draft.trim();
    setDraft('');

    if (state === AppState.ACTIVE) {
      // A deadline is already running — add immediately.
      void addTask(value);
      return;
    }

    // EMPTY or COMPLETE: hold the task and force a deadline before saving it.
    setPendingTitle(value);
  };

  const handleConfirmDeadline = async (durationSeconds: number) => {
    setSettingDeadline(true);

    if (pendingTitle !== null) {
      // New-task flow: commit the task and its deadline together. Firing both
      // optimistic updates in the same tick lands directly in ACTIVE with no
      // COMPLETE/EXPIRED flicker in between.
      await Promise.all([addTask(pendingTitle), confirmDeadline(durationSeconds)]);
      setPendingTitle(null);
    } else {
      // EXPIRED flow: set a new deadline for the existing tasks.
      await confirmDeadline(durationSeconds);
    }

    setSettingDeadline(false);
  };

  const handleCancelAdd = () => {
    setPendingTitle(null);
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

      <TimerArea
        state={state}
        deadlineAt={deadline?.deadlineAt ?? null}
        onExpire={expireDeadline}
      />

      <Body
        auth={auth}
        tasks={tasks}
        loading={loading}
        error={error}
        tasksLocked={tasksLocked}
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
          editable={!!auth.userId && !isExpired}
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

      <DeadlinePicker
        visible={pickerVisible}
        submitting={settingDeadline}
        expired={isExpired}
        cancelable={pendingTitle !== null}
        onConfirm={handleConfirmDeadline}
        onCancel={handleCancelAdd}
      />
    </View>
  );
}

type TimerAreaProps = {
  state: AppState;
  deadlineAt: string | null;
  onExpire: () => void;
};

function TimerArea({ state, deadlineAt, onExpire }: TimerAreaProps) {
  if (state === AppState.ACTIVE && deadlineAt) {
    return <Countdown deadlineAt={deadlineAt} onExpire={onExpire} />;
  }

  // EXPIRED forces the (non-dismissible) picker on top of this; the message is
  // a fallback for the brief moment before the modal animates in.
  if (state === AppState.EXPIRED) {
    return (
      <View style={styles.expired}>
        <Text style={styles.expiredLabel}>Deadline passed</Text>
        <Text style={styles.setDeadlineHint}>
          Your accountability partner was notified. Set a new deadline to keep going.
        </Text>
      </View>
    );
  }

  return null;
}

type BodyProps = {
  auth: ReturnType<typeof useAuth>;
  tasks: Task[];
  loading: boolean;
  error: string | null;
  tasksLocked: boolean;
  onToggleComplete: (id: string) => void;
  onTogglePriority: (id: string) => void;
  onRetry: () => void;
};

function Body({
  auth,
  tasks,
  loading,
  error,
  tasksLocked,
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
          // Completed tasks are locked everywhere; others lock when no deadline runs.
          disabled={tasksLocked || item.isComplete}
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
  expired: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.priority,
    backgroundColor: colors.priorityMuted,
    gap: spacing.xs,
  },
  expiredLabel: {
    ...typography.label,
    color: colors.priority,
  },
  setDeadlineHint: {
    ...typography.caption,
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
