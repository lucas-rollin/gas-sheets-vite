export interface Task {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServerApi {
  listTasks(): Task[];
  createTask(title: string): Task;
  toggleTask(id: string): Task;
  deleteTask(id: string): void;
}

export type ClientApi = {
  [K in keyof ServerApi]: (...args: Parameters<ServerApi[K]>) => Promise<ReturnType<ServerApi[K]>>;
};
