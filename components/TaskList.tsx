import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { Countdown } from '@/components/Countdown';
import { QuotaPicker } from '@/components/QuotaPicker';
import { TaskRow } from '@/components/TaskRow';
import { useAppState } from '@/hooks/useAppState';
import { useAuth } from '@/hooks/useAuth';
import { colors, spacing, typography } from '@/lib/theme';
import { AppState } from '@/types/appState';
import type { Deadline } from '@/types/deadline';
import type { Task } from '@/types/task';

/**
 * Snapshot of the day's progress captured at the moment of the ACTIVE →
 * EXPIRED transition, so the expiry copy shows accurate pre-reset counts even
 * after tasks_completed_today is zeroed in Supabase.
 */
type ExpiredSnapshot = {
  completed: number;
  quota: number;
  hasPriorityTasks: boolean;
};

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
    confirmQuota,
    adjustQuota,
    canAdjustQuota,
    expireDeadline,
    retry,
  } = useAppState();

  const [draft, setDraft] = useState('');
  // A task typed while no active quota exists is held here until the user
  // picks a quota — the two are committed together so a task never exists
  // without one. Null means no add is in flight.
  const [pendingTitle, setPendingTitle] = useState<string | null>(null);
  const [settingQuota, setSettingQuota] = useState(false);
  const [showAdjustPicker, setShowAdjustPicker] = useState(false);
  const [adjustingQuota, setAdjustingQuota] = useState(false);

  // Capture a snapshot of quota progress whenever the state transitions from
  // ACTIVE to EXPIRED, so the expiry copy can show accurate counts even after
  // tasks_completed_today is zeroed server-side.
  const [expiredSnapshot, setExpiredSnapshot] = useState<ExpiredSnapshot | null>(null);
  const prevStateRef = useRef<AppState>(state);

  useEffect(() => {
    if (prevStateRef.current === AppState.ACTIVE && state === AppState.EXPIRED && deadline) {
      setExpiredSnapshot({
        completed: deadline.tasksCompletedToday,
        quota: deadline.dailyQuota,
        hasPriorityTasks: tasks.some((t) => t.isPriority),
      });
    }
    if (state !== AppState.EXPIRED) {
      setExpiredSnapshot(null);
    }
    prevStateRef.current = state;
  }, [state, deadline, tasks]);

  const isExpired = state === AppState.EXPIRED;
  // Tasks can be completed in ACTIVE and COMPLETE states. In COMPLETE, the
  // quota has already been met so completions are recorded but don't count.
  const tasksLocked = state === AppState.EMPTY || state === AppState.EXPIRED;
  const canSubmit = draft.trim().length > 0 && !!auth.userId && !isExpired;
  // The quota picker is forced in EXPIRED, and shown during the new-task flow.
  const pickerVisible = isExpired || pendingTitle !== null;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const value = draft.trim();
    setDraft('');

    if (state === AppState.ACTIVE || state === AppState.COMPLETE) {
      // ACTIVE: deadline running, add directly.
      // COMPLETE: quota already met today — add directly without a new quota
      // prompt. The day's objective is done; the task carries forward to tomorrow.
      void addTask(value);
      return;
    }

    // EMPTY or EXPIRED: no active quota exists, must pick one before saving.
    setPendingTitle(value);
  };

  const handleConfirmQuota = async (quota: number) => {
    setSettingQuota(true);

    if (pendingTitle !== null) {
      // New-task flow: commit the task and its quota atomically. Both optimistic
      // updates land in the same tick so there is no COMPLETE/EXPIRED flicker.
      await Promise.all([addTask(pendingTitle), confirmQuota(quota)]);
      setPendingTitle(null);
    } else {
      // EXPIRED flow: set a new quota for the existing tasks.
      await confirmQuota(quota);
    }

    setSettingQuota(false);
  };

  const handleCancelAdd = () => {
    setPendingTitle(null);
  };

  const handleAdjustQuota = async (newQuota: number) => {
    setAdjustingQuota(true);
    setShowAdjustPicker(false);
    await adjustQuota(newQuota);
    setAdjustingQuota(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Do The Thing</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            style={({ pressed }) => [styles.settingsButton, pressed && styles.settingsPressed]}
            onPress={() => router.push('/settings')}
          >
            <Text style={styles.settingsLabel}>Settings</Text>
          </Pressable>
        </View>
        <Text style={styles.subtitle}>
          Complete your daily quota before midnight.
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
        deadline={deadline}
        tasks={tasks}
        expiredSnapshot={expiredSnapshot}
        onExpire={expireDeadline}
        canAdjustQuota={canAdjustQuota}
        onAdjustQuota={() => setShowAdjustPicker(true)}
        adjustingQuota={adjustingQuota}
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

      <QuotaPicker
        visible={pickerVisible}
        submitting={settingQuota}
        expired={isExpired && pendingTitle === null}
        cancelable={pendingTitle !== null}
        onConfirm={handleConfirmQuota}
        onCancel={handleCancelAdd}
      />

      <QuotaPicker
        visible={showAdjustPicker}
        submitting={adjustingQuota}
        adjusting
        initialQuota={deadline?.dailyQuota ?? 1}
        cancelable
        onConfirm={handleAdjustQuota}
        onCancel={() => setShowAdjustPicker(false)}
      />
    </View>
  );
}

