/**
 * @app Starter Todo backend. Replace with your own.
 * Schema and public RPC endpoints.
 */

import type { Task } from '../types/app';
import type { ServerApi } from '../types/core';
import { createDb } from './db';

const db = createDb({
	tasks: ['id', 'title', 'done', 'createdAt', 'updatedAt'],
});

export function listTasks(): Task[] {
	return db.list<Task>('tasks');
}

export function createTask(title: string): Task {
	title = String(title || '').trim();
	if (!title) throw new Error('Title is required');
	if (title.length > 200) throw new Error('Title is too long (max 200 characters)');
	return db.insert<Task>('tasks', { title, done: false });
}

export function toggleTask(id: string): Task {
	const task = db.get<Task>('tasks', id);
	if (!task) throw new Error('Task not found');
	return db.update<Task>('tasks', id, { done: !task.done });
}

export function deleteTask(id: string): void {
	db.remove('tasks', id);
}

// Compile-time contract check: ensures server implements ServerApi
const _contract: ServerApi = { listTasks, createTask, toggleTask, deleteTask };
void _contract;
