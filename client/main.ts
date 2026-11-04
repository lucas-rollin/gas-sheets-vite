/**
 * @app Starter Todo Client Logic. Replace with your own.
 */

import './style.css';
import type { Task } from '../types/app';
import { api } from './rpc';

const form = document.getElementById('add-form') as HTMLFormElement;
const input = document.getElementById('title') as HTMLInputElement;
const list = document.getElementById('list') as HTMLUListElement;
const status = document.getElementById('status') as HTMLElement;
let tasks: Task[] = [];

function setStatus(message: string, isError = false) {
	status.textContent = message;
	status.classList.toggle('error', isError);
}

async function run<T>(label: string, action: () => Promise<T>): Promise<T | undefined> {
	setStatus(label);
	try {
		const result = await action();
		setStatus('');
		return result;
	} catch (err) {
		setStatus(err instanceof Error ? err.message : String(err), true);
	}
}

function render() {
	list.replaceChildren(
		...tasks.map((task) => {
			const li = document.createElement('li');
			li.classList.toggle('done', task.done);

			const checkbox = document.createElement('input');
			checkbox.type = 'checkbox';
			checkbox.checked = task.done;
			checkbox.addEventListener('change', async () => {
				const updated = await run('Saving…', () => api.toggleTask(task.id));
				if (updated) tasks = tasks.map((t) => (t.id === updated.id ? updated : t));
				render();
			});

			const title = document.createElement('span');
			title.textContent = task.title;

			const remove = document.createElement('button');
			remove.className = 'ghost';
			remove.textContent = 'Delete';
			remove.addEventListener('click', async () => {
				const ok = await run('Deleting…', () => api.deleteTask(task.id).then(() => true));
				if (ok) tasks = tasks.filter((t) => t.id !== task.id);
				render();
			});

			li.append(checkbox, title, remove);
			return li;
		})
	);
}

form.addEventListener('submit', async (event) => {
	event.preventDefault();

	const button = form.querySelector('button');
	if (!button) return;

	button.disabled = true;
	const created = await run('Adding…', () => api.createTask(input.value));
	button.disabled = false;
	if (created) {
		tasks = [...tasks, created];
		input.value = '';
		render();
	}
});

run('Loading…', () => api.listTasks()).then((loaded) => {
	if (loaded) tasks = loaded;
	render();
});
