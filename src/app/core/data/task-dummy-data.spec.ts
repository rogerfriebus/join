import { DUMMY_TASKS } from './task-dummy-data';
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  TASK_CATEGORIES,
} from '../models/task.model';

describe('DUMMY_TASKS', () => {
  it('enthält mindestens 5 Tasks', () => {
    expect(DUMMY_TASKS.length).toBeGreaterThanOrEqual(5);
  });

  it('hat eindeutige Task-IDs', () => {
    const ids = DUMMY_TASKS.map((task) => task.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('jede Task hat die Pflichtfelder id, title, dueDate, priority, category, status', () => {
    for (const task of DUMMY_TASKS) {
      expect(task.id).toBeTruthy();
      expect(task.title).toBeTruthy();
      expect(task.dueDate).toBeTruthy();
      expect(task.priority).toBeTruthy();
      expect(task.category).toBeTruthy();
      expect(task.status).toBeTruthy();
    }
  });

  it('verwendet nur gültige Statuswerte', () => {
    for (const task of DUMMY_TASKS) {
      expect(TASK_STATUSES).toContain(task.status);
    }
  });

  it('verwendet nur gültige Prioritäten', () => {
    for (const task of DUMMY_TASKS) {
      expect(TASK_PRIORITIES).toContain(task.priority);
    }
  });

  it('verwendet nur gültige Kategorien', () => {
    for (const task of DUMMY_TASKS) {
      expect(TASK_CATEGORIES).toContain(task.category);
    }
  });

  it('hält dueDate als parsebares Datum', () => {
    for (const task of DUMMY_TASKS) {
      expect(Number.isNaN(Date.parse(task.dueDate))).toBe(false);
    }
  });

  it('hat für jede Subtask id, title und einen boolean done', () => {
    for (const task of DUMMY_TASKS) {
      for (const subtask of task.subtasks) {
        expect(subtask.id).toBeTruthy();
        expect(subtask.title).toBeTruthy();
        expect(typeof subtask.done).toBe('boolean');
      }
    }
  });

  it('hat projektweit eindeutige Subtask-IDs', () => {
    const subtaskIds = DUMMY_TASKS.flatMap((task) => task.subtasks.map((s) => s.id));
    expect(new Set(subtaskIds).size).toBe(subtaskIds.length);
  });

  it('deckt alle vier Statuswerte mindestens einmal ab', () => {
    const used = new Set(DUMMY_TASKS.map((task) => task.status));
    for (const status of TASK_STATUSES) {
      expect(used.has(status)).toBe(true);
    }
  });

  it('deckt alle drei Prioritäten mindestens einmal ab', () => {
    const used = new Set(DUMMY_TASKS.map((task) => task.priority));
    for (const priority of TASK_PRIORITIES) {
      expect(used.has(priority)).toBe(true);
    }
  });

  it('deckt beide Kategorien mindestens einmal ab', () => {
    const used = new Set(DUMMY_TASKS.map((task) => task.category));
    for (const category of TASK_CATEGORIES) {
      expect(used.has(category)).toBe(true);
    }
  });

  it('enthält Tasks mit und ohne Subtasks', () => {
    expect(DUMMY_TASKS.some((task) => task.subtasks.length > 0)).toBe(true);
    expect(DUMMY_TASKS.some((task) => task.subtasks.length === 0)).toBe(true);
  });

  it('assignedContactIds ist immer ein Array von Strings', () => {
    for (const task of DUMMY_TASKS) {
      expect(Array.isArray(task.assignedContactIds)).toBe(true);
      for (const id of task.assignedContactIds) {
        expect(typeof id).toBe('string');
      }
    }
  });
});
