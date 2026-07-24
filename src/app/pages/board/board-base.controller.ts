import { computed, Directive, inject, OnInit, signal } from '@angular/core';
import { Contact } from '../../core/models/contact.model';
import { Subtask, Task, TaskStatus } from '../../core/models/task.model';
import { ContactService } from '../../core/services/contact.service';
import { TaskService } from '../../core/services/task.service';
import {
  BOARD_COLUMNS,
  BoardColumn,
  BoardColumnView,
  MobileMoveOption,
} from './board.models';
import {
  contactsToMap,
  createDescriptionPreview,
  initialsFromName,
  inputValue,
  mobileMoveOptions,
  priorityLabel,
  taskMatchesQuery,
} from './board.utils';

/** Shared board state and read-only view helpers. */
@Directive()
export abstract class BoardBaseController implements OnInit {
  protected readonly taskService = inject(TaskService);
  protected readonly contactService = inject(ContactService);

  /** Read-only task signal exposed by the TaskService facade. */
  readonly tasks = this.taskService.tasks;

  /** Read-only contact signal exposed by the ContactService facade. */
  readonly contacts = this.contactService.contacts;

  /** Task currently selected for the detail view. */
  readonly selectedTask = signal<Task | null>(null);

  /** Task currently being moved by drag and drop. */
  readonly draggedTask = signal<Task | null>(null);

  /** Status of the column currently acting as the drop target. */
  readonly dragTargetStatus = signal<TaskStatus | null>(null);

  /** Currently opened mobile move menu. */
  readonly openedMobileMoveMenuTaskId = signal<string | null>(null);

  /** Current board search query. */
  readonly searchQuery = signal('');

  /** Normalized search query used for comparisons. */
  readonly normalizedSearchQuery = computed(() => this.searchQuery().trim().toLowerCase());

  /** Indicates whether a search query is active. */
  readonly hasSearchQuery = computed(() => this.normalizedSearchQuery().length > 0);

  /** Contacts mapped by ID for fast assignee lookups. */
  readonly contactsById = computed(() => contactsToMap(this.contacts()));

  /** The four Kanban columns in their fixed order. */
  readonly columns: readonly BoardColumn[] = BOARD_COLUMNS;

  /** Tasks filtered by the current search query. */
  readonly filteredTasks = computed(() => {
    const query = this.normalizedSearchQuery();
    return query ? this.tasks().filter((task) => taskMatchesQuery(task, query)) : this.tasks();
  });

  /** Reactive grouping of filtered tasks by status. */
  readonly board = computed<BoardColumnView[]>(() =>
    this.columns.map((column) => ({
      ...column,
      tasks: this.filteredTasks().filter((task) => task.status === column.status),
    })),
  );

  /** Indicates whether the current search returns any results. */
  readonly hasSearchResults = computed(() =>
    this.board().some((column) => column.tasks.length > 0),
  );

  /** Loads tasks and contacts when the board opens. */
  async ngOnInit(): Promise<void> {
    await Promise.all([this.taskService.loadTasks(), this.contactService.loadContacts()]);
  }

  /** Updates the search query while typing. */
  updateSearchQuery(event: Event): void {
    this.searchQuery.set(inputValue(event));
  }

  /** Clears the current search query. */
  clearSearchQuery(): void {
    this.searchQuery.set('');
  }

  /** Returns the empty-state text for a column. */
  columnEmptyText(column: BoardColumnView): string {
    return this.hasSearchQuery() ? 'No matching tasks' : column.emptyText;
  }

  /** Returns the shortened description shown on a task card. */
  descriptionPreview(description: string | undefined): string {
    return createDescriptionPreview(description);
  }

  /** Returns the number of completed subtasks. */
  doneSubtasks(task: Task): number {
    return task.subtasks.filter((subtask) => subtask.done).length;
  }

  /** Updates a subtask directly from the detail view. */
  async toggleDetailSubtask(task: Task, subtask: Subtask): Promise<void> {
    const updatedTask = await this.taskService.updateSubtaskStatus(
      task.id,
      subtask.id,
      !subtask.done,
    );
    if (updatedTask) this.selectedTask.set(updatedTask);
  }

  /** Returns the assignee IDs visible on a task card. */
  visibleAssigneeIds(task: Task, maxVisible = 6): string[] {
    return task.assignedContactIds.slice(0, maxVisible);
  }

  /** Returns the number of hidden assignees. */
  hiddenAssigneeCount(task: Task, maxVisible = 6): number {
    return Math.max(task.assignedContactIds.length - maxVisible, 0);
  }

  /** Returns the initials of an assigned contact. */
  assigneeInitials(contactId: string): string {
    const contact = this.contactsById().get(contactId);
    if (contact?.initials) return contact.initials;
    return contact?.name ? initialsFromName(contact.name) : '?';
  }

  /** Returns the name of an assigned contact. */
  assigneeName(contactId: string): string {
    return this.contactsById().get(contactId)?.name ?? 'Unknown contact';
  }

  /** Returns the avatar color of an assigned contact. */
  assigneeColor(contactId: string): string {
    return this.contactsById().get(contactId)?.color ?? '#ff7a00';
  }

  /** Returns initials for a contact in the edit overlay. */
  contactInitials(contact: Contact): string {
    return contact.initials ?? initialsFromName(contact.name);
  }

  /** Returns a readable priority label. */
  priorityLabel(priority: Task['priority']): string {
    return priorityLabel(priority);
  }

  /** Opens the detail view for a task. */
  openTaskDetail(task: Task): void {
    this.closeMobileMoveMenu();
    this.selectedTask.set(task);
  }

  /** Closes the task detail view. */
  closeTaskDetail(): void {
    this.selectedTask.set(null);
  }

  /** Opens or closes the mobile move menu. */
  toggleMobileMoveMenu(taskId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.openedMobileMoveMenuTaskId.update((openId) => (openId === taskId ? null : taskId));
  }

  /** Closes the mobile move menu. */
  closeMobileMoveMenu(): void {
    this.openedMobileMoveMenuTaskId.set(null);
  }

  /** Returns available neighbouring move targets. */
  mobileMoveOptions(task: Task): MobileMoveOption[] {
    return mobileMoveOptions(task, this.columns);
  }

  /** Moves a task through the mobile menu. */
  async moveTaskToStatus(task: Task, status: TaskStatus, event: MouseEvent): Promise<void> {
    event.stopPropagation();
    this.closeMobileMoveMenu();
    if (task.status !== status) await this.taskService.updateTaskStatus(task.id, status);
  }
}
