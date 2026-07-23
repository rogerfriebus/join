import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Task,
  Subtask,
  TaskStatus,
  TaskPriority,
  TaskCategory,
  DEFAULT_TASK_PRIORITY,
} from '../models/task.model';
import { DUMMY_TASKS } from '../data/task-dummy-data';
import { environment } from '../../../environments/environment';

/** Names of the Supabase tables for tasks. */
const TASKS_TABLE = 'tasks';
const SUBTASKS_TABLE = 'subtasks';

/** Shape of a task row in Supabase (snake_case). See supabase/sql/tasks-setup.sql. */
interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  priority: TaskPriority;
  category: TaskCategory;
  status: TaskStatus;
  assigned_contact_ids: string[] | null;
  created_at: string | null;
  updated_at: string | null;
}

/** Shape of a subtask row in Supabase (snake_case). */
interface SubtaskRow {
  id: string;
  task_id: string;
  title: string;
  done: boolean;
  position: number | null;
  created_at: string | null;
  updated_at: string | null;
}

/** Payload for tasks insert/update (snake_case). */
type TaskRowPayload = Pick<
  TaskRow,
  'id' | 'title' | 'description' | 'due_date' | 'priority' | 'category' | 'status' | 'assigned_contact_ids'
>;

/** Payload for subtasks insert (snake_case). */
type SubtaskRowPayload = Pick<SubtaskRow, 'id' | 'task_id' | 'title' | 'done' | 'position'>;

/** Maps a subtask row to the frontend model. */
function mapRowToSubtask(row: SubtaskRow): Subtask {
  return { id: row.id, title: row.title, done: row.done };
}

/** Maps a task row (+ its subtasks) to the frontend model. */
function mapRowToTask(row: TaskRow, subtasks: Subtask[]): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    dueDate: row.due_date,
    priority: row.priority,
    category: row.category,
    status: row.status,
    assignedContactIds: row.assigned_contact_ids ?? [],
    subtasks,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

/** Maps the frontend model to a tasks payload (snake_case). */
function mapTaskToRowPayload(task: Task): TaskRowPayload {
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? null,
    due_date: task.dueDate,
    priority: task.priority,
    category: task.category,
    status: task.status,
    assigned_contact_ids: task.assignedContactIds ?? [],
  };
}

/** Maps a subtask to a subtasks payload (snake_case) including task_id/position. */
function mapSubtaskToRowPayload(subtask: Subtask, taskId: string, position: number): SubtaskRowPayload {
  return {
    id: subtask.id,
    task_id: taskId,
    title: subtask.title,
    done: subtask.done,
    position,
  };
}

/**
 * Central service for tasks (Sprint 2: Board & Add Task).
 *
 * The service is the central facade for the task data logic. It holds the set
 * as an Angular signal and additionally offers a Supabase integration for tasks
 * and subtasks. UI components use exclusively the domain methods
 * (loadTasks/addTask/updateTask/deleteTask/updateTaskStatus/
 * updateSubtaskStatus) and know no Supabase-specific methods.
 *
 * Demo setup (Developer Akademie):
 *  - Supabase is connected via project URL + publishable key from the
 *    environment files. NO secret/service-role keys are used, deliberately.
 *  - The demo RLS allows anon access to tasks/subtasks (not production-ready).
 *  - The demo tasks are kept as a fallback in case Supabase is unreachable.
 */
@Injectable({ providedIn: 'root' })
export class TaskService {
  /**
   * Supabase client, created lazily. `createClient` opens no connection and
   * makes no network call before a query is started.
   */
  private supabaseClient: SupabaseClient | null = null;

  /**
   * Internal task set. Initialized with an independent copy of the demo tasks
   * (fallback) so that the shared DUMMY_TASKS are not mutated and each service
   * instance (e.g. per test) starts fresh.
   */
  private readonly tasksSignal = signal<Task[]>(
    DUMMY_TASKS.map((task) => ({
      ...task,
      assignedContactIds: [...task.assignedContactIds],
      subtasks: task.subtasks.map((subtask) => ({ ...subtask })),
    })),
  );

