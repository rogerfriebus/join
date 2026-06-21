import { Injectable, signal } from '@angular/core';
import { Task, TaskStatus, DEFAULT_TASK_PRIORITY } from '../models/task.model';
import { DUMMY_TASKS } from '../data/task-dummy-data';

/**
 * Zentraler Service für Tasks (Sprint 2: Board & Add Task).
 *
 * Der Service ist die zentrale Fassade für die Task-Datenlogik. Er hält den
 * Bestand als Angular Signal und initialisiert ihn mit den Demo-Tasks aus
 * `task-dummy-data`. Alle Änderungen erfolgen immutable.
 *
 * In diesem Schritt wird BEWUSST keine Supabase-/Backend-Anbindung gebaut.
 */
@Injectable({ providedIn: 'root' })
export class TaskService {
  /**
   * Interner Task-Bestand. Initialisiert mit einer unabhängigen Kopie der
   * Demo-Tasks, damit die geteilten DUMMY_TASKS nicht mutiert werden und jede
   * Service-Instanz (z. B. pro Test) frisch startet.
   */
  private readonly tasksSignal = signal<Task[]>(
    DUMMY_TASKS.map((task) => ({
      ...task,
      assignedContactIds: [...task.assignedContactIds],
      subtasks: task.subtasks.map((subtask) => ({ ...subtask })),
    })),
  );

  /**
   * Öffentlicher, read-only Zugriff auf den aktuellen Task-Bestand.
   * UI-Komponenten lesen Tasks ausschließlich hierüber (reaktiv).
   */
  readonly tasks = this.tasksSignal.asReadonly();

  /** Liefert den aktuellen Task-Bestand (Snapshot). */
  getTasks(): Task[] {
    return this.tasksSignal();
  }

  /** Liefert einen einzelnen Task anhand der id oder undefined, wenn nicht gefunden. */
  getTaskById(id: string): Task | undefined {
    return this.tasksSignal().find((task) => task.id === id);
  }

  /**
   * Fügt einen Task hinzu und gibt den gespeicherten Task zurück. Fehlt eine
   * id, wird eine eindeutige id erzeugt. Sinnvolle Default-Werte werden ergänzt.
   */
  addTask(task: Task): Task {
    const id = task.id || this.generateId();
    const newTask: Task = {
      ...task,
      id,
      priority: task.priority ?? DEFAULT_TASK_PRIORITY,
      status: task.status ?? 'todo',
      assignedContactIds: task.assignedContactIds ?? [],
      subtasks: task.subtasks ?? [],
    };
    this.tasksSignal.update((tasks) => [...tasks, newTask]);
    return newTask;
  }

  /**
   * Ersetzt einen bestehenden Task anhand seiner id und gibt den aktualisierten
   * Task zurück. Liefert undefined, wenn keine id gesetzt ist oder kein Task
   * mit dieser id existiert.
   */
  updateTask(task: Task): Task | undefined {
    if (!task.id) {
      return undefined;
    }
    if (!this.getTaskById(task.id)) {
      return undefined;
    }
    const updated: Task = { ...task };
    this.tasksSignal.update((tasks) =>
      tasks.map((t) => (t.id === updated.id ? updated : t)),
    );
    return updated;
  }

  /**
   * Entfernt einen Task anhand seiner id. Gibt true zurück, wenn ein Task
   * entfernt wurde, sonst false.
   */
  deleteTask(id: string): boolean {
    const before = this.tasksSignal().length;
    this.tasksSignal.update((tasks) => tasks.filter((task) => task.id !== id));
    return this.tasksSignal().length < before;
  }

  /**
   * Ändert ausschließlich den Status eines Tasks (z. B. beim Verschieben
   * zwischen Board-Spalten). Liefert undefined bei unbekannter id.
   */
  updateTaskStatus(id: string, status: TaskStatus): Task | undefined {
    const existing = this.getTaskById(id);
    if (!existing) {
      return undefined;
    }
    const updated: Task = { ...existing, status };
    this.tasksSignal.update((tasks) =>
      tasks.map((task) => (task.id === id ? updated : task)),
    );
    return updated;
  }

  /**
   * Ändert ausschließlich den done-Wert eines Subtasks (für die
   * Fortschrittsanzeige). Liefert undefined bei unbekanntem Task oder Subtask.
   */
  updateSubtaskStatus(taskId: string, subtaskId: string, done: boolean): Task | undefined {
    const existing = this.getTaskById(taskId);
    if (!existing) {
      return undefined;
    }
    if (!existing.subtasks.some((subtask) => subtask.id === subtaskId)) {
      return undefined;
    }
    const updated: Task = {
      ...existing,
      subtasks: existing.subtasks.map((subtask) =>
        subtask.id === subtaskId ? { ...subtask, done } : subtask,
      ),
    };
    this.tasksSignal.update((tasks) =>
      tasks.map((task) => (task.id === taskId ? updated : task)),
    );
    return updated;
  }

  /**
   * Erzeugt eine eindeutige id im Schema `t<n>`. Erkennt den numerischen Anteil
   * bestehender IDs (t1, t2, …), nutzt die höchste Nummer + 1 und stellt sicher,
   * dass die erzeugte id noch nicht vergeben ist.
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
