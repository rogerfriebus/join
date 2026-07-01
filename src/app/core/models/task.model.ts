/**
 * Datenmodell für Tasks (Sprint 2: Board & Add Task).
 *
 * Diese Datei definiert die zentralen Typen für Tasks und Subtasks sowie die
 * erlaubten Status-, Prioritäts- und Kategoriewerte. Sie bildet die technische
 * Grundlage, auf der Board und Add Task später aufbauen.
 *
 * In diesem Schritt wird BEWUSST keine Supabase-/Backend-Anbindung gebaut.
 */

/**
 * Status einer Task – entspricht den vier Spalten des Kanban-Boards:
 * ToDo, In Progress, Awaiting Feedback, Done.
 */
export type TaskStatus = 'todo' | 'inProgress' | 'awaitFeedback' | 'done';

/** Priorität einer Task. Default im Add-Task-Formular ist später `medium`. */
export type TaskPriority = 'urgent' | 'medium' | 'low';

/** Kategorie einer Task (Pflichtfeld in Add Task). */
export type TaskCategory = 'Technical Task' | 'User Story';

/**
 * Alle gültigen Statuswerte als zur Laufzeit nutzbare Liste
 * (z. B. für Validierung, Iteration über Board-Spalten oder Tests).
 */
export const TASK_STATUSES: readonly TaskStatus[] = [
  'todo',
  'inProgress',
  'awaitFeedback',
  'done',
];

/** Alle gültigen Prioritäten als zur Laufzeit nutzbare Liste. */
export const TASK_PRIORITIES: readonly TaskPriority[] = ['urgent', 'medium', 'low'];

/** Alle gültigen Kategorien als zur Laufzeit nutzbare Liste. */
export const TASK_CATEGORIES: readonly TaskCategory[] = ['Technical Task', 'User Story'];

/** Standard-Priorität für neue Tasks (gemäß Sprint-2-Vorgabe). */
export const DEFAULT_TASK_PRIORITY: TaskPriority = 'medium';

/**
 * Eine Subtask gehört zu genau einer Task und dient der Fortschrittsanzeige
 * (erledigte / gesamte Subtasks).
 */
export interface Subtask {
  /** Eindeutige id der Subtask. */
  id: string;
  /** Kurzbeschreibung der Subtask. Pflichtfeld. */
  title: string;
  /** Erledigt-Status der Subtask. */
  done: boolean;
}

/**
 * Eine Task im Join-Board.
 *
 * Spiegelt die Sprint-2-Anforderungen wider: Kategorie, Titel,
 * Beschreibungsvorschau, zugewiesene Kontakte, Priorität, Status und Subtasks.
 */
export interface Task {
  /** Eindeutige id der Task. */
  id: string;
  /** Titel der Task. Pflichtfeld. */
  title: string;
  /** Optionale Beschreibung (für die Beschreibungsvorschau im Board). */
  description?: string;
  /** Fälligkeitsdatum als ISO-kompatibler String (z. B. "2026-07-15"). Pflichtfeld. */
  dueDate: string;
  /** Priorität der Task. */
  priority: TaskPriority;
  /** Kategorie der Task. */
  category: TaskCategory;
  /** Aktuelle Board-Spalte der Task. */
  status: TaskStatus;
  /**
   * IDs der zugewiesenen Kontakte. Referenziert vorhandene Contacts über deren
   * id (siehe ContactService). Bewusst nur IDs – keine User-/Auth-Logik.
   */
  assignedContactIds: string[];
  /** Subtasks der Task (leeres Array, wenn keine vorhanden). */
  subtasks: Subtask[];
  /** Erstellungszeitpunkt (ISO-String), optional. */
  createdAt?: string;
  /** Letzter Änderungszeitpunkt (ISO-String), optional. */
  updatedAt?: string;
}