  /**
   * Public, read-only access to the current task set.
   * UI components read tasks exclusively through it (reactively).
   */
  readonly tasks = this.tasksSignal.asReadonly();

  /** Returns the current task set (snapshot). */
  getTasks(): Task[] {
    return this.tasksSignal();
  }

  /** Returns a single task by id, or undefined if not found. */
  getTaskById(id: string): Task | undefined {
    return this.tasksSignal().find((task) => task.id === id);
  }

  // ---------------------------------------------------------------------------
  // Domain facade (used by the UI)
  // ---------------------------------------------------------------------------

  /**
   * Loads tasks (including subtasks) from Supabase and updates the signal.
   * On an error the existing (demo) set is kept as a fallback and the error is
   * logged – so the method deliberately does not throw.
   */
  async loadTasks(): Promise<void> {
    try {
      await this.loadTasksFromSupabase();
    } catch (error) {
      console.error(
        'Could not load tasks from Supabase – demo fallback stays active.',
        error,
      );
    }
  }

  /**
   * Creates a task: saves it (including subtasks) in Supabase and then updates
   * the visible set. Returns the saved task.
   */
  async addTask(task: Task): Promise<Task> {
    const saved = await this.addTaskToSupabase(task);
    this.tasksSignal.update((tasks) => [...tasks, saved]);
    return saved;
  }

  /**
   * Updates a task in Supabase and then the visible set.
   * Returns undefined without an id or for an unknown task.
   */
  async updateTask(task: Task): Promise<Task | undefined> {
    if (!task.id) {
      return undefined;
    }
    const updated = await this.updateTaskInSupabase(task);
    if (updated) {
      this.tasksSignal.update((tasks) =>
        tasks.map((t) => (t.id === updated.id ? updated : t)),
      );
    }
    return updated;
  }

  /**
   * Deletes a task in Supabase (subtasks via FK cascade) and then updates the
   * visible set. Returns true on success.
   */
  async deleteTask(id: string): Promise<boolean> {
    const deleted = await this.deleteTaskFromSupabase(id);
    if (deleted) {
      this.tasksSignal.update((tasks) => tasks.filter((task) => task.id !== id));
    }
    return deleted;
  }

  /**
   * Changes only the status of a task in Supabase and in the visible set.
   * Returns undefined for an unknown id.
   */
  async updateTaskStatus(id: string, status: TaskStatus): Promise<Task | undefined> {
    const updated = await this.updateTaskStatusInSupabase(id, status);
    if (updated) {
      this.tasksSignal.update((tasks) =>
        tasks.map((task) => (task.id === id ? updated : task)),
      );
    }
    return updated;
  }

  /**
   * Changes only the done value of a subtask in Supabase and in the visible
   * set. Returns undefined for an unknown task or subtask.
   */
  async updateSubtaskStatus(
    taskId: string,
    subtaskId: string,
    done: boolean,
  ): Promise<Task | undefined> {
    const updated = await this.updateSubtaskStatusInSupabase(taskId, subtaskId, done);
    if (updated) {
      this.tasksSignal.update((tasks) =>
        tasks.map((task) => (task.id === taskId ? updated : task)),
      );
    }
    return updated;
  }

  // ---------------------------------------------------------------------------
  // Supabase access (internal – do not call directly from UI components)
  // ---------------------------------------------------------------------------

  /** Lazily created Supabase client (project URL + publishable key, no secret). */
  private getClient(): SupabaseClient {
    if (!this.supabaseClient) {
      this.supabaseClient = createClient(
        environment.supabase.url,
        environment.supabase.publishableKey,
      );
    }
    return this.supabaseClient;
  }

