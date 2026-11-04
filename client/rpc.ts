/**
 * @core Type-safe RPC bridge. Avoid Editing.
 * 
 * - In `npm run dev`: Routes calls to client/mock.ts with simulated latency.
 * - In production: Bridges calls to google.script.run.
 */

import type { ClientApi, ServerApi } from '../types/core'; // <-- Imported from core now!

type GoogleRun = {
  withSuccessHandler(fn: (r: unknown) => void): GoogleRun;
  withFailureHandler(fn: (e: Error) => void): GoogleRun;
  [fn: string]: unknown;
};

async function call<T>(name: string, ...args: unknown[]): Promise<T> {
  if (import.meta.env.DEV) {
    const { mockHandlers } = await import('./mock');
    await new Promise((r) => setTimeout(r, 300));
    const handler = (mockHandlers as unknown as Record<string, (...a: unknown[]) => unknown>)[name];
    if (!handler) throw new Error(`mock: no handler for "${name}"`);
    const result = handler(...args);
    return (result === undefined ? result : JSON.parse(JSON.stringify(result))) as T;
  }

  return new Promise<T>((resolve, reject) => {
    const google = (window as unknown as { google?: { script?: { run?: GoogleRun } } }).google;
    const run = google?.script?.run;
    if (!run) {
      return reject(new Error('google.script.run is not available in this environment.'));
    }
    const runner = run
      .withSuccessHandler((r) => resolve(r as T))
      .withFailureHandler((e) => reject(new Error(e.message ?? String(e))));
    const fn = runner[name];
    if (typeof fn !== 'function') {
      return reject(new Error(`Server function "${name}" is not exported in server/main.ts.`));
    }
    (fn as (...a: unknown[]) => void).apply(runner, args);
  });
}

export const api: ClientApi<ServerApi> = new Proxy({} as ClientApi<ServerApi>, {
  get: (_, prop: string) => (...args: unknown[]) => call(prop, ...args),
});
