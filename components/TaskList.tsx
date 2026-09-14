import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CircleCheck,
  ListTodo,
  Pencil,
  Plus,
  Settings,
  TriangleAlert,
} from 'lucide-react-native';

import { Countdown } from '@/components/Countdown';
import { DevResetButton } from '@/components/DevResetButton';
import { QuotaPicker } from '@/components/QuotaPicker';
import { TaskRow } from '@/components/TaskRow';
import { AppIcon } from '@/components/ui/AppIcon';
import { Banner } from '@/components/ui/Banner';
import {
  IconButton,
  PrimaryButton,
  SecondaryButton,
  TextButton,
} from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Surface } from '@/components/ui/Surface';
import { TextField } from '@/components/ui/TextField';
import { useAppState } from '@/hooks/useAppState';
import { useAuth } from '@/hooks/useAuth';
import { useAccountabilityTargets } from '@/hooks/useAccountabilityTargets';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import { useTheme } from '@/hooks/useTheme';
import { ENABLE_DEV_RESET } from '@/lib/config';
import type { Theme } from '@/lib/theme';
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
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
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
    updateTitle,
    deleteTask,
    toggleComplete,
    togglePriority,
    confirmQuota,
    adjustQuota,
    canAdjustQuota,
    expireDeadline,
    retry,
  } = useAppState();
  const { targetCount } = useAccountabilityTargets(auth.userId);

  const [draft, setDraft] = useState('');
  const [pendingTitle, setPendingTitle] = useState<string | null>(null);
  const [settingQuota, setSettingQuota] = useState(false);
  const [showAdjustPicker, setShowAdjustPicker] = useState(false);
  const [adjustingQuota, setAdjustingQuota] = useState(false);

  const [gateError, setGateError] = useState<string | null>(null);

  const [expiredSnapshot, setExpiredSnapshot] = useState<ExpiredSnapshot | null>(null);
  const prevStateRef = useRef<AppState>(state);
  const listRef = useRef<FlatList<Task>>(null);

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
  const tasksLocked = state === AppState.EMPTY || state === AppState.EXPIRED;
  const canSubmit = draft.trim().length > 0 && !!auth.userId && !isExpired;
  const pickerVisible =
    pendingTitle !== null || (isExpired && targetCount >= 1);

  useEffect(() => {
    if (isExpired && targetCount < 1) {
      setGateError(
        'Add at least one friend as a notify target in Settings before setting a quota.',
      );
    } else if (targetCount >= 1) {
      setGateError((current) =>
        current?.includes('notify target') ? null : current,
      );
    }
  }, [isExpired, targetCount]);

  const handleSubmit = () => {
    if (!canSubmit) return;
    Keyboard.dismiss();
    const value = draft.trim();
    setDraft('');
    setGateError(null);

    if (state === AppState.ACTIVE || state === AppState.COMPLETE) {
      void addTask(value);
      return;
    }

    if (targetCount < 1) {
      setGateError(
        'Add at least one friend as a notify target in Settings before setting a quota.',
      );
      return;
    }

    setPendingTitle(value);
  };

  const handleConfirmQuota = async (quota: number) => {
    if (targetCount < 1) {
      setGateError(
        'Add at least one friend as a notify target in Settings before setting a quota.',
      );
      return;
    }

    setSettingQuota(true);

    if (pendingTitle !== null) {
      await Promise.all([addTask(pendingTitle), confirmQuota(quota)]);
      setPendingTitle(null);
    } else {
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

  const handleEditStart = useCallback(
    (id: string) => {
      const index = tasks.findIndex((task) => task.id === id);
      if (index < 0) return;
      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({
          index,
          viewPosition: 0.25,
          animated: true,
        });
      });
    },
    [tasks],
  );

  // iOS: sit on the keyboard frame (or the home indicator when hidden).
  // Android: the window already resizes, so only keep the home-indicator inset.
  const bottomInset =
    Platform.OS === 'ios'
      ? Math.max(insets.bottom, keyboardHeight)
      : insets.bottom;

  return (
    <View style={[styles.container, { paddingBottom: bottomInset }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Do The Thing</Text>
          <IconButton
            icon={Settings}
            accessibilityLabel="Open settings"
            onPress={() => router.push('/settings')}
          />
        </View>
        <Text style={styles.subtitle}>
          Complete your daily quota before midnight.
        </Text>
        {ENABLE_DEV_RESET ? <DevResetButton /> : null}
      </View>

      {gateError ? (
        <Banner
          tone="warning"
          body={gateError}
          actionLabel="Open Settings"
          onPress={() => {
            setGateError(null);
            router.push('/settings');
          }}
        />
      ) : mutationError ? (
        <Banner
          tone="error"
          body={mutationError}
          actionLabel="Dismiss"
          onPress={dismissMutationError}
        />
      ) : null}

      <TimerArea
        state={state}
        deadline={deadline}
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
        listRef={listRef}
        onToggleComplete={toggleComplete}
        onTogglePriority={togglePriority}
        onUpdateTitle={updateTitle}
        onDelete={deleteTask}
        onEditStart={handleEditStart}
        onRetry={retry}
      />

      <View style={styles.inputRow}>
        <TextField
          containerStyle={styles.composerField}
          placeholder="What needs doing?"
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
          blurOnSubmit
          autoCorrect={false}
          editable={!!auth.userId && !isExpired}
        />
        <PrimaryButton
          label="Add"
          icon={Plus}
          fullWidth={false}
          disabled={!canSubmit}
          onPress={handleSubmit}
        />
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
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (state === AppState.ACTIVE) {
    const completed = deadline?.tasksCompletedToday ?? 0;
    const quota = deadline?.dailyQuota ?? 0;

    return (
      <Surface>
        {deadline ? (
          <Countdown
            key={deadline.deadlineAt}
            deadlineAt={deadline.deadlineAt}
            onExpire={onExpire}
          />
        ) : null}
        {quota > 0 ? (
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>
              {completed} of {quota} {quota === 1 ? 'task' : 'tasks'} completed today
            </Text>
            {canAdjustQuota ? (
              <TextButton
                label={adjustingQuota ? 'Saving…' : 'Adjust'}
                icon={Pencil}
                disabled={adjustingQuota}
                onPress={onAdjustQuota}
              />
            ) : null}
          </View>
        ) : null}
      </Surface>
    );
  }

  if (state === AppState.EXPIRED) {
    const completed = expiredSnapshot?.completed ?? deadline?.tasksCompletedToday ?? 0;
    const quota = expiredSnapshot?.quota ?? deadline?.dailyQuota ?? 0;
    const hasPriorityTasks = expiredSnapshot?.hasPriorityTasks ?? false;

    let message: string;
    if (completed === 0 && hasPriorityTasks) {
      message =
        "You didn't complete any of your Priority tasks today. Your friends have been notified.";
    } else if (completed === 0) {
      message =
        "You didn't complete any tasks today. Your friends have been notified.";
    } else {
      message = `You completed ${completed} of ${quota} ${quota === 1 ? 'task' : 'tasks'} today. Your friends have been notified.`;
    }

    return (
      <Surface
        style={{
          backgroundColor: theme.colors.warningMuted,
          borderColor: theme.colors.warning,
        }}
      >
        <View style={styles.statusHeader}>
          <AppIcon icon={TriangleAlert} color={theme.colors.warning} size="md" />
          <Text style={styles.expiredLabel}>Day ended</Text>
        </View>
        <Text style={styles.expiredMessage}>{message}</Text>
      </Surface>
    );
  }

  if (state === AppState.COMPLETE) {
    return (
      <Surface
        style={{
          backgroundColor: theme.colors.accentMuted,
          borderColor: theme.colors.accentMuted,
        }}
      >
        <View style={styles.statusHeader}>
          <AppIcon icon={CircleCheck} color={theme.colors.accent} size="md" />
          <Text style={styles.completeLabel}>Quota met</Text>
        </View>
        <Text style={styles.completeMessage}>
          Extra completions are allowed — they just don&apos;t count toward the quota.
        </Text>
      </Surface>
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
  listRef: RefObject<FlatList<Task> | null>;
  onToggleComplete: (id: string) => void;
  onTogglePriority: (id: string) => void;
  onUpdateTitle: (id: string, title: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onEditStart: (id: string) => void;
  onRetry: () => void;
};

function Body({
  auth,
  tasks,
  loading,
  error,
  tasksLocked,
  listRef,
  onToggleComplete,
  onTogglePriority,
  onUpdateTitle,
  onDelete,
  onEditStart,
  onRetry,
}: BodyProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (auth.error) {
    return (
      <EmptyState
        title="Can't sign in"
        body={auth.error}
        action={<SecondaryButton label="Try again" onPress={auth.retry} />}
      />
    );
  }

  if (auth.loading || (loading && tasks.length === 0)) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.colors.textSecondary} />
      </View>
    );
  }

  if (error && tasks.length === 0) {
    return (
      <EmptyState
        title="Couldn't load tasks"
        body={error}
        action={<SecondaryButton label="Try again" onPress={onRetry} />}
      />
    );
  }

  return (
    <FlatList
      ref={listRef}
      data={tasks}
      keyExtractor={(item) => item.id}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      onScrollToIndexFailed={({ index }) => {
        setTimeout(() => {
          listRef.current?.scrollToIndex({
            index,
            viewPosition: 0.25,
            animated: true,
          });
        }, 100);
      }}
      renderItem={({ item }) => (
        <TaskRow
          task={item}
          togglesLocked={tasksLocked || item.isComplete}
          onToggleComplete={onToggleComplete}
          onTogglePriority={onTogglePriority}
          onUpdateTitle={onUpdateTitle}
          onDelete={onDelete}
          onEditStart={onEditStart}
        />
      )}
      style={styles.list}
      contentContainerStyle={
        tasks.length === 0 ? styles.listContentEmpty : styles.listContent
      }
      ListEmptyComponent={
        <EmptyState
          icon={ListTodo}
          title="Nothing yet."
          body="Add a task. Commit to a quota. Your friends get a push if you don't."
        />
      }
    />
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      gap: theme.spacing.sm,
    },
    header: {
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    title: {
      ...theme.typography.title,
      color: theme.colors.textPrimary,
      flex: 1,
    },
    subtitle: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
    },
    progressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    progressText: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      flex: 1,
    },
    statusHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    expiredLabel: {
      ...theme.typography.label,
      color: theme.colors.warning,
    },
    expiredMessage: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    completeLabel: {
      ...theme.typography.label,
      color: theme.colors.textPrimary,
    },
    completeMessage: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
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
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
    },
    composerField: {
      flex: 1,
    },
  });
}