type TimerAreaProps = {
  state: AppState;
  deadline: Deadline | null;
  tasks: Task[];
  expiredSnapshot: ExpiredSnapshot | null;
  onExpire: () => void;
  canAdjustQuota: boolean;
  onAdjustQuota: () => void;
  adjustingQuota: boolean;
};

function TimerArea({
  state,
  deadline,
  expiredSnapshot,
  onExpire,
  canAdjustQuota,
  onAdjustQuota,
  adjustingQuota,
}: TimerAreaProps) {
  if (state === AppState.ACTIVE) {
    const completed = deadline?.tasksCompletedToday ?? 0;
    const quota = deadline?.dailyQuota ?? 0;

    return (
      <View>
        <Countdown onExpire={onExpire} />
        {quota > 0 ? (
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>
              {completed} of {quota} {quota === 1 ? 'task' : 'tasks'} completed today
            </Text>
            {canAdjustQuota ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Adjust today's quota"
                disabled={adjustingQuota}
                style={({ pressed }) => [
                  styles.adjustButton,
                  pressed && styles.adjustButtonPressed,
                ]}
                onPress={onAdjustQuota}
              >
                <Text style={styles.adjustLabel}>
                  {adjustingQuota ? 'Saving…' : 'Adjust'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  }

  if (state === AppState.EXPIRED) {
    // Use the snapshot when available (live transition); fall back to deadline
    // values for the app-open-after-missed-reset case.
    const completed = expiredSnapshot?.completed ?? deadline?.tasksCompletedToday ?? 0;
    const quota = expiredSnapshot?.quota ?? deadline?.dailyQuota ?? 0;
    const hasPriorityTasks = expiredSnapshot?.hasPriorityTasks ?? false;

    let message: string;
    if (completed === 0 && hasPriorityTasks) {
      message =
        "You didn't complete any of your Priority tasks today. Your accountability partner has been notified.";
    } else if (completed === 0) {
      message =
        "You didn't complete any tasks today. Your accountability partner has been notified.";
    } else {
      message = `You completed ${completed} of ${quota} ${quota === 1 ? 'task' : 'tasks'} today. Your accountability partner has been notified.`;
    }

    return (
      <View style={styles.expired}>
        <Text style={styles.expiredLabel}>Day ended</Text>
        <Text style={styles.expiredMessage}>{message}</Text>
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
            Add a task. Commit to a quota. Your partner gets the text if you
            don&apos;t.
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  settingsButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  settingsPressed: {
    opacity: 0.5,
  },
  settingsLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '500',
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
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  progressText: {
    ...typography.caption,
    color: colors.textMuted,
    flex: 1,
  },
  adjustButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  adjustButtonPressed: {
    opacity: 0.5,
  },
  adjustLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '500',
  },
  expired: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
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
  expiredMessage: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
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
