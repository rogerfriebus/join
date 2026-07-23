import { DUMMY_TASKS } from './task-dummy-data';
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  TASK_CATEGORIES,
} from '../models/task.model';

describe('DUMMY_TASKS', () => {
  it('contains exactly 5 tasks', () => {
    expect(DUMMY_TASKS.length).toBe(5);
  });

  it('has unique task IDs', () => {
    const ids = DUMMY_TASKS.map((task) => task.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every task the required fields id, title, dueDate, priority, category, status', () => {
    for (const task of DUMMY_TASKS) {
      expect(task.id).toBeTruthy();
      expect(task.title).toBeTruthy();
      expect(task.dueDate).toBeTruthy();
      expect(task.priority).toBeTruthy();
      expect(task.category).toBeTruthy();
      expect(task.status).toBeTruthy();
    }
  });

  it('uses only valid status values', () => {
    for (const task of DUMMY_TASKS) {
      expect(TASK_STATUSES).toContain(task.status);
    }
  });

  it('uses only valid priorities', () => {
    for (const task of DUMMY_TASKS) {
      expect(TASK_PRIORITIES).toContain(task.priority);
    }
  });

  it('uses only valid categories', () => {
    for (const task of DUMMY_TASKS) {
      expect(TASK_CATEGORIES).toContain(task.category);
    }
  });

  it('keeps dueDate as a parsable date', () => {
    for (const task of DUMMY_TASKS) {
      expect(Number.isNaN(Date.parse(task.dueDate))).toBe(false);
    }
  });

  it('gives every subtask an id, a title and a boolean done', () => {
    for (const task of DUMMY_TASKS) {
      for (const subtask of task.subtasks) {
        expect(subtask.id).toBeTruthy();
        expect(subtask.title).toBeTruthy();
        expect(typeof subtask.done).toBe('boolean');
      }
    }
  });

  it('has project-wide unique subtask IDs', () => {
    const subtaskIds = DUMMY_TASKS.flatMap((task) => task.subtasks.map((s) => s.id));
    expect(new Set(subtaskIds).size).toBe(subtaskIds.length);
  });

  it('covers all four status values at least once', () => {
    const used = new Set(DUMMY_TASKS.map((task) => task.status));
    for (const status of TASK_STATUSES) {
      expect(used.has(status)).toBe(true);
    }
  });

  it('covers all three priorities at least once', () => {
    const used = new Set(DUMMY_TASKS.map((task) => task.priority));
    for (const priority of TASK_PRIORITIES) {
      expect(used.has(priority)).toBe(true);
    }
  });

  it('covers both categories at least once', () => {
    const used = new Set(DUMMY_TASKS.map((task) => task.category));
    for (const category of TASK_CATEGORIES) {
      expect(used.has(category)).toBe(true);
    }
  });

  it('contains tasks with and without subtasks', () => {
    expect(DUMMY_TASKS.some((task) => task.subtasks.length > 0)).toBe(true);
    expect(DUMMY_TASKS.some((task) => task.subtasks.length === 0)).toBe(true);
  });

  it('always has assignedContactIds as an array of strings', () => {
    for (const task of DUMMY_TASKS) {
      expect(Array.isArray(task.assignedContactIds)).toBe(true);
      for (const id of task.assignedContactIds) {
        expect(typeof id).toBe('string');
      }
    }
  });
});
