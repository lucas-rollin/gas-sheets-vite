import type { ServerApi, Task } from '../shared/types';

/**
 * Fake of server/main.ts, used only by `npm run dev`. Deliberately dumb:
 * an in-memory array. It does NOT import server code, so keep it in sync by hand
 * and always verify against the real backend with `npm run push`.
 * Data resets on page reload.
 */
let tasks: Task[] = [
  { id: '1', title: 'Try the template', done: false, createdAt: '', updatedAt: '' },
  { id: '2', title: 'Replace this sample with your own feature', done: true, createdAt: '', updatedAt: '' },
];

const handlers: ServerApi = {
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

export async function mock(name: string, args: unknown[]): Promise<unknown> {
  await new Promise((r) => setTimeout(r, 300)); // roughly mimics google.script.run latency
  const handler = handlers[name as keyof ServerApi] as ((...a: unknown[]) => unknown) | undefined;
  if (!handler) throw new Error(`mock: no handler for "${name}"`);
  const result = handler(...args);
  return result === undefined ? result : JSON.parse(JSON.stringify(result)); // like the real serialization
}
