import { useCallback, useState } from 'react';

import type { Task } from '@/types/task';

function createTaskId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export type UseTasksResult = {
  tasks: Task[];
  addTask: (title: string) => void;
  toggleComplete: (id: string) => void;
  togglePriority: (id: string) => void;
};

export function useTasks(initial: Task[] = []): UseTasksResult {
  const [tasks, setTasks] = useState<Task[]>(initial);

  const addTask = useCallback((title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setTasks((prev) => [
      ...prev,
      {
        id: createTaskId(),
        title: trimmed,
        isPriority: false,
        isComplete: false,
      },
    ]);
  }, []);

  const toggleComplete = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isComplete: !t.isComplete } : t)),
    );
  }, []);

  const togglePriority = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isPriority: !t.isPriority } : t)),
    );
  }, []);

  return { tasks, addTask, toggleComplete, togglePriority };
}
