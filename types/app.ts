/**
 * @app Starter Todo types. Replace with your own.
 */

import type { DbRecord } from './core';

export type { DbRecord };

export interface Task extends DbRecord {
	title: string;
	done: boolean;
}

// Augment the core ServerApi with developer methods
declare module './core' {
	interface ServerApi {
		listTasks(): Task[];
		createTask(title: string): Task;
		toggleTask(id: string): Task;
		deleteTask(id: string): void;
	}
}
