import { Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../core/services/task.service';
import { ContactService } from '../../core/services/contact.service';
import {
  Subtask,
  Task,
  TaskCategory,
  TaskPriority,
  TaskStatus,
} from '../../core/models/task.model';
import { Contact } from '../../core/models/contact.model';
import { AddTaskModal } from '../add-task-modal/add-task-modal';


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

/** Option für das mobile Move-to-Menü. */
interface MobileMoveOption {
  status: TaskStatus;
  label: string;
  direction: 'up' | 'down';
}

/** Lokaler Formularzustand für das Edit-Overlay. */
interface EditTaskDraft {
  title: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  category: TaskCategory | '';
  assignedContactIds: string[];
  subtasks: Subtask[];
  newSubtaskTitle: string;
}

function createEmptyEditDraft(): EditTaskDraft {
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

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, RouterLink, AddTaskModal],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class Board implements OnInit {
  private taskService = inject(TaskService);
  private contactService = inject(ContactService);

  /** Read-only Task-Signal aus der TaskService-Fassade. */
  readonly tasks = this.taskService.tasks;

  /** Read-only Contact-Signal aus der ContactService-Fassade. */
  readonly contacts = this.contactService.contacts;

  /** Aktuell ausgewählter Task für die Detailansicht. */
  readonly selectedTask = signal<Task | null>(null);

  /** Task, der gerade im Edit-Overlay bearbeitet wird. */
  readonly editTask = signal<Task | null>(null);

  /** Formularzustand für das Edit-Overlay. */
  readonly editDraft = signal<EditTaskDraft>(createEmptyEditDraft());

  /** Gibt an, ob im Edit-Overlay schon versucht wurde zu speichern. */
  readonly editSubmitted = signal(false);

  /** Task, der gerade per Drag & Drop bewegt wird. */
  readonly draggedTask = signal<Task | null>(null);

  /** Status der Spalte, über der gerade gedroppt werden kann. */
  readonly dragTargetStatus = signal<TaskStatus | null>(null);

  /** Geöffnetes mobiles Move-Menü. */
  readonly openedMobileMoveMenuTaskId = signal<string | null>(null);

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

  /** Gibt an, ob das Edit-Formular aktuell valide ist. */
  readonly editFormIsValid = computed(() => {
    const draft = this.editDraft();

    return Boolean(draft.title.trim() && draft.dueDate.trim() && draft.category);
  });

  /** Die vier Kanban-Spalten in fester Reihenfolge. */
  readonly columns: readonly BoardColumn[] = [
    { title: 'To do', status: 'todo', emptyText: 'No tasks To do' },
    { title: 'In progress', status: 'inProgress', emptyText: 'No tasks In progress' },
    {
      title: 'Await feedback',
      status: 'awaitFeedback',
      emptyText: 'No tasks Await feedback',
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
    this.searchQuery.set(this.inputValue(event));
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

  /** Liefert die auf der Card sichtbaren Assignee-IDs. */
  visibleAssigneeIds(task: Task, maxVisible = 6): string[] {
    return task.assignedContactIds.slice(0, maxVisible);
  }

  /** Liefert die Anzahl weiterer, versteckter Assignees. */
  hiddenAssigneeCount(task: Task, maxVisible = 6): number {
    return Math.max(task.assignedContactIds.length - maxVisible, 0);
  }

  /** Liefert die Initialen eines zugewiesenen Kontakts. */
  assigneeInitials(contactId: string): string {
    const contact = this.contactsById().get(contactId);

    if (contact?.initials) {
      return contact.initials;
    }

    if (contact?.name) {
      return this.initialsFromName(contact.name);
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

  /** Liefert Initialen für einen Kontakt im Edit-Overlay. */
  contactInitials(contact: Contact): string {
    return contact.initials ?? this.initialsFromName(contact.name);
  }

  /** Baut Initialen aus einem Namen. */
  private initialsFromName(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
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
    this.closeMobileMoveMenu();
    this.selectedTask.set(task);
  }

  /** Schließt die Detailansicht. */
  closeTaskDetail(): void {
    this.selectedTask.set(null);
  }

  /** Öffnet oder schließt das mobile Move-to-Menü einer Task. */
  toggleMobileMoveMenu(taskId: string, event: MouseEvent): void {
    event.stopPropagation();

    this.openedMobileMoveMenuTaskId.update((openedTaskId) =>
      openedTaskId === taskId ? null : taskId,
    );
  }

  /** Schließt das mobile Move-to-Menü. */
  closeMobileMoveMenu(): void {
    this.openedMobileMoveMenuTaskId.set(null);
  }

  /** Liefert die möglichen Mobile-Move-Ziele für eine Task. */
  mobileMoveOptions(task: Task): MobileMoveOption[] {
    const currentIndex = this.columns.findIndex((column) => column.status === task.status);
    const options: MobileMoveOption[] = [];

    if (currentIndex === -1) {
      return options;
    }

    const previousColumn = this.columns[currentIndex - 1];
    const nextColumn = this.columns[currentIndex + 1];

    if (previousColumn) {
      options.push({
        status: previousColumn.status,
        label: this.mobileMoveLabel(previousColumn.status),
        direction: 'up',
      });
    }

    if (nextColumn) {
      options.push({
        status: nextColumn.status,
        label: this.mobileMoveLabel(nextColumn.status),
        direction: 'down',
      });
    }

    return options;
  }

  /** Lesbare Labels für das Mobile-Move-Menü. */
  private mobileMoveLabel(status: TaskStatus): string {
    switch (status) {
      case 'todo':
        return 'To-do';
      case 'inProgress':
        return 'In progress';
      case 'awaitFeedback':
        return 'Review';
      case 'done':
        return 'Done';
      default:
        return status;
    }
  }

  /** Verschiebt eine Task über das mobile Move-Menü in einen anderen Status. */
  async moveTaskToStatus(task: Task, status: TaskStatus, event: MouseEvent): Promise<void> {
    event.stopPropagation();

    this.closeMobileMoveMenu();

    if (task.status === status) {
      return;
    }

    await this.taskService.updateTaskStatus(task.id, status);
  }

  /** Öffnet das Edit-Overlay für einen Task. */
  openTaskEdit(task: Task): void {
    this.editSubmitted.set(false);
    this.editTask.set(task);
    this.editDraft.set({
      title: task.title,
      description: task.description ?? '',
      dueDate: task.dueDate,
      priority: task.priority,
      category: task.category,
      assignedContactIds: [...task.assignedContactIds],
      subtasks: task.subtasks.map((subtask) => ({ ...subtask })),
      newSubtaskTitle: '',
    });
  }

  /** Schließt das Edit-Overlay. */
  closeTaskEdit(): void {
    this.editTask.set(null);
    this.editSubmitted.set(false);
    this.editDraft.set(createEmptyEditDraft());
  }

  /** Löscht den aktuell ausgewählten Task. */
  async deleteSelectedTask(): Promise<void> {
    const task = this.selectedTask();

    if (!task) {
      return;
    }

    const deleted = await this.taskService.deleteTask(task.id);

    if (deleted) {
      this.closeTaskDetail();
      this.closeTaskEdit();
    }
  }

  /** Speichert die Änderungen aus dem Edit-Overlay. */
  async saveTaskEdit(): Promise<void> {
    this.editSubmitted.set(true);

    const originalTask = this.editTask();
    const draft = this.editDraft();

    if (!originalTask || !this.editFormIsValid() || !draft.category) {
      return;
    }

    const updatedTask: Task = {
      ...originalTask,
      title: draft.title.trim(),
      description: draft.description.trim() || undefined,
      dueDate: draft.dueDate,
      priority: draft.priority,
      category: draft.category,
      assignedContactIds: [...draft.assignedContactIds],
      subtasks: draft.subtasks
        .filter((subtask) => subtask.title.trim())
        .map((subtask, index) => ({
          ...subtask,
          id: subtask.id || `${originalTask.id}-s${index + 1}`,
          title: subtask.title.trim(),
        })),
      updatedAt: new Date().toISOString(),
    };

    const savedTask = await this.taskService.updateTask(updatedTask);

    if (savedTask) {
      this.closeTaskEdit();
      this.closeTaskDetail();
    }
  }

  /** Aktualisiert den Titel im Edit-Formular. */
  updateEditTitle(event: Event): void {
    this.patchEditDraft({ title: this.inputValue(event) });
  }

  /** Aktualisiert die Beschreibung im Edit-Formular. */
  updateEditDescription(event: Event): void {
    this.patchEditDraft({ description: this.inputValue(event) });
  }

  /** Aktualisiert das Fälligkeitsdatum im Edit-Formular. */
  updateEditDueDate(event: Event): void {
    this.patchEditDraft({ dueDate: this.inputValue(event) });
  }

  /** Aktualisiert die Kategorie im Edit-Formular. */
  updateEditCategory(event: Event): void {
    this.patchEditDraft({ category: this.inputValue(event) as TaskCategory | '' });
  }

  /** Setzt die Priority im Edit-Formular. */
  setEditPriority(priority: TaskPriority): void {
    this.patchEditDraft({ priority });
  }

  /** Aktualisiert den Eingabewert für eine neue Subtask. */
  updateEditNewSubtaskTitle(event: Event): void {
    this.patchEditDraft({ newSubtaskTitle: this.inputValue(event) });
  }

  /** Fügt dem Edit-Formular eine neue Subtask hinzu. */
  addEditSubtask(): void {
    const draft = this.editDraft();
    const title = draft.newSubtaskTitle.trim();

    if (!title) {
      return;
    }

    const taskId = this.editTask()?.id ?? 'task';
    const subtask: Subtask = {
      id: `${taskId}-edit-s${Date.now()}`,
      title,
      done: false,
    };

    this.patchEditDraft({
      subtasks: [...draft.subtasks, subtask],
      newSubtaskTitle: '',
    });
  }

  /** Entfernt eine Subtask aus dem Edit-Formular. */
  removeEditSubtask(subtaskId: string): void {
    this.patchEditDraft({
      subtasks: this.editDraft().subtasks.filter((subtask) => subtask.id !== subtaskId),
    });
  }

  /** Ändert den Done-Status einer Subtask im Edit-Formular. */
  toggleEditSubtaskDone(subtaskId: string): void {
    this.patchEditDraft({
      subtasks: this.editDraft().subtasks.map((subtask) =>
        subtask.id === subtaskId ? { ...subtask, done: !subtask.done } : subtask,
      ),
    });
  }

  /** Wählt einen Kontakt für Assigned To aus oder entfernt ihn. */
  toggleEditAssignedContact(contactId: string | undefined): void {
    if (!contactId) {
      return;
    }

    const selectedIds = new Set(this.editDraft().assignedContactIds);

    if (selectedIds.has(contactId)) {
      selectedIds.delete(contactId);
    } else {
      selectedIds.add(contactId);
    }

    this.patchEditDraft({ assignedContactIds: [...selectedIds] });
  }

  /** Prüft, ob ein Kontakt im Edit-Formular ausgewählt ist. */
  isEditContactSelected(contactId: string | undefined): boolean {
    return Boolean(contactId && this.editDraft().assignedContactIds.includes(contactId));
  }

  /** Label für die Assigned-To-Auswahl. */
  editAssignedLabel(): string {
    const assignedIds = this.editDraft().assignedContactIds;

    if (assignedIds.length === 0) {
      return 'Select contacts to assign';
    }

    return assignedIds.map((contactId) => this.assigneeInitials(contactId)).join(', ');
  }

  /** Patcht den Edit-Draft. */
  private patchEditDraft(partial: Partial<EditTaskDraft>): void {
    this.editDraft.update((draft) => ({ ...draft, ...partial }));
  }

  /** Liest den Wert eines Inputs/Selects/Textareas. */
  private inputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
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

  showAddTaskModal = false;

  onTaskCreated(task: Task): void {
    this.showAddTaskModal = false;
  }

  private router = inject(Router);
  isMobile = window.innerWidth < 1060;

  @HostListener('window:resize')
  onResize(): void {
    this.isMobile = window.innerWidth < 1060;
  }

  openAddTask(): void {
    if (this.isMobile) {
      this.router.navigate(['/add-task']);
    } else {
      this.showAddTaskModal = true;
    }
  }
}