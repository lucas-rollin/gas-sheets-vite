import type { ClientApi, Task } from '../shared/types';

/**
 * The only file that talks to the server.
 * - In Apps Script: wraps google.script.run in a Promise.
 * - In `npm run dev`: routes to ./mock instead (removed from production builds).
 */
type GoogleRun = {
  withSuccessHandler(fn: (r: unknown) => void): GoogleRun;
  withFailureHandler(fn: (e: Error) => void): GoogleRun;
  [fn: string]: unknown;
};

async function call<T>(name: string, ...args: unknown[]): Promise<T> {
  if (import.meta.env.DEV) {
    const { mock } = await import('./mock');
    return (await mock(name, args)) as T;
  }
  return new Promise<T>((resolve, reject) => {
    const run = (window as unknown as { google: { script: { run: GoogleRun } } }).google.script.run;
    const fn = run
      .withSuccessHandler((r) => resolve(r as T))
      .withFailureHandler((e) => reject(new Error(e.message ?? String(e))))[name] as (...a: unknown[]) => void;
    fn(...args);
  });
}

export const api: ClientApi = {
  listTasks: () => call<Task[]>('listTasks'),
  createTask: (title: string) => call<Task>('createTask', title),
  toggleTask: (id: string) => call<Task>('toggleTask', id),
  deleteTask: (id: string) => call<void>('deleteTask', id),
};
