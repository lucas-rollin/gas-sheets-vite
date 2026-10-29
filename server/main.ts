import type { ServerApi, Task } from '../shared/types';
import { dbGet, dbInsert, dbList, dbRemove, dbUpdate } from './db';

const APP_TITLE = 'GAS App';

export function doGet(): GoogleAppsScript.HTML.HtmlOutput {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle(APP_TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

export function listTasks(): Task[] {
  return dbList<Task>('tasks');
}

export function createTask(title: string): Task {
  title = String(title || '').trim();
  if (!title) throw new Error('Title is required');
  if (title.length > 200) throw new Error('Title is too long (max 200 characters)');
  return dbInsert<Task>('tasks', { title, done: false });
}

export function toggleTask(id: string): Task {
  const task = dbGet<Task>('tasks', id);
  if (!task) throw new Error('Task not found');
  return dbUpdate<Task>('tasks', id, { done: !task.done });
}

export function deleteTask(id: string): void {
  dbRemove('tasks', id);
}

// Compile-time contract check: ensures server implements ServerApi
const _contract: ServerApi = { listTasks, createTask, toggleTask, deleteTask };
void _contract;
