/**
 * @core Generic Record & Client type mapper. Avoid editing.
 */

export interface DbRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Base interface that types/app.ts will augment
export interface ServerApi {}

export type ClientApi<T> = {
  [K in keyof T]: T[K] extends (...args: infer P) => infer R
    ? (...args: P) => Promise<R>
    : never;
};
