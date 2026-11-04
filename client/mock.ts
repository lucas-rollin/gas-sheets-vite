/**
 * @app Starter Todo In-memory state mimicking. Replace with your own.
 */

import type { Task } from '../types/app';
import { ServerApi } from '../types/core';

let tasks: Task[] = [
  { id: '1', title: 'Try the template', done: false, createdAt: '', updatedAt: '' },
  { id: '2', title: 'Replace this sample with your own feature', done: true, createdAt: '', updatedAt: '' },
];

export const mockHandlers: ServerApi = {
  listTasks: () => tasks,
  createTask: (title: string) => {
    title = String(title || '').trim();
    if (!title) throw new Error('Title is required');
    const now = new Date().toISOString();
    const task: Task = { id: crypto.randomUUID(), title, done: false, createdAt: now, updatedAt: now };
    tasks = [...tasks, task];
    return task;
  },
  toggleTask: (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) throw new Error('Task not found');
    const updated = { ...task, done: !task.done, updatedAt: new Date().toISOString() };
    tasks = tasks.map((t) => (t.id === id ? updated : t));
    return updated;
  },
  deleteTask: (id: string) => {
    tasks = tasks.filter((t) => t.id !== id);
  },
};
