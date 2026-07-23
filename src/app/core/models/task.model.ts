/**
 * Data model for tasks (board & Add Task).
 *
 * This file defines the central types for tasks and subtasks as well as the
 * allowed status, priority and category values. It is the technical foundation
 * the board and Add Task build on.
 */

/**
 * Status of a task – matches the four columns of the kanban board:
 * ToDo, In Progress, Awaiting Feedback, Done.
 */
export type TaskStatus = 'todo' | 'inProgress' | 'awaitFeedback' | 'done';

/** Priority of a task. The default in the Add Task form is `medium`. */
export type TaskPriority = 'urgent' | 'medium' | 'low';

/** Category of a task (required field in Add Task). */
export type TaskCategory = 'Technical Task' | 'User Story';

/**
 * All valid status values as a runtime-usable list
 * (e.g. for validation, iterating over board columns or tests).
 */
export const TASK_STATUSES: readonly TaskStatus[] = [
  'todo',
  'inProgress',
  'awaitFeedback',
  'done',
];

/** All valid priorities as a runtime-usable list. */
export const TASK_PRIORITIES: readonly TaskPriority[] = ['urgent', 'medium', 'low'];

/** All valid categories as a runtime-usable list. */
export const TASK_CATEGORIES: readonly TaskCategory[] = ['Technical Task', 'User Story'];

/** Default priority for new tasks. */
export const DEFAULT_TASK_PRIORITY: TaskPriority = 'medium';

/**
 * A subtask belongs to exactly one task and drives the progress indicator
 * (completed / total subtasks).
 */
export interface Subtask {
  /** Unique id of the subtask. */
  id: string;
  /** Short description of the subtask. Required field. */
  title: string;
  /** Completion status of the subtask. */
  done: boolean;
}

/**
 * A task in the Join board.
 *
 * Holds category, title, description preview, assigned contacts, priority,
 * status and subtasks.
 */
export interface Task {
  /** Unique id of the task. */
  id: string;
  /** Title of the task. Required field. */
  title: string;
  /** Optional description (for the description preview on the board). */
  description?: string;
  /** Due date as an ISO-compatible string (e.g. "2026-07-15"). Required field. */
  dueDate: string;
  /** Priority of the task. */
  priority: TaskPriority;
  /** Category of the task. */
  category: TaskCategory;
  /** Current board column of the task. */
  status: TaskStatus;
  /**
   * IDs of the assigned contacts. References existing contacts via their id
   * (see ContactService). Deliberately IDs only – no user/auth logic.
   */
  assignedContactIds: string[];
  /** Subtasks of the task (empty array if none). */
  subtasks: Subtask[];
  /** Creation timestamp (ISO string), optional. */
  createdAt?: string;
  /** Last modification timestamp (ISO string), optional. */
  updatedAt?: string;
}
