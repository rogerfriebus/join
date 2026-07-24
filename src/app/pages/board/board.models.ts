import {
  Subtask,
  Task,
  TaskCategory,
  TaskPriority,
  TaskStatus,
} from '../../core/models/task.model';

/** Configuration for one Kanban column. */
export interface BoardColumn {
  title: string;
  status: TaskStatus;
  emptyText: string;
}

/** Board column together with its filtered tasks. */
export interface BoardColumnView extends BoardColumn {
  tasks: Task[];
}

/** Option displayed in the mobile move menu. */
export interface MobileMoveOption {
  status: TaskStatus;
  label: string;
  direction: 'up' | 'down';
}

/** Local form state used by the task edit overlay. */
export interface EditTaskDraft {
  title: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  category: TaskCategory | '';
  assignedContactIds: string[];
  subtasks: Subtask[];
  newSubtaskTitle: string;
}

/** Fixed order and labels of the four board columns. */
export const BOARD_COLUMNS: readonly BoardColumn[] = [
  { title: 'To do', status: 'todo', emptyText: 'No tasks To do' },
  { title: 'In progress', status: 'inProgress', emptyText: 'No tasks In progress' },
  {
    title: 'Await feedback',
    status: 'awaitFeedback',
    emptyText: 'No tasks Await feedback',
  },
  { title: 'Done', status: 'done', emptyText: 'No tasks Done' },
];
