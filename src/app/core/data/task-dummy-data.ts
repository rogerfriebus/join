import { Task } from '../models/task.model';

/**
 * Seriöse Demo-Tasks für Sprint 2 (Board & Add Task).
 *
 * Diese Daten dienen der Entwicklung von Board und Add Task, bevor eine echte
 * Persistenz angebunden wird. Es werden BEWUSST keine echten personenbezogenen
 * Daten verwendet.
 *
 * `assignedContactIds` referenzieren die Demo-Contact-IDs aus dem
 * ContactService (ids "1"–"12").
 */
export const DUMMY_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Kanban Board Grundlayout finalisieren',
    description: 'Vier Spalten (ToDo, In Progress, Awaiting Feedback, Done) mit Platzhalter-Karten aufbauen.',
    dueDate: '2026-07-15',
    priority: 'urgent',
    category: 'Technical Task',
    status: 'todo',
    assignedContactIds: ['1', '2'],
    subtasks: [
      { id: 't1-s1', title: 'Spalten-Komponente erstellen', done: false },
      { id: 't1-s2', title: 'Responsives Grid definieren', done: false },
    ],
    createdAt: '2026-06-18',
    updatedAt: '2026-06-18',
  },
  {
    id: 't2',
    title: 'Add Task Formular validieren',
    description: 'Pflichtfelder Titel, Due Date und Kategorie prüfen und Fehlermeldungen anzeigen.',
    dueDate: '2026-07-10',
    priority: 'medium',
    category: 'User Story',
    status: 'inProgress',
    assignedContactIds: ['3', '4', '5'],
    subtasks: [
      { id: 't2-s1', title: 'Titel-Validierung', done: true },
      { id: 't2-s2', title: 'Due-Date-Validierung', done: false },
      { id: 't2-s3', title: 'Kategorie-Validierung', done: false },
    ],
  },
  {
    id: 't3',
    title: 'Contacts Integration im Board prüfen',
    description: 'Zugewiesene Kontakte als Initialen-Avatare auf den Task-Karten anzeigen.',
    dueDate: '2026-07-08',
    priority: 'low',
    category: 'Technical Task',
    status: 'awaitFeedback',
    assignedContactIds: ['6'],
    subtasks: [],
  },
  {
    id: 't4',
    title: 'Responsive Board Verhalten testen',
    description: 'Board auf Tablet- und Mobilbreiten testen und Scroll-/Umbruchverhalten sicherstellen.',
    dueDate: '2026-06-30',
    priority: 'medium',
    category: 'User Story',
    status: 'done',
    assignedContactIds: ['7', '8'],
    subtasks: [
      { id: 't4-s1', title: 'Breakpoints definieren', done: true },
      { id: 't4-s2', title: 'Mobile Ansicht prüfen', done: true },
    ],
    createdAt: '2026-06-10',
    updatedAt: '2026-06-19',
  },
  {
    id: 't5',
    title: 'Deployment Build für Mentor vorbereiten',
    description: 'Produktions-Build erstellen und Abgabe-Stand für das Mentor-Review bereitstellen.',
    dueDate: '2026-07-20',
    priority: 'low',
    category: 'User Story',
    status: 'todo',
    assignedContactIds: [],
    subtasks: [],
  },
  {
    id: 't6',
    title: 'Drag-and-Drop zwischen Board-Spalten konzipieren',
    description: 'Technisches Konzept für das Verschieben von Tasks zwischen den vier Spalten erarbeiten.',
    dueDate: '2026-07-12',
    priority: 'urgent',
    category: 'Technical Task',
    status: 'inProgress',
    assignedContactIds: ['9', '10', '11'],
    subtasks: [
      { id: 't6-s1', title: 'CDK DragDrop evaluieren', done: true },
      { id: 't6-s2', title: 'Statuswechsel beim Drop definieren', done: false },
    ],
  },
];