  /**
   * Loads tasks and subtasks from Supabase, assigns the subtasks to their tasks
   * (sorted by position) and updates the internal signal set.
   */
  async loadTasksFromSupabase(): Promise<Task[]> {
    const taskResult = await this.getClient()
      .from(TASKS_TABLE)
      .select('*')
      .order('id', { ascending: true });

    if (taskResult.error) {
      throw new Error(`Could not load tasks: ${taskResult.error.message}`);
    }

    const subtaskResult = await this.getClient()
      .from(SUBTASKS_TABLE)
      .select('*')
      .order('position', { ascending: true });

    if (subtaskResult.error) {
      throw new Error(`Could not load subtasks: ${subtaskResult.error.message}`);
    }

    const subtasksByTask = this.groupSubtasksByTask((subtaskResult.data ?? []) as SubtaskRow[]);
    const tasks = ((taskResult.data ?? []) as TaskRow[]).map((row) =>
      mapRowToTask(row, subtasksByTask.get(row.id) ?? []),
    );

    this.tasksSignal.set(tasks);
    return tasks;
  }

  /**
   * Saves a new task (including subtasks) in Supabase and returns the saved
   * task. If an id is missing, one is generated.
   */
  async addTaskToSupabase(task: Task): Promise<Task> {
    const id = task.id || this.generateId();
    const normalized = this.applyTaskDefaults(task, id);
    const subtasks = this.ensureSubtaskIds(normalized.subtasks, id);

    const { data, error } = await this.getClient()
      .from(TASKS_TABLE)
      .upsert(mapTaskToRowPayload(normalized))
      .select()
      .single();

    if (error) {
      throw new Error(`Could not save task: ${error.message}`);
    }

    await this.replaceSubtasks(id, subtasks);
    return mapRowToTask(data as TaskRow, subtasks);
  }

  /**
   * Updates a task in Supabase and synchronizes its subtasks (pragmatically:
   * delete old subtasks, insert new ones). Returns undefined when no id is set
   * or no matching record exists.
   */
  async updateTaskInSupabase(task: Task): Promise<Task | undefined> {
    if (!task.id) {
      return undefined;
    }
    const subtasks = this.ensureSubtaskIds(task.subtasks ?? [], task.id);

    const { data, error } = await this.getClient()
      .from(TASKS_TABLE)
      .update(mapTaskToRowPayload(task))
      .eq('id', task.id)
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(`Could not update task: ${error.message}`);
    }
    if (!data) {
      return undefined;
    }

