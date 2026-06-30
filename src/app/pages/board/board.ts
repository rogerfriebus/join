import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../core/services/task.service';
import { ContactService } from '../../core/services/contact.service';
import { Task, TaskStatus } from '../../core/models/task.model';
import { Contact } from '../../core/models/contact.model';

/** Konfiguration einer Board-Spalte. */
interface BoardColumn {
  title: string;
  status: TaskStatus;
  emptyText: string;
}

/** Board-Spalte inklusive gefilterter Tasks. */
interface BoardColumnView extends BoardColumn {
  tasks: Task[];
}

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class Board implements OnInit {
  private taskService = inject(TaskService);
  private contactService = inject(ContactService);

  /** Read-only Task-Signal aus der TaskService-Fassade (keine direkte Supabase-Logik hier). */
  readonly tasks = this.taskService.tasks;

  /** Read-only Contact-Signal aus der ContactService-Fassade. */
  readonly contacts = this.contactService.contacts;

  /** Aktuell ausgewählter Task für die Detailansicht. */
  readonly selectedTask = signal<Task | null>(null);

  /** Task, der gerade per Drag & Drop bewegt wird. */
  readonly draggedTask = signal<Task | null>(null);

  /** Status der Spalte, über der gerade gedroppt werden kann. */
  readonly dragTargetStatus = signal<TaskStatus | null>(null);

  /** Aktuelle Suchanfrage für das Board. */
  readonly searchQuery = signal('');

  /** Normalisierte Suchanfrage für Vergleiche. */
  readonly normalizedSearchQuery = computed(() => this.searchQuery().trim().toLowerCase());

  /** Gibt an, ob aktuell gesucht wird. */
  readonly hasSearchQuery = computed(() => this.normalizedSearchQuery().length > 0);

  /** Kontakte nach ID gemappt, damit assignedContactIds sauber aufgelöst werden können. */
  readonly contactsById = computed(() => {
    const map = new Map<string, Contact>();

    for (const contact of this.contacts()) {
      if (contact.id) {
        map.set(contact.id, contact);
      }
    }

    return map;
  });

  /** Die vier Kanban-Spalten in fester Reihenfolge. */
  readonly columns: readonly BoardColumn[] = [
    { title: 'ToDo', status: 'todo', emptyText: 'No tasks ToDo' },
    { title: 'In Progress', status: 'inProgress', emptyText: 'No tasks In Progress' },
    {
      title: 'Awaiting Feedback',
      status: 'awaitFeedback',
      emptyText: 'No tasks Awaiting Feedback',
    },
    { title: 'Done', status: 'done', emptyText: 'No tasks Done' },
  ];

  /** Gefilterte Tasks anhand der aktuellen Suche. */
  readonly filteredTasks = computed(() => {
    const query = this.normalizedSearchQuery();

    if (!query) {
      return this.tasks();
    }

    return this.tasks().filter((task) => this.taskMatchesQuery(task, query));
  });

  /** Reaktive Gruppierung der gefilterten Tasks nach Status pro Spalte. */
  readonly board = computed<BoardColumnView[]>(() =>
    this.columns.map((column) => ({
      ...column,
      tasks: this.filteredTasks().filter((task) => task.status === column.status),
    })),
  );

  /** Gibt an, ob es für die aktuelle Suche überhaupt Treffer gibt. */
  readonly hasSearchResults = computed(() =>
    this.board().some((column) => column.tasks.length > 0),
  );

  /** Lädt Tasks und Kontakte beim Öffnen des Boards über die jeweiligen Fassaden. */
  async ngOnInit(): Promise<void> {
    await Promise.all([this.taskService.loadTasks(), this.contactService.loadContacts()]);
  }

  /** Aktualisiert die Suche beim Tippen im Suchfeld. */
  updateSearchQuery(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  /** Entfernt die aktuelle Suche. */
  clearSearchQuery(): void {
    this.searchQuery.set('');
  }

  /** Prüft, ob eine Task zur aktuellen Suche passt. */
  private taskMatchesQuery(task: Task, query: string): boolean {
    const searchableText = [
      task.title,
      task.description ?? '',
      task.category,
      task.priority,
      task.dueDate,
    ]
      .join(' ')
      .toLowerCase();

    return searchableText.includes(query);
  }

  /** Empty-State-Text je Spalte. */
  columnEmptyText(column: BoardColumnView): string {
    if (this.hasSearchQuery()) {
      return 'No matching tasks';
    }

    return column.emptyText;
  }

  /** Kurze Beschreibungsvorschau für die Karte. */
  descriptionPreview(description: string | undefined): string {
    if (!description) {
      return '';
    }

    const max = 80;
    return description.length > max ? `${description.slice(0, max).trimEnd()}…` : description;
  }

  /** Anzahl erledigter Subtasks eines Tasks. */
  doneSubtasks(task: Task): number {
    return task.subtasks.filter((subtask) => subtask.done).length;
  }

  /** Liefert die Initialen eines zugewiesenen Kontakts. */
  assigneeInitials(contactId: string): string {
    const contact = this.contactsById().get(contactId);

    if (contact?.initials) {
      return contact.initials;
    }

    if (contact?.name) {
      return contact.name
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    }

    return '?';
  }

  /** Liefert den Namen eines zugewiesenen Kontakts. */
  assigneeName(contactId: string): string {
    return this.contactsById().get(contactId)?.name ?? 'Unknown contact';
  }

  /** Liefert die Avatar-Farbe eines zugewiesenen Kontakts. */
  assigneeColor(contactId: string): string {
    return this.contactsById().get(contactId)?.color ?? '#ff7a00';
  }

  /** Lesbares Label für die Priority-Anzeige. */
  priorityLabel(priority: Task['priority']): string {
    switch (priority) {
      case 'urgent':
        return 'Urgent';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Low';
      default:
        return priority;
    }
  }

  /** Öffnet die Detailansicht für einen Task. */
  openTaskDetail(task: Task): void {
    this.selectedTask.set(task);
  }

  /** Schließt die Detailansicht. */
  closeTaskDetail(): void {
    this.selectedTask.set(null);
  }

  /** Startet den Drag-Vorgang für eine Task Card. */
  startTaskDrag(task: Task, event: DragEvent): void {
    this.draggedTask.set(task);

    event.dataTransfer?.setData('text/plain', task.id);

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  /** Markiert eine Spalte als aktuelles Drop-Ziel. */
  setDragTarget(status: TaskStatus): void {
    if (!this.draggedTask()) {
      return;
    }

    this.dragTargetStatus.set(status);
  }

  /** Entfernt die optische Drop-Markierung. */
  clearDragTarget(): void {
    this.dragTargetStatus.set(null);
  }

  /** Beendet den Drag-Vorgang ohne Statusänderung. */
  endTaskDrag(): void {
    this.draggedTask.set(null);
    this.dragTargetStatus.set(null);
  }

  /** Verschiebt eine Task in eine andere Board-Spalte. */
  async dropTask(status: TaskStatus): Promise<void> {
    const task = this.draggedTask();

    if (!task || task.status === status) {
      this.endTaskDrag();
      return;
    }

    try {
      await this.taskService.updateTaskStatus(task.id, status);
    } finally {
      this.endTaskDrag();
    }
  }
}
