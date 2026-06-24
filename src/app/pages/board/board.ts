import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../core/services/task.service';
import { Task, TaskStatus } from '../../core/models/task.model';

/** Konfiguration einer Board-Spalte. */
interface BoardColumn {
  title: string;
  status: TaskStatus;
  emptyText: string;
}

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class Board implements OnInit {
  private taskService = inject(TaskService);

  /** Read-only Task-Signal aus der TaskService-Fassade (keine direkte Supabase-Logik hier). */
  readonly tasks = this.taskService.tasks;

  /** Aktuell ausgewählter Task für die Detailansicht. */
  readonly selectedTask = signal<Task | null>(null);

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

  /** Reaktive Gruppierung der Tasks nach Status pro Spalte. */
  readonly board = computed(() =>
    this.columns.map((column) => ({
      ...column,
      tasks: this.tasks().filter((task) => task.status === column.status),
    })),
  );

  /** Lädt die Tasks beim Öffnen des Boards über die Fassade (Supabase mit Fallback). */
  async ngOnInit(): Promise<void> {
    await this.taskService.loadTasks();
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

  /** Kurze Anzeige für Assigned Contacts, solange noch keine echten Kontakt-Initialen angebunden sind. */
  assigneePreview(contactId: string): string {
    return contactId.trim().slice(0, 2).toUpperCase();
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
}
