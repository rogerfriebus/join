import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ContactService } from '../../core/services/contact.service';
import { Contact } from '../../core/models/contact.model';
import { TaskService } from '../../core/services/task.service';
import { Task, Subtask, TaskPriority, TaskCategory } from '../../core/models/task.model';


/** Option for the category dropdown. */
interface CategoryOption {
  id: TaskCategory;
  label: string;
}

/**
 * Page for creating a new task.
 *
 * Contains the complete form with title, description, due date,
 * priority, contact assignment, category, and subtasks.
 * After successfully saving, the user is redirected to the board.
 */
@Component({
  selector: 'app-add-task',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-task.html',
  styleUrl: './add-task.scss',
})
export class AddTask {
  /** Today's date formatted for the native date input (YYYY-MM-DD). */
  readonly today: string = new Date().toISOString().split('T')[0];

  private router = inject(Router);
  private contactService = inject(ContactService);
  private taskService = inject(TaskService);

  /** All available contacts for the assignee selection. */
  readonly contacts: Contact[] = this.contactService.getContacts();

  /** Available categories for the category dropdown. */
  readonly categories: CategoryOption[] = [
    { id: 'Technical Task', label: 'Technical Task' },
    { id: 'User Story', label: 'User Story' },
  ];

  /** Current form state. */
  form = {
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium' as TaskPriority,
    assignedTo: [] as string[],
    category: '' as TaskCategory | '',
    subtasks: [] as string[],
  };

  /** Input value for a new subtask. */
  newSubtask = '';

  /** Indicates whether the save process is currently running (prevents duplicate submissions). */
  isSaving = false;

  /** Visibility state of the assignee dropdown. */
  showAssigneeDropdown = false;

  /** Visibility state of the category dropdown. */
  showCategoryDropdown = false;

  /** Index of the subtask currently being edited, or null. */
  editingSubtaskIndex: number | null = null;

  /** Temporary value of the subtask currently being edited. */
  editingSubtaskValue = '';

  /** Indicates whether the selected due date is in the past. */
  dueDateError = false;

  /** Maximum number of visible assignee avatars in the dropdown field. */
  readonly maxVisibleAssignees = 6;

  /** Sets the task priority. */
  setPriority(priority: TaskPriority): void {
    this.form.priority = priority;
  }

  /** Selects or removes a contact from the assignee list. */
  toggleAssignee(contactId: string): void {
    const index = this.form.assignedTo.indexOf(contactId);
    if (index === -1) {
      this.form.assignedTo.push(contactId);
    } else {
      this.form.assignedTo.splice(index, 1);
    }
  }

  /** Checks whether a contact is currently assigned. */
  isAssigned(contactId: string): boolean {
    return this.form.assignedTo.includes(contactId);
  }

  /** Returns the initials derived from a full name. */
  getInitials(name: string): string {
    return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  }

  /** Resets the form to its initial state. */
  clear(): void {
    this.form = {
      title: '',
      description: '',
      dueDate: '',
      priority: 'medium',
      assignedTo: [],
      category: '',
      subtasks: [],
    };
    this.newSubtask = '';
    this.dueDateError = false;
  }

  /**
   * Creates a new task and redirects to the board on success.
   * Aborts if required fields are missing or a save operation is already in progress.
   */
  async createTask(): Promise<void> {
    if (!this.form.title || !this.form.dueDate || !this.form.category || this.isSaving) {
      return;
    }

    const subtasks: Subtask[] = this.form.subtasks.map((title) => ({
      id: '',
      title,
      done: false,
    }));

    const newTask: Task = {
      id: '',
      title: this.form.title.trim(),
      description: this.form.description.trim() || undefined,
      dueDate: this.form.dueDate,
      priority: this.form.priority,
      category: this.form.category,
      status: 'todo',
      assignedContactIds: [...this.form.assignedTo],
      subtasks,
    };

    this.isSaving = true;
    try {
      this.clear();
      await this.taskService.addTask(newTask);
      this.router.navigate(['/board']);
    } catch (error) {
      console.error('Task could not be created:', error);
    } finally {
      this.isSaving = false;
    }
  }

  /** Toggles the assignee dropdown (and closes the category dropdown if open). */
  toggleAssigneeDropdown(): void {
    if (this.showCategoryDropdown) this.showCategoryDropdown = false;
    this.showAssigneeDropdown = !this.showAssigneeDropdown;
  }

  /** Toggles the category dropdown (and closes the assignee dropdown if open). */
  toggleCategoryDropdown(): void {
    if (this.showAssigneeDropdown) this.showAssigneeDropdown = false;
    this.showCategoryDropdown = !this.showCategoryDropdown;
  }

  /** Selects a category and closes the dropdown. */
  selectCategory(category: CategoryOption): void {
    this.form.category = category.id;
    this.showCategoryDropdown = false;
  }

  /** Returns the display label of the currently selected category. */
  getCategoryLabel(): string {
    return this.categories.find((c) => c.id === this.form.category)?.label ?? '';
  }

  /** Returns the full contact objects of all assigned contacts. */
  getAssignedContacts(): Contact[] {
    return this.contacts.filter((c) => c.id && this.form.assignedTo.includes(c.id));
  }

  /** Closes all dropdowns when clicking outside of a dropdown element. */
  @HostListener('document:click', ['$event'])
  closeDropdownOnOutsideClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown')) {
      this.showAssigneeDropdown = false;
      this.showCategoryDropdown = false;
    }
  }

  /** Adds the current subtask input to the list. */
  addSubtask(): void {
    const value = this.newSubtask.trim();
    if (!value) return;
    this.form.subtasks.push(value);
    this.newSubtask = '';
  }

  /** Clears the subtask input field. */
  clearSubtaskInput(): void {
    this.newSubtask = '';
  }

  /** Removes a subtask by its index. */
  removeSubtask(index: number): void {
    this.form.subtasks.splice(index, 1);
  }

  /** Starts inline editing for an existing subtask. */
  startEditSubtask(index: number): void {
    this.editingSubtaskIndex = index;
    this.editingSubtaskValue = this.form.subtasks[index];
  }

  /** Applies the edited subtask text and exits edit mode. */
  confirmEditSubtask(index: number): void {
    const value = this.editingSubtaskValue.trim();
    if (value) {
      this.form.subtasks[index] = value;
    }
    this.editingSubtaskIndex = null;
  }

  /** Deletes the subtask currently being edited. */
  deleteEditingSubtask(index: number): void {
    this.form.subtasks.splice(index, 1);
    this.editingSubtaskIndex = null;
  }

  /** Validates whether the selected due date is in the past. */
  validateDueDate(): void {
    if (this.form.dueDate && this.form.dueDate < this.today) {
      this.dueDateError = true;
    } else {
      this.dueDateError = false;
    }
  }

  /** Returns the visible assigned contacts (limited to maxVisibleAssignees). */
  getVisibleAssignedContacts(): Contact[] {
    return this.getAssignedContacts().slice(0, this.maxVisibleAssignees);
  }

  /** Returns the number of hidden assignees. */
  getHiddenAssigneeCount(): number {
    return Math.max(this.getAssignedContacts().length - this.maxVisibleAssignees, 0);
  }
}