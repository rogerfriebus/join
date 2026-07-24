import { computed, signal } from '@angular/core';
import { Contact } from '../../core/models/contact.model';
import { Subtask, Task, TaskCategory, TaskPriority } from '../../core/models/task.model';
import { BoardDragController } from './board-drag.controller';
import { EditTaskDraft } from './board.models';
import {
  buildUpdatedTask,
  createEditDraft,
  createEditSubtask,
  createEmptyEditDraft,
  formatDateForInput,
  inputValue,
  renameSubtask,
  toggleListItem,
  toggleSubtask,
} from './board.utils';

/** Task-edit state and interactions used by the board component. */
export abstract class BoardEditController extends BoardDragController {
  /** Task currently being edited. */
  readonly editTask = signal<Task | null>(null);

  /** Local form state for the edit overlay. */
  readonly editDraft = signal<EditTaskDraft>(createEmptyEditDraft());

  /** Indicates whether saving has already been attempted. */
  readonly editSubmitted = signal(false);

  /** Indicates whether the due date has been changed. */
  readonly editDueDateTouched = signal(false);

  /** Controls the Assigned To dropdown. */
  readonly editAssigneeDropdownOpen = signal(false);

  /** Controls the category dropdown. */
  readonly editCategoryDropdownOpen = signal(false);

  /** ID of the subtask currently being edited. */
  readonly editingEditSubtaskId = signal<string | null>(null);

  /** Temporary text of the subtask currently being edited. */
  readonly editingEditSubtaskValue = signal('');

  /** Current date formatted for the date input. */
  readonly today = formatDateForInput(new Date());

  /** Indicates whether the selected due date is in the past. */
  readonly editDueDateIsPast = computed(() => {
    const dueDate = this.editDraft().dueDate.trim();
    return Boolean(dueDate && dueDate < this.today);
  });

  /** Indicates whether the edit form is valid. */
  readonly editFormIsValid = computed(() => {
    const draft = this.editDraft();
    return Boolean(
      draft.title.trim() &&
        draft.dueDate.trim() &&
        draft.category &&
        !this.editDueDateIsPast(),
    );
  });

  /** Opens the edit overlay with isolated task data. */
  openTaskEdit(task: Task): void {
    this.resetEditUiState();
    this.editTask.set(task);
    this.editDraft.set(createEditDraft(task));
  }

  /** Closes the edit overlay and clears its state. */
  closeTaskEdit(): void {
    this.editTask.set(null);
    this.resetEditUiState();
    this.editDraft.set(createEmptyEditDraft());
  }

  /** Deletes the currently selected task. */
  async deleteSelectedTask(): Promise<void> {
    const task = this.selectedTask();
    if (!task) return;
    const deleted = await this.taskService.deleteTask(task.id);
    if (deleted) this.closeAllTaskOverlays();
  }

  /** Saves changes made in the edit overlay. */
  async saveTaskEdit(): Promise<void> {
    this.editSubmitted.set(true);
    this.applyPendingSubtaskEdit();
    const updatedTask = this.createValidUpdatedTask();
    if (!updatedTask) return;
    await this.persistTaskEdit(updatedTask);
  }

  /** Updates the title in the edit form. */
  updateEditTitle(event: Event): void {
    this.patchEditDraft({ title: inputValue(event) });
  }

  /** Updates the description in the edit form. */
  updateEditDescription(event: Event): void {
    this.patchEditDraft({ description: inputValue(event) });
  }

  /** Updates the due date in the edit form. */
  updateEditDueDate(event: Event): void {
    this.editDueDateTouched.set(true);
    this.patchEditDraft({ dueDate: inputValue(event) });
  }

  /** Updates the category in the edit form. */
  updateEditCategory(event: Event): void {
    this.patchEditDraft({ category: inputValue(event) as TaskCategory | '' });
  }

  /** Sets the priority in the edit form. */
  setEditPriority(priority: TaskPriority): void {
    this.patchEditDraft({ priority });
  }

  /** Updates the new-subtask input. */
  updateEditNewSubtaskTitle(event: Event): void {
    this.patchEditDraft({ newSubtaskTitle: inputValue(event) });
  }

  /** Adds a new subtask to the edit form. */
  addEditSubtask(): void {
    const draft = this.editDraft();
    const title = draft.newSubtaskTitle.trim();
    if (!title) return;
    const taskId = this.editTask()?.id ?? 'task';
    const subtask = createEditSubtask(taskId, title);
    this.patchEditDraft({ subtasks: [...draft.subtasks, subtask], newSubtaskTitle: '' });
  }

  /** Clears the new-subtask input. */
  clearEditSubtaskInput(): void {
    this.patchEditDraft({ newSubtaskTitle: '' });
  }

  /** Starts editing an existing subtask. */
  startEditSubtaskText(subtask: Subtask): void {
    this.editingEditSubtaskId.set(subtask.id);
    this.editingEditSubtaskValue.set(subtask.title);
  }

  /** Updates the temporary subtask text. */
  updateEditingEditSubtaskValue(event: Event): void {
    this.editingEditSubtaskValue.set(inputValue(event));
  }

  /** Applies the edited text to a subtask. */
  confirmEditSubtaskText(subtaskId: string): void {
    const title = this.editingEditSubtaskValue().trim();
    if (title) this.renameEditSubtask(subtaskId, title);
    this.clearSubtaskTextEditor();
  }

  /** Deletes the subtask currently open in text-edit mode. */
  deleteEditingEditSubtask(subtaskId: string): void {
    this.removeEditSubtask(subtaskId);
    this.clearSubtaskTextEditor();
  }

  /** Removes a subtask from the edit form. */
  removeEditSubtask(subtaskId: string): void {
    const subtasks = this.editDraft().subtasks.filter((subtask) => subtask.id !== subtaskId);
    this.patchEditDraft({ subtasks });
  }

  /** Changes the completion status of a subtask. */
  toggleEditSubtaskDone(subtaskId: string): void {
    this.patchEditDraft({ subtasks: toggleSubtask(this.editDraft().subtasks, subtaskId) });
  }

  /** Opens or closes the Assigned To dropdown. */
  toggleEditAssigneeDropdown(): void {
    this.editCategoryDropdownOpen.set(false);
    this.editAssigneeDropdownOpen.update((open) => !open);
  }

  /** Opens or closes the category dropdown. */
  toggleEditCategoryDropdown(): void {
    this.editAssigneeDropdownOpen.set(false);
    this.editCategoryDropdownOpen.update((open) => !open);
  }

  /** Selects a category and closes its dropdown. */
  selectEditCategory(category: TaskCategory): void {
    this.patchEditDraft({ category });
    this.editCategoryDropdownOpen.set(false);
  }

  /** Returns the selected category label. */
  editCategoryLabel(): string {
    return this.editDraft().category || '';
  }

  /** Returns contacts selected in the edit overlay. */
  editAssignedContacts(): Contact[] {
    const selectedIds = new Set(this.editDraft().assignedContactIds);
    return this.contacts().filter((contact) => Boolean(contact.id && selectedIds.has(contact.id)));
  }

  /** Limits visible edit-form avatars. */
  visibleEditAssignedContacts(maxVisible = 6): Contact[] {
    return this.editAssignedContacts().slice(0, maxVisible);
  }

  /** Returns the number of hidden edit-form contacts. */
  hiddenEditAssigneeCount(maxVisible = 6): number {
    return Math.max(this.editAssignedContacts().length - maxVisible, 0);
  }

  /** Selects or removes a contact in the Assigned To field. */
  toggleEditAssignedContact(contactId: string | undefined): void {
    if (!contactId) return;
    const ids = toggleListItem(this.editDraft().assignedContactIds, contactId);
    this.patchEditDraft({ assignedContactIds: ids });
  }

  /** Checks whether a contact is selected. */
  isEditContactSelected(contactId: string | undefined): boolean {
    return Boolean(contactId && this.editDraft().assignedContactIds.includes(contactId));
  }

  /** Returns the Assigned To selection label. */
  editAssignedLabel(): string {
    const ids = this.editDraft().assignedContactIds;
    return ids.length
      ? ids.map((id) => this.assigneeInitials(id)).join(', ')
      : 'Select contacts to assign';
  }

  /** Applies a partial update to the edit draft. */
  protected patchEditDraft(partial: Partial<EditTaskDraft>): void {
    this.editDraft.update((draft) => ({ ...draft, ...partial }));
  }

  private resetEditUiState(): void {
    this.editSubmitted.set(false);
    this.editDueDateTouched.set(false);
    this.editAssigneeDropdownOpen.set(false);
    this.editCategoryDropdownOpen.set(false);
    this.clearSubtaskTextEditor();
  }

  private clearSubtaskTextEditor(): void {
    this.editingEditSubtaskId.set(null);
    this.editingEditSubtaskValue.set('');
  }

  private closeAllTaskOverlays(): void {
    this.closeTaskDetail();
    this.closeTaskEdit();
  }

  private applyPendingSubtaskEdit(): void {
    const subtaskId = this.editingEditSubtaskId();
    if (subtaskId) this.confirmEditSubtaskText(subtaskId);
  }

  private createValidUpdatedTask(): Task | null {
    const task = this.editTask();
    const draft = this.editDraft();
    if (!task || !draft.category || !this.editFormIsValid()) return null;
    return buildUpdatedTask(task, draft);
  }

  private async persistTaskEdit(task: Task): Promise<void> {
    const savedTask = await this.taskService.updateTask(task);
    if (savedTask) this.closeAllTaskOverlays();
  }

  private renameEditSubtask(subtaskId: string, title: string): void {
    const subtasks = renameSubtask(this.editDraft().subtasks, subtaskId, title);
    this.patchEditDraft({ subtasks });
  }
}
