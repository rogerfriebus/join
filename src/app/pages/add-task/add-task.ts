import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ContactService } from '../../core/services/contact.service';
import { Contact } from '../../core/models/contact.model';
import { TaskService } from '../../core/services/task.service';
import { Task, Subtask, TaskPriority, TaskCategory } from '../../core/models/task.model';

/** Auswahloption für das Kategorie-Dropdown. */
interface CategoryOption {
  id: TaskCategory;
  label: string;
}

/**
 * Seite zum Erstellen einer neuen Task.
 *
 * Enthält das vollständige Formular mit Titel, Beschreibung, Fälligkeitsdatum,
 * Priorität, Kontaktzuweisung, Kategorie und Subtasks. Nach erfolgreichem
 * Speichern wird auf das Board navigiert.
 */
@Component({
  selector: 'app-add-task',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-task.html',
  styleUrl: './add-task.scss',
})
export class AddTask {
  /** Heutiges Datum im Format des nativen Date-Inputs (YYYY-MM-DD). */
  readonly today: string = new Date().toISOString().split('T')[0];

  private router = inject(Router);
  private contactService = inject(ContactService);
  private taskService = inject(TaskService);

  /** Alle verfügbaren Kontakte für die Assignee-Auswahl. */
  readonly contacts: Contact[] = this.contactService.getContacts();

  /** Verfügbare Kategorien für das Kategorie-Dropdown. */
  readonly categories: CategoryOption[] = [
    { id: 'Technical Task', label: 'Technical Task' },
    { id: 'User Story', label: 'User Story' },
  ];

  /** Aktueller Formularzustand. */
  form = {
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium' as TaskPriority,
    assignedTo: [] as string[],
    category: '' as TaskCategory | '',
    subtasks: [] as string[],
  };

  /** Eingabewert für eine neue Subtask. */
  newSubtask = '';

  /** Gibt an, ob der Speichervorgang gerade läuft (verhindert Doppel-Submits). */
  isSaving = false;

  /** Sichtbarkeit des Assignee-Dropdowns. */
  showAssigneeDropdown = false;

  /** Sichtbarkeit des Kategorie-Dropdowns. */
  showCategoryDropdown = false;

  /** Index der Subtask, die gerade bearbeitet wird, oder null. */
  editingSubtaskIndex: number | null = null;

  /** Temporärer Text der aktuell bearbeiteten Subtask. */
  editingSubtaskValue = '';

  /** Gibt an, ob das Fälligkeitsdatum in der Vergangenheit liegt. */
  dueDateError = false;

  /** Maximale Anzahl sichtbarer Assignee-Avatare im Dropdown-Feld. */
  readonly maxVisibleAssignees = 6;

  /** Setzt die Priorität des Formulars. */
  setPriority(priority: TaskPriority): void {
    this.form.priority = priority;
  }

  /** Wählt einen Kontakt aus oder entfernt ihn aus der Zuweisung. */
  toggleAssignee(contactId: string): void {
    const index = this.form.assignedTo.indexOf(contactId);
    if (index === -1) {
      this.form.assignedTo.push(contactId);
    } else {
      this.form.assignedTo.splice(index, 1);
    }
  }

  /** Prüft, ob ein Kontakt aktuell zugewiesen ist. */
  isAssigned(contactId: string): boolean {
    return this.form.assignedTo.includes(contactId);
  }

  /** Leitet Initialen aus einem vollständigen Namen ab. */
  getInitials(name: string): string {
    return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  }

  /** Setzt das Formular auf den Ausgangszustand zurück. */
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
   * Erstellt eine neue Task und navigiert nach Erfolg zum Board.
   * Bricht ab, wenn Pflichtfelder fehlen oder ein Speichervorgang läuft.
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
      console.error('Task konnte nicht erstellt werden:', error);
    } finally {
      this.isSaving = false;
    }
  }

  /** Öffnet oder schließt das Assignee-Dropdown (schließt dabei das Kategorie-Dropdown). */
  toggleAssigneeDropdown(): void {
    if (this.showCategoryDropdown) this.showCategoryDropdown = false;
    this.showAssigneeDropdown = !this.showAssigneeDropdown;
  }

  /** Öffnet oder schließt das Kategorie-Dropdown (schließt dabei das Assignee-Dropdown). */
  toggleCategoryDropdown(): void {
    if (this.showAssigneeDropdown) this.showAssigneeDropdown = false;
    this.showCategoryDropdown = !this.showCategoryDropdown;
  }

  /** Wählt eine Kategorie aus und schließt das Dropdown. */
  selectCategory(category: CategoryOption): void {
    this.form.category = category.id;
    this.showCategoryDropdown = false;
  }

  /** Liefert das lesbare Label der aktuell gewählten Kategorie. */
  getCategoryLabel(): string {
    return this.categories.find((c) => c.id === this.form.category)?.label ?? '';
  }

  /** Liefert die vollständigen Kontakt-Objekte aller zugewiesenen Kontakte. */
  getAssignedContacts(): Contact[] {
    return this.contacts.filter((c) => c.id && this.form.assignedTo.includes(c.id));
  }

  /** Schließt alle Dropdowns bei einem Klick außerhalb eines Dropdown-Elements. */
  @HostListener('document:click', ['$event'])
  closeDropdownOnOutsideClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown')) {
      this.showAssigneeDropdown = false;
      this.showCategoryDropdown = false;
    }
  }

  /** Fügt die aktuelle Subtask-Eingabe zur Liste hinzu. */
  addSubtask(): void {
    const value = this.newSubtask.trim();
    if (!value) return;
    this.form.subtasks.push(value);
    this.newSubtask = '';
  }

  /** Leert das Subtask-Eingabefeld. */
  clearSubtaskInput(): void {
    this.newSubtask = '';
  }

  /** Entfernt eine Subtask anhand ihres Index. */
  removeSubtask(index: number): void {
    this.form.subtasks.splice(index, 1);
  }

  /** Startet den Inline-Edit-Modus für eine vorhandene Subtask. */
  startEditSubtask(index: number): void {
    this.editingSubtaskIndex = index;
    this.editingSubtaskValue = this.form.subtasks[index];
  }

  /** Übernimmt den geänderten Text einer Subtask und beendet den Edit-Modus. */
  confirmEditSubtask(index: number): void {
    const value = this.editingSubtaskValue.trim();
    if (value) {
      this.form.subtasks[index] = value;
    }
    this.editingSubtaskIndex = null;
  }

  /** Löscht die Subtask, die sich gerade im Edit-Modus befindet. */
  deleteEditingSubtask(index: number): void {
    this.form.subtasks.splice(index, 1);
    this.editingSubtaskIndex = null;
  }

  /** Prüft, ob das gewählte Fälligkeitsdatum in der Vergangenheit liegt. */
  validateDueDate(): void {
    if (this.form.dueDate && this.form.dueDate < this.today) {
      this.dueDateError = true;
    } else {
      this.dueDateError = false;
    }
  }

  /** Liefert die sichtbaren Assignee-Kontakte (begrenzt auf maxVisibleAssignees). */
  getVisibleAssignedContacts(): Contact[] {
    return this.getAssignedContacts().slice(0, this.maxVisibleAssignees);
  }

  /** Liefert die Anzahl der nicht sichtbaren Assignees. */
  getHiddenAssigneeCount(): number {
    return Math.max(this.getAssignedContacts().length - this.maxVisibleAssignees, 0);
  }
}