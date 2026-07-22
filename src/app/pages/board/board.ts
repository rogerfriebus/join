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


/** Configuration for a board column. */
interface BoardColumn {
  title: string;
  status: TaskStatus;
  emptyText: string;
}

/** Board column including its filtered tasks. */
interface BoardColumnView extends BoardColumn {
  tasks: Task[];
}

/** Option displayed in the mobile move-to menu. */
interface MobileMoveOption {
  status: TaskStatus;
  label: string;
  direction: 'up' | 'down';
}

/** Local form state for the edit overlay. */
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

function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
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

  /** Read-only task signal exposed by the TaskService facade. */
  readonly tasks = this.taskService.tasks;

  /** Read-only contact signal exposed by the ContactService facade. */
  readonly contacts = this.contactService.contacts;

  /** Task currently selected for the detail view. */
  readonly selectedTask = signal<Task | null>(null);

  /** Task currently being edited in the edit overlay. */
  readonly editTask = signal<Task | null>(null);

  /** Form state for the edit overlay. */
  readonly editDraft = signal<EditTaskDraft>(createEmptyEditDraft());

  /** Indicates whether saving has already been attempted in the edit overlay. */
  readonly editSubmitted = signal(false);

  /** Indicates whether the due date has been changed in the edit form. */
  readonly editDueDateTouched = signal(false);

  /** Controls visibility of the Assigned To dropdown in the edit overlay. */
  readonly editAssigneeDropdownOpen = signal(false);

  /** Controls visibility of the category dropdown in the edit overlay. */
  readonly editCategoryDropdownOpen = signal(false);

  /** ID of the subtask currently being edited in the edit overlay. */
  readonly editingEditSubtaskId = signal<string | null>(null);

  /** Temporary text of the subtask currently being edited. */
  readonly editingEditSubtaskValue = signal('');

  /** Current date formatted for the native date input. */
  readonly today = formatDateForInput(new Date());

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

  /** Contacts mapped by ID so assignedContactIds can be resolved efficiently. */
  readonly contactsById = computed(() => {
    const map = new Map<string, Contact>();

    for (const contact of this.contacts()) {
      if (contact.id) {
        map.set(contact.id, contact);
      }
    }

    return map;
  });

  /** Indicates whether the selected due date is in the past. */
  readonly editDueDateIsPast = computed(() => {
    const dueDate = this.editDraft().dueDate.trim();

    return Boolean(dueDate && dueDate < this.today);
  });

  /** Indicates whether the edit form is currently valid. */
  readonly editFormIsValid = computed(() => {
    const draft = this.editDraft();

    return Boolean(
      draft.title.trim() &&
      draft.dueDate.trim() &&
      draft.category &&
      !this.editDueDateIsPast()
    );
  });

  /** The four Kanban columns in their fixed order. */
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

  /** Tasks filtered by the current search query. */
  readonly filteredTasks = computed(() => {
    const query = this.normalizedSearchQuery();

    if (!query) {
      return this.tasks();
    }

    return this.tasks().filter((task) => this.taskMatchesQuery(task, query));
  });

  /** Reactive grouping of filtered tasks by status for each column. */
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

  /** Loads tasks and contacts through their service facades when the board opens. */
  async ngOnInit(): Promise<void> {
    await Promise.all([this.taskService.loadTasks(), this.contactService.loadContacts()]);
  }

  /** Updates the search query while typing in the search field. */
  updateSearchQuery(event: Event): void {
    this.searchQuery.set(this.inputValue(event));
  }

  /** Clears the current search query. */
  clearSearchQuery(): void {
    this.searchQuery.set('');
  }

  /** Checks whether a task matches the current search query. */
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

  /** Empty-state text for each column. */
  columnEmptyText(column: BoardColumnView): string {
    if (this.hasSearchQuery()) {
      return 'No matching tasks';
    }

    return column.emptyText;
  }

  /** Short description preview displayed on the task card. */
  descriptionPreview(description: string | undefined): string {
    if (!description) {
      return '';
    }

    const max = 80;
    return description.length > max ? `${description.slice(0, max).trimEnd()}…` : description;
  }

  /** Number of completed subtasks for a task. */
  doneSubtasks(task: Task): number {
    return task.subtasks.filter((subtask) => subtask.done).length;
  }

  /** Updates a subtask status directly from the task detail view. */
  async toggleDetailSubtask(task: Task, subtask: Subtask): Promise<void> {
    const updatedTask = await this.taskService.updateSubtaskStatus(
      task.id,
      subtask.id,
      !subtask.done,
    );

    if (updatedTask) {
      this.selectedTask.set(updatedTask);
    }
  }

  /** Returns the assignee IDs visible on the task card. */
  visibleAssigneeIds(task: Task, maxVisible = 6): string[] {
    return task.assignedContactIds.slice(0, maxVisible);
  }

  /** Returns the number of additional hidden assignees. */
  hiddenAssigneeCount(task: Task, maxVisible = 6): number {
    return Math.max(task.assignedContactIds.length - maxVisible, 0);
  }

  /** Returns the initials of an assigned contact. */
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
    return contact.initials ?? this.initialsFromName(contact.name);
  }

  /** Builds initials from a name. */
  private initialsFromName(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  /** Returns a readable label for the priority display. */
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

  /** Opens the detail view for a task. */
  openTaskDetail(task: Task): void {
    this.closeMobileMoveMenu();
    this.selectedTask.set(task);
  }

  /** Closes the task detail view. */
  closeTaskDetail(): void {
    this.selectedTask.set(null);
  }

  /** Opens or closes the mobile move-to menu for a task. */
  toggleMobileMoveMenu(taskId: string, event: MouseEvent): void {
    event.stopPropagation();

    this.openedMobileMoveMenuTaskId.update((openedTaskId) =>
      openedTaskId === taskId ? null : taskId,
    );
  }

  /** Closes the mobile move-to menu. */
  closeMobileMoveMenu(): void {
    this.openedMobileMoveMenuTaskId.set(null);
  }

  /** Returns the available mobile move targets for a task. */
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

  /** Returns readable labels for the mobile move menu. */
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

  /** Moves a task to another status through the mobile move menu. */
  async moveTaskToStatus(task: Task, status: TaskStatus, event: MouseEvent): Promise<void> {
    event.stopPropagation();

    this.closeMobileMoveMenu();

    if (task.status === status) {
      return;
    }

    await this.taskService.updateTaskStatus(task.id, status);
  }

  /** Opens the edit overlay for a task. */
  openTaskEdit(task: Task): void {
    this.editSubmitted.set(false);
    this.editDueDateTouched.set(false);
    this.editAssigneeDropdownOpen.set(false);
    this.editCategoryDropdownOpen.set(false);
    this.editingEditSubtaskId.set(null);
    this.editingEditSubtaskValue.set('');
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

  /** Closes the edit overlay. */
  closeTaskEdit(): void {
    this.editTask.set(null);
    this.editSubmitted.set(false);
    this.editDueDateTouched.set(false);
    this.editAssigneeDropdownOpen.set(false);
    this.editCategoryDropdownOpen.set(false);
    this.editingEditSubtaskId.set(null);
    this.editingEditSubtaskValue.set('');
    this.editDraft.set(createEmptyEditDraft());
  }

  /** Deletes the currently selected task. */
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

  /** Saves changes made in the edit overlay. */
  async saveTaskEdit(): Promise<void> {
    this.editSubmitted.set(true);

    const editingSubtaskId = this.editingEditSubtaskId();

    if (editingSubtaskId) {
      this.confirmEditSubtaskText(editingSubtaskId);
    }

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

  /** Updates the title in the edit form. */
  updateEditTitle(event: Event): void {
    this.patchEditDraft({ title: this.inputValue(event) });
  }

  /** Updates the description in the edit form. */
  updateEditDescription(event: Event): void {
    this.patchEditDraft({ description: this.inputValue(event) });
  }

  /** Updates the due date in the edit form. */
  updateEditDueDate(event: Event): void {
    this.editDueDateTouched.set(true);
    this.patchEditDraft({ dueDate: this.inputValue(event) });
  }

  /** Updates the category in the edit form. */
  updateEditCategory(event: Event): void {
    this.patchEditDraft({ category: this.inputValue(event) as TaskCategory | '' });
  }

  /** Sets the priority in the edit form. */
  setEditPriority(priority: TaskPriority): void {
    this.patchEditDraft({ priority });
  }

  /** Updates the input value for a new subtask. */
  updateEditNewSubtaskTitle(event: Event): void {
    this.patchEditDraft({ newSubtaskTitle: this.inputValue(event) });
  }

  /** Adds a new subtask to the edit form. */
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

  /** Clears the new-subtask input. */
  clearEditSubtaskInput(): void {
    this.patchEditDraft({ newSubtaskTitle: '' });
  }

  /** Starts editing the text of an existing subtask. */
  startEditSubtaskText(subtask: Subtask): void {
    this.editingEditSubtaskId.set(subtask.id);
    this.editingEditSubtaskValue.set(subtask.title);
  }

  /** Updates the temporary text of the subtask being edited. */
  updateEditingEditSubtaskValue(event: Event): void {
    this.editingEditSubtaskValue.set(this.inputValue(event));
  }

  /** Applies the edited text to an existing subtask. */
  confirmEditSubtaskText(subtaskId: string): void {
    const title = this.editingEditSubtaskValue().trim();

    if (title) {
      this.patchEditDraft({
        subtasks: this.editDraft().subtasks.map((subtask) =>
          subtask.id === subtaskId ? { ...subtask, title } : subtask,
        ),
      });
    }

    this.editingEditSubtaskId.set(null);
    this.editingEditSubtaskValue.set('');
  }

  /** Deletes the subtask currently open in text-edit mode. */
  deleteEditingEditSubtask(subtaskId: string): void {
    this.removeEditSubtask(subtaskId);
    this.editingEditSubtaskId.set(null);
    this.editingEditSubtaskValue.set('');
  }

  /** Removes a subtask from the edit form. */
  removeEditSubtask(subtaskId: string): void {
    this.patchEditDraft({
      subtasks: this.editDraft().subtasks.filter((subtask) => subtask.id !== subtaskId),
    });
  }

  /** Changes the completion status of a subtask in the edit form. */
  toggleEditSubtaskDone(subtaskId: string): void {
    this.patchEditDraft({
      subtasks: this.editDraft().subtasks.map((subtask) =>
        subtask.id === subtaskId ? { ...subtask, done: !subtask.done } : subtask,
      ),
    });
  }

  /** Opens or closes the Assigned To dropdown in the edit overlay. */
  toggleEditAssigneeDropdown(): void {
    this.editCategoryDropdownOpen.set(false);
    this.editAssigneeDropdownOpen.update((open) => !open);
  }

  /** Opens or closes the category dropdown in the edit overlay. */
  toggleEditCategoryDropdown(): void {
    this.editAssigneeDropdownOpen.set(false);
    this.editCategoryDropdownOpen.update((open) => !open);
  }

  /** Selects a category and closes the category dropdown. */
  selectEditCategory(category: TaskCategory): void {
    this.patchEditDraft({ category });
    this.editCategoryDropdownOpen.set(false);
  }

  /** Returns the readable label of the selected category. */
  editCategoryLabel(): string {
    return this.editDraft().category || '';
  }

  /** Returns contacts selected in the edit overlay for the avatar display. */
  editAssignedContacts(): Contact[] {
    const selectedIds = new Set(this.editDraft().assignedContactIds);
    return this.contacts().filter((contact) => Boolean(contact.id && selectedIds.has(contact.id)));
  }

  /** Limits visible edit-form avatars in the same way as board cards. */
  visibleEditAssignedContacts(maxVisible = 6): Contact[] {
    return this.editAssignedContacts().slice(0, maxVisible);
  }

  /** Returns the number of additional hidden contacts in the edit form. */
  hiddenEditAssigneeCount(maxVisible = 6): number {
    return Math.max(this.editAssignedContacts().length - maxVisible, 0);
  }

  /** Selects or removes a contact in the Assigned To field. */
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

  /** Checks whether a contact is selected in the edit form. */
  isEditContactSelected(contactId: string | undefined): boolean {
    return Boolean(contactId && this.editDraft().assignedContactIds.includes(contactId));
  }

  /** Returns the label for the Assigned To selection. */
  editAssignedLabel(): string {
    const assignedIds = this.editDraft().assignedContactIds;

    if (assignedIds.length === 0) {
      return 'Select contacts to assign';
    }

    return assignedIds.map((contactId) => this.assigneeInitials(contactId)).join(', ');
  }

  /** Applies a partial update to the edit draft. */
  private patchEditDraft(partial: Partial<EditTaskDraft>): void {
    this.editDraft.update((draft) => ({ ...draft, ...partial }));
  }

  /** Reads the value from an input, select, or textarea event. */
  private inputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
  }

  /** Starts dragging a task card. */
  startTaskDrag(task: Task, event: DragEvent): void {
    this.draggedTask.set(task);

    event.dataTransfer?.setData('text/plain', task.id);

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  /** Marks a column as the current drop target. */
  setDragTarget(status: TaskStatus): void {
    if (!this.draggedTask()) {
      return;
    }

    this.dragTargetStatus.set(status);
  }

  /** Removes the visual drop-target indicator. */
  clearDragTarget(): void {
    this.dragTargetStatus.set(null);
  }

  /** Ends the drag operation without changing the task status. */
  endTaskDrag(): void {
    this.draggedTask.set(null);
    this.dragTargetStatus.set(null);
  }

  /** Moves a task to another board column. */
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