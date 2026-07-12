import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactService } from '../../core/services/contact.service';
import { Contact } from '../../core/models/contact.model';
import { TaskService } from '../../core/services/task.service';
import { Task, Subtask, TaskPriority, TaskCategory } from '../../core/models/task.model';

interface CategoryOption {
  id: TaskCategory;
  label: string;
}

@Component({
  selector: 'app-add-task',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-task.html',
  styleUrl: './add-task.scss',
})
export class AddTask {
  readonly today: string = new Date().toISOString().split('T')[0];

  private contactService = inject(ContactService);
  private taskService = inject(TaskService);

  readonly contacts: Contact[] = this.contactService.getContacts();

  readonly categories: CategoryOption[] = [
    { id: 'Technical Task', label: 'Technical Task' },
    { id: 'User Story', label: 'User Story' },
  ];

  form = {
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium' as TaskPriority,
    assignedTo: [] as string[],
    category: '' as TaskCategory | '',
    subtasks: [] as string[],
  };

  newSubtask = '';
  isSaving = false;

  setPriority(priority: TaskPriority): void {
    this.form.priority = priority;
  }

  toggleAssignee(contactId: string): void {
    const index = this.form.assignedTo.indexOf(contactId);
    if (index === -1) {
      this.form.assignedTo.push(contactId);
    } else {
      this.form.assignedTo.splice(index, 1);
    }
  }

  isAssigned(contactId: string): boolean {
    return this.form.assignedTo.includes(contactId);
  }

  getInitials(name: string): string {
    return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  }

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
  }

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
      id: '', // wird im TaskService generiert
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
    } catch (error) {
      console.error('Task konnte nicht erstellt werden:', error);
    } finally {
      this.isSaving = false;
    }
  }

  showAssigneeDropdown = false;
  showCategoryDropdown = false;

  toggleAssigneeDropdown(): void {
    if(this.showCategoryDropdown) this.showCategoryDropdown = false;
    this.showAssigneeDropdown = !this.showAssigneeDropdown;
  }

  toggleCategoryDropdown(): void {
    if(this.showAssigneeDropdown) this.showAssigneeDropdown = false;
    this.showCategoryDropdown = !this.showCategoryDropdown;
  }

  selectCategory(category: CategoryOption): void {
    this.form.category = category.id;
    this.showCategoryDropdown = false;
  }

  getCategoryLabel(): string {
    return this.categories.find((c) => c.id === this.form.category)?.label ?? '';
  }

  getAssignedContacts(): Contact[] {
    return this.contacts.filter((c) => c.id && this.form.assignedTo.includes(c.id));
  }

  @HostListener('document:click', ['$event'])
  closeDropdownOnOutsideClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (!target.closest('.dropdown')) {
      this.showAssigneeDropdown = false;
      this.showCategoryDropdown = false;
    }
  }

  editingSubtaskIndex: number | null = null;
  editingSubtaskValue = '';

  addSubtask(): void {
    const value = this.newSubtask.trim();
    if (!value) return;
    this.form.subtasks.push(value);
    this.newSubtask = '';
  }

  clearSubtaskInput(): void {
    this.newSubtask = '';
  }

  removeSubtask(index: number): void {
    this.form.subtasks.splice(index, 1);
  }

  startEditSubtask(index: number): void {
    this.editingSubtaskIndex = index;
    this.editingSubtaskValue = this.form.subtasks[index];
  }

  confirmEditSubtask(index: number): void {
    const value = this.editingSubtaskValue.trim();
    if (value) {
      this.form.subtasks[index] = value;
    }
    this.editingSubtaskIndex = null;
  }

  deleteEditingSubtask(index: number): void {
    this.form.subtasks.splice(index, 1);
    this.editingSubtaskIndex = null;
  }
}