    await this.replaceSubtasks(task.id, subtasks);
    return mapRowToTask(data as TaskRow, subtasks);
  }

  /**
   * Deletes a task in Supabase. Associated subtasks are removed via FK cascade.
   * Returns true when a record was deleted.
   */
  async deleteTaskFromSupabase(id: string): Promise<boolean> {
    const { data, error } = await this.getClient()
      .from(TASKS_TABLE)
      .delete()
      .eq('id', id)
      .select('id');

    if (error) {
      throw new Error(`Could not delete task: ${error.message}`);
    }
    return (data?.length ?? 0) > 0;
  }

  /**
   * Updates exclusively the status of a task in Supabase. Returns the updated
   * task (with current subtasks) or undefined.
   */
  async updateTaskStatusInSupabase(id: string, status: TaskStatus): Promise<Task | undefined> {
    const { data, error } = await this.getClient()
      .from(TASKS_TABLE)
      .update({ status })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(`Could not update task status: ${error.message}`);
    }
    if (!data) {
      return undefined;
    }

    const subtasks = this.getTaskById(id)?.subtasks ?? [];
    return mapRowToTask(data as TaskRow, subtasks);
  }

  /**
   * Updates exclusively the done value of a subtask in Supabase.
   * Returns the updated parent task or undefined (unknown task/subtask).
   */
  async updateSubtaskStatusInSupabase(
    taskId: string,
    subtaskId: string,
    done: boolean,
  ): Promise<Task | undefined> {
    const existing = this.getTaskById(taskId);
    if (!existing || !existing.subtasks.some((subtask) => subtask.id === subtaskId)) {
      return undefined;
    }

    const { data, error } = await this.getClient()
      .from(SUBTASKS_TABLE)
      .update({ done })
      .eq('id', subtaskId)
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(`Could not update subtask status: ${error.message}`);
    }
    if (!data) {
      return undefined;
    }

    return {
      ...existing,
      subtasks: existing.subtasks.map((subtask) =>
        subtask.id === subtaskId ? { ...subtask, done } : subtask,
      ),
    };
  }

  // ---------------------------------------------------------------------------
  // Helper functions
  // ---------------------------------------------------------------------------

  /** Replaces all subtasks of a task (delete + re-insert). */
  private async replaceSubtasks(taskId: string, subtasks: Subtask[]): Promise<void> {
    const { error: deleteError } = await this.getClient()
      .from(SUBTASKS_TABLE)
      .delete()
      .eq('task_id', taskId);

    if (deleteError) {
      throw new Error(`Could not replace subtasks: ${deleteError.message}`);
    }

    if (subtasks.length === 0) {
      return;
    }

    const payload = subtasks.map((subtask, index) =>
      mapSubtaskToRowPayload(subtask, taskId, index),
    );
    const { error: insertError } = await this.getClient()
      .from(SUBTASKS_TABLE)
      .insert(payload);

    if (insertError) {
      throw new Error(`Could not save subtasks: ${insertError.message}`);
    }
  }

  /** Groups subtask rows by task_id (order is preserved). */
  private groupSubtasksByTask(rows: SubtaskRow[]): Map<string, Subtask[]> {
    const map = new Map<string, Subtask[]>();
    for (const row of rows) {
      const list = map.get(row.task_id) ?? [];
      list.push(mapRowToSubtask(row));
      map.set(row.task_id, list);
    }
    return map;
  }

  /** Adds sensible default values for a (new) task. */
  private applyTaskDefaults(task: Task, id: string): Task {
    return {
      ...task,
      id,
      priority: task.priority ?? DEFAULT_TASK_PRIORITY,
      status: task.status ?? 'todo',
      assignedContactIds: task.assignedContactIds ?? [],
      subtasks: task.subtasks ?? [],
    };
  }

  /**
   * Ensures that every subtask has a unique, task-scoped id.
   *
   * The id (`${taskId}-s${index + 1}`) is reassigned when it
   *  - is empty,
   *  - starts with `tmp-` (temporary UI placeholder id) or
   *  - does not start with `${taskId}-` (foreign id of another task).
   * This prevents global/foreign ids from ending up in the subtasks table and
   * violating the primary key `subtasks.id` (duplicate key/409).
   */
  private ensureSubtaskIds(subtasks: Subtask[], taskId: string): Subtask[] {
    return subtasks.map((subtask, index) => {
      const id = subtask.id;
      const needsNewId =
        !id || id.startsWith('tmp-') || !id.startsWith(`${taskId}-`);
      return {
        ...subtask,
        id: needsNewId ? `${taskId}-s${index + 1}` : id,
      };
    });
  }

  /**
   * Generates a unique id in the scheme `t<n>`. Detects the numeric part of
   * existing IDs (t1, t2, …), uses the highest number + 1 and ensures that the
   * generated id is not already taken.
   */
  private generateId(): string {
    const numbers = this.tasksSignal()
      .map((task) => /^t(\d+)$/.exec(task.id))
      .filter((match): match is RegExpExecArray => match !== null)
      .map((match) => Number(match[1]));
    let next = (numbers.length ? Math.max(...numbers) : 0) + 1;
    const existing = new Set(this.tasksSignal().map((task) => task.id));
    while (existing.has(`t${next}`)) {
      next++;
    }
    return `t${next}`;
  }
}
