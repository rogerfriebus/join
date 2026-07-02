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

/** Namen der Supabase-Tabellen für Tasks. */
const TASKS_TABLE = 'tasks';
const SUBTASKS_TABLE = 'subtasks';

/** Form einer Task-Zeile in Supabase (snake_case). Siehe supabase/sql/tasks-setup.sql. */
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

/** Form einer Subtask-Zeile in Supabase (snake_case). */
interface SubtaskRow {
  id: string;
  task_id: string;
  title: string;
  done: boolean;
  position: number | null;
  created_at: string | null;
  updated_at: string | null;
}

/** Payload für tasks-Insert/Update (snake_case). */
type TaskRowPayload = Pick<
  TaskRow,
  'id' | 'title' | 'description' | 'due_date' | 'priority' | 'category' | 'status' | 'assigned_contact_ids'
>;

/** Payload für subtasks-Insert (snake_case). */
type SubtaskRowPayload = Pick<SubtaskRow, 'id' | 'task_id' | 'title' | 'done' | 'position'>;

/** Mappt eine Subtask-Zeile auf das Frontend-Modell. */
function mapRowToSubtask(row: SubtaskRow): Subtask {
  return { id: row.id, title: row.title, done: row.done };
}

/** Mappt eine Task-Zeile (+ zugehörige Subtasks) auf das Frontend-Modell. */
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

/** Mappt das Frontend-Modell auf ein tasks-Payload (snake_case). */
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

/** Mappt einen Subtask auf ein subtasks-Payload (snake_case) inkl. task_id/position. */
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
 * Zentraler Service für Tasks (Sprint 2: Board & Add Task).
 *
 * Der Service ist die zentrale Fassade für die Task-Datenlogik. Er hält den
 * Bestand als Angular Signal und bietet zusätzlich eine Supabase-Anbindung für
 * Tasks und Subtasks. UI-Komponenten nutzen ausschließlich die fachlichen
 * Methoden (loadTasks/addTask/updateTask/deleteTask/updateTaskStatus/
 * updateSubtaskStatus) und kennen keine Supabase-spezifischen Methoden.
 *
 * Demo-Setup (Developer-Akademie):
 *  - Supabase wird über Project URL + Publishable Key aus den environment-Dateien
 *    angebunden. Es werden BEWUSST keine Secret/Service-Role-Keys verwendet.
 *  - Die Demo-RLS erlaubt anon-Zugriff auf tasks/subtasks (nicht produktionsreif).
 *  - Die Demo-Tasks bleiben als Fallback erhalten, falls Supabase nicht erreichbar ist.
 */
@Injectable({ providedIn: 'root' })
export class TaskService {
  /**
   * Supabase-Client, lazy erzeugt. `createClient` öffnet keine Verbindung und
   * führt keinen Netzwerkaufruf aus, bevor eine Query gestartet wird.
   */
  private supabaseClient: SupabaseClient | null = null;

  /**
   * Interner Task-Bestand. Initialisiert mit einer unabhängigen Kopie der
   * Demo-Tasks (Fallback), damit die geteilten DUMMY_TASKS nicht mutiert werden
   * und jede Service-Instanz (z. B. pro Test) frisch startet.
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

  // ---------------------------------------------------------------------------
  // Fachliche Fassade (von der UI genutzt)
  // ---------------------------------------------------------------------------

  /**
   * Lädt Tasks (inkl. Subtasks) aus Supabase und aktualisiert das Signal.
   * Bei einem Fehler bleibt der bestehende (Demo-)Bestand als Fallback erhalten
   * und der Fehler wird geloggt – die Methode wirft also bewusst nicht.
   */
  async loadTasks(): Promise<void> {
    try {
      await this.loadTasksFromSupabase();
    } catch (error) {
      console.error(
        'Tasks konnten nicht aus Supabase geladen werden – Demo-Fallback bleibt aktiv.',
        error,
      );
    }
  }

  /**
   * Legt einen Task an: speichert ihn (inkl. Subtasks) in Supabase und
   * aktualisiert danach den sichtbaren Bestand. Gibt den gespeicherten Task
   * zurück.
   */
  async addTask(task: Task): Promise<Task> {
    const saved = await this.addTaskToSupabase(task);
    this.tasksSignal.update((tasks) => [...tasks, saved]);
    return saved;
  }

  /**
   * Aktualisiert einen Task in Supabase und danach den sichtbaren Bestand.
   * Liefert undefined ohne id oder bei unbekanntem Task.
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
   * Löscht einen Task in Supabase (Subtasks via FK-Cascade) und aktualisiert
   * danach den sichtbaren Bestand. Gibt true bei Erfolg zurück.
   */
  async deleteTask(id: string): Promise<boolean> {
    const deleted = await this.deleteTaskFromSupabase(id);
    if (deleted) {
      this.tasksSignal.update((tasks) => tasks.filter((task) => task.id !== id));
    }
    return deleted;
  }

