import { Contact } from '../../core/models/contact.model';
import { Subtask, Task, TaskStatus } from '../../core/models/task.model';
import {
  BoardColumn,
  EditTaskDraft,
  MobileMoveOption,
} from './board.models';

/** Formats a date for a native date input. */
export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Creates the initial empty state of the edit form. */
export function createEmptyEditDraft(): EditTaskDraft {
  return {
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    category: '',
    assignedContactIds: [],
    subtasks: [],
    newSubtaskTitle: '',
  };
}

/** Creates an isolated edit draft from an existing task. */
export function createEditDraft(task: Task): EditTaskDraft {
  return {
    title: task.title,
    description: task.description ?? '',
    dueDate: task.dueDate,
    priority: task.priority,
    category: task.category,
    assignedContactIds: [...task.assignedContactIds],
    subtasks: task.subtasks.map((subtask) => ({ ...subtask })),
    newSubtaskTitle: '',
  };
}

/** Creates the updated task payload from a valid draft. */
export function buildUpdatedTask(task: Task, draft: EditTaskDraft): Task {
  return {
    ...task,
    title: draft.title.trim(),
    description: draft.description.trim() || undefined,
    dueDate: draft.dueDate,
    priority: draft.priority,
    category: draft.category || task.category,
    assignedContactIds: [...draft.assignedContactIds],
    subtasks: normalizeSubtasks(task.id, draft.subtasks),
    updatedAt: new Date().toISOString(),
  };
}

/** Removes empty subtasks and normalizes their identifiers and titles. */
export function normalizeSubtasks(taskId: string, subtasks: Subtask[]): Subtask[] {
  return subtasks
    .filter((subtask) => subtask.title.trim())
    .map((subtask, index) => ({
      ...subtask,
      id: subtask.id || `${taskId}-s${index + 1}`,
      title: subtask.title.trim(),
    }));
}

/** Checks whether a task contains the normalized search query. */
export function taskMatchesQuery(task: Task, query: string): boolean {
  const values = [task.title, task.description ?? '', task.category, task.priority, task.dueDate];
  return values.join(' ').toLowerCase().includes(query);
}

/** Creates a compact description for a task card. */
export function createDescriptionPreview(description = '', max = 80): string {
  if (description.length <= max) return description;
  return `${description.slice(0, max).trimEnd()}…`;
}

/** Builds up to two initials from a full name. */
export function initialsFromName(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/** Returns a readable priority label. */
export function priorityLabel(priority: Task['priority']): string {
  const labels: Record<Task['priority'], string> = {
    urgent: 'Urgent',
    medium: 'Medium',
    low: 'Low',
  };
  return labels[priority];
}

/** Creates the available neighbouring move targets for mobile. */
export function mobileMoveOptions(task: Task, columns: readonly BoardColumn[]): MobileMoveOption[] {
  const index = columns.findIndex((column) => column.status === task.status);
  if (index < 0) return [];
  return [
    createMoveOption(columns[index - 1], 'up'),
    createMoveOption(columns[index + 1], 'down'),
  ].filter(isMoveOption);
}

function createMoveOption(
  column: BoardColumn | undefined,
  direction: MobileMoveOption['direction'],
): MobileMoveOption | null {
  if (!column) return null;
  return { status: column.status, label: mobileMoveLabel(column.status), direction };
}

function isMoveOption(option: MobileMoveOption | null): option is MobileMoveOption {
  return option !== null;
}

/** Returns the compact label used by the mobile move menu. */
export function mobileMoveLabel(status: TaskStatus): string {
  const labels: Record<TaskStatus, string> = {
    todo: 'To-do',
    inProgress: 'In progress',
    awaitFeedback: 'Review',
    done: 'Done',
  };
  return labels[status];
}

/** Maps contacts by their IDs for fast template lookups. */
export function contactsToMap(contacts: Contact[]): Map<string, Contact> {
  return new Map(
    contacts
      .filter((contact): contact is Contact & { id: string } => Boolean(contact.id))
      .map((contact): [string, Contact] => [contact.id, contact]),
  );
}

/** Reads a value from a form control event. */
export function inputValue(event: Event): string {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  return target.value;
}

/** Adds or removes a string from a list without mutating the source. */
export function toggleListItem(items: string[], item: string): string[] {
  return items.includes(item) ? items.filter((entry) => entry !== item) : [...items, item];
}

/** Creates a new local subtask for the edit form. */
export function createEditSubtask(taskId: string, title: string): Subtask {
  return { id: `${taskId}-edit-s${Date.now()}`, title, done: false };
}

/** Renames one subtask without mutating the source list. */
export function renameSubtask(subtasks: Subtask[], id: string, title: string): Subtask[] {
  return subtasks.map((subtask) => (subtask.id === id ? { ...subtask, title } : subtask));
}

/** Toggles one subtask without mutating the source list. */
export function toggleSubtask(subtasks: Subtask[], id: string): Subtask[] {
  return subtasks.map((subtask) =>
    subtask.id === id ? { ...subtask, done: !subtask.done } : subtask,
  );
}
