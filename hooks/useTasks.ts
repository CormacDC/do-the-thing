import { useCallback, useEffect, useRef, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';
import type { Task } from '@/types/task';

type TaskRow = Tables<'tasks'>;

function createTemporaryTaskId(): string {
  return `temp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function fromRow(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    isPriority: row.is_priority,
    isComplete: row.is_complete,
  };
}

export type UseTasksResult = {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  mutationError: string | null;
  dismissMutationError: () => void;
  addTask: (title: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<boolean>;
  togglePriority: (id: string) => Promise<void>;
  retry: () => void;
};

export function useTasks(userId: string | null): UseTasksResult {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const tasksRef = useRef<Task[]>([]);

  tasksRef.current = tasks;

  useEffect(() => {
    if (!supabase || !userId) {
      setTasks([]);
      setLoading(false);
      setError(null);
      return;
    }

    const client = supabase;
    const ownerId = userId;
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: queryError } = await client
          .from('tasks')
          .select('*')
          .eq('user_id', ownerId)
          .order('created_at', { ascending: true });

        if (cancelled) return;
        if (queryError) throw queryError;

        setTasks((data ?? []).map(fromRow));
      } catch (err) {
        if (cancelled) return;
        if (__DEV__) console.warn('[Do The Thing] load tasks failed:', err);
        setError("We couldn't load your tasks. Pull to retry.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [userId, reloadKey]);

  const addTask = useCallback(
    async (title: string) => {
      const trimmed = title.trim();
      if (!trimmed || !userId || !supabase) return;

      const temporaryId = createTemporaryTaskId();
      const optimistic: Task = {
        id: temporaryId,
        title: trimmed,
        isPriority: false,
        isComplete: false,
      };

      const previous = tasksRef.current;
      setTasks([...previous, optimistic]);

      const { data, error: insertError } = await supabase
        .from('tasks')
        .insert({
          user_id: userId,
          title: trimmed,
        })
        .select('*')
        .single();

      if (insertError) {
        if (__DEV__) console.warn('[Do The Thing] add task failed:', insertError);
        setTasks(previous);
        setMutationError("We couldn't save that task. Try again.");
        return;
      }

      setTasks((current) =>
        current.map((task) => (task.id === temporaryId ? fromRow(data) : task)),
      );
    },
    [userId],
  );

  const toggleComplete = useCallback(
    async (id: string) => {
      if (!supabase || !userId) return false;

      const previous = tasksRef.current;
      const current = previous.find((t) => t.id === id);
      if (!current) return false;

      const nextComplete = !current.isComplete;
      const completedAt = nextComplete ? new Date().toISOString() : null;

      setTasks(
        previous.map((t) => (t.id === id ? { ...t, isComplete: nextComplete } : t)),
      );

      const { error: updateError } = await supabase
        .from('tasks')
        .update({ is_complete: nextComplete, completed_at: completedAt })
        .eq('id', id)
        .eq('user_id', userId);

      if (updateError) {
        if (__DEV__) console.warn('[Do The Thing] toggle complete failed:', updateError);
        setTasks(previous);
        setMutationError("We couldn't update that task. Try again.");
        return false;
      }

      return true;
    },
    [userId],
  );

  const togglePriority = useCallback(
    async (id: string) => {
      if (!supabase || !userId) return;

      const previous = tasksRef.current;
      const current = previous.find((t) => t.id === id);
      if (!current) return;

      const nextPriority = !current.isPriority;

      setTasks(
        previous.map((t) => (t.id === id ? { ...t, isPriority: nextPriority } : t)),
      );

      const { error: updateError } = await supabase
        .from('tasks')
        .update({ is_priority: nextPriority })
        .eq('id', id)
        .eq('user_id', userId);

      if (updateError) {
        if (__DEV__) console.warn('[Do The Thing] toggle priority failed:', updateError);
        setTasks(previous);
        setMutationError("We couldn't update that task. Try again.");
      }
    },
    [userId],
  );

  const dismissMutationError = useCallback(() => setMutationError(null), []);
  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

  return {
    tasks,
    loading,
    error,
    mutationError,
    dismissMutationError,
    addTask,
    toggleComplete,
    togglePriority,
    retry,
  };
}