  /**
   * Ändert nur den Status eines Tasks in Supabase und im sichtbaren Bestand.
   * Liefert undefined bei unbekannter id.
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
   * Ändert nur den done-Wert eines Subtasks in Supabase und im sichtbaren
   * Bestand. Liefert undefined bei unbekanntem Task oder Subtask.
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
  // Supabase-Zugriff (intern – nicht direkt aus UI-Komponenten aufrufen)
  // ---------------------------------------------------------------------------

  /** Lazy erzeugter Supabase-Client (Project URL + Publishable Key, kein Secret). */
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
   * Lädt Tasks und Subtasks aus Supabase, ordnet die Subtasks ihren Tasks zu
   * (sortiert nach position) und aktualisiert den internen Signal-Bestand.
   */
  async loadTasksFromSupabase(): Promise<Task[]> {
    const taskResult = await this.getClient()
      .from(TASKS_TABLE)
      .select('*')
      .order('id', { ascending: true });

    if (taskResult.error) {
      throw new Error(`Tasks konnten nicht geladen werden: ${taskResult.error.message}`);
    }

    const subtaskResult = await this.getClient()
      .from(SUBTASKS_TABLE)
      .select('*')
      .order('position', { ascending: true });

    if (subtaskResult.error) {
      throw new Error(`Subtasks konnten nicht geladen werden: ${subtaskResult.error.message}`);
    }

    const subtasksByTask = this.groupSubtasksByTask((subtaskResult.data ?? []) as SubtaskRow[]);
    const tasks = ((taskResult.data ?? []) as TaskRow[]).map((row) =>
      mapRowToTask(row, subtasksByTask.get(row.id) ?? []),
    );

    this.tasksSignal.set(tasks);
    return tasks;
  }

  /**
   * Speichert einen neuen Task (inkl. Subtasks) in Supabase und gibt den
   * gespeicherten Task zurück. Fehlt eine id, wird eine erzeugt.
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
      throw new Error(`Task konnte nicht gespeichert werden: ${error.message}`);
    }

    await this.replaceSubtasks(id, subtasks);
    return mapRowToTask(data as TaskRow, subtasks);
  }

  /**
   * Aktualisiert einen Task in Supabase und synchronisiert seine Subtasks
   * (pragmatisch: alte Subtasks löschen, neue einfügen). Liefert undefined,
   * wenn keine id gesetzt ist oder kein passender Datensatz existiert.
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
      throw new Error(`Task konnte nicht aktualisiert werden: ${error.message}`);
    }
    if (!data) {
      return undefined;
    }

    await this.replaceSubtasks(task.id, subtasks);
    return mapRowToTask(data as TaskRow, subtasks);
  }

  /**
   * Löscht einen Task in Supabase. Zugehörige Subtasks werden per FK-Cascade
   * entfernt. Gibt true zurück, wenn ein Datensatz gelöscht wurde.
   */
  async deleteTaskFromSupabase(id: string): Promise<boolean> {
    const { data, error } = await this.getClient()
      .from(TASKS_TABLE)
      .delete()
      .eq('id', id)
      .select('id');

    if (error) {
      throw new Error(`Task konnte nicht gelöscht werden: ${error.message}`);
    }
    return (data?.length ?? 0) > 0;
  }

  /**
   * Aktualisiert ausschließlich den Status eines Tasks in Supabase. Liefert
   * den aktualisierten Task (mit aktuellen Subtasks) oder undefined.
   */
  async updateTaskStatusInSupabase(id: string, status: TaskStatus): Promise<Task | undefined> {
    const { data, error } = await this.getClient()
      .from(TASKS_TABLE)
      .update({ status })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(`Task-Status konnte nicht aktualisiert werden: ${error.message}`);
    }
    if (!data) {
      return undefined;
    }

    const subtasks = this.getTaskById(id)?.subtasks ?? [];
    return mapRowToTask(data as TaskRow, subtasks);
  }

  /**
   * Aktualisiert ausschließlich den done-Wert eines Subtasks in Supabase.
   * Liefert den aktualisierten Parent-Task oder undefined (unbekannter Task/Subtask).
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
      throw new Error(`Subtask-Status konnte nicht aktualisiert werden: ${error.message}`);
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
  // Hilfsfunktionen
  // ---------------------------------------------------------------------------

  /** Ersetzt alle Subtasks eines Tasks (löschen + neu einfügen). */
  private async replaceSubtasks(taskId: string, subtasks: Subtask[]): Promise<void> {
    const { error: deleteError } = await this.getClient()
      .from(SUBTASKS_TABLE)
      .delete()
      .eq('task_id', taskId);

    if (deleteError) {
      throw new Error(`Subtasks konnten nicht ersetzt werden: ${deleteError.message}`);
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
      throw new Error(`Subtasks konnten nicht gespeichert werden: ${insertError.message}`);
    }
  }

  /** Gruppiert Subtask-Zeilen nach task_id (Reihenfolge bleibt erhalten). */
  private groupSubtasksByTask(rows: SubtaskRow[]): Map<string, Subtask[]> {
    const map = new Map<string, Subtask[]>();
    for (const row of rows) {
      const list = map.get(row.task_id) ?? [];
      list.push(mapRowToSubtask(row));
      map.set(row.task_id, list);
    }
    return map;
  }

  /** Ergänzt sinnvolle Default-Werte für einen (neuen) Task. */
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
   * Stellt sicher, dass jeder Subtask eine eindeutige, task-bezogene id besitzt.
   *
   * Neu vergeben wird die id (`${taskId}-s${index + 1}`), wenn sie
   *  - leer ist,
   *  - mit `tmp-` beginnt (temporäre UI-Platzhalter-id) oder
   *  - nicht mit `${taskId}-` beginnt (fremde id eines anderen Tasks).
   * So können keine globalen/fremden ids in die subtasks-Tabelle gelangen und
   * den Primärschlüssel `subtasks.id` verletzen (Duplicate-Key/409).
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
