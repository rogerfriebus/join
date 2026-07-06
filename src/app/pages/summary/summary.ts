import { Component, OnInit, computed, inject } from '@angular/core';
import { Task, TaskStatus } from '../../core/models/task.model';
import { AuthService } from '../../core/services/auth.service';
import { TaskService } from '../../core/services/task.service';

interface DeadlineCandidate {
  task: Task;
  timestamp: number;
}

interface SummaryStats {
  total: number;
  todo: number;
  inProgress: number;
  awaitFeedback: number;
  done: number;
  urgent: number;
  upcomingDeadline: string;
}

@Component({
  selector: 'app-summary',
  imports: [],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly taskService = inject(TaskService);

  /** Reaktive Summary-Kennzahlen aus dem zentralen TaskService. */
  readonly stats = computed(() => this.createStats(this.taskService.tasks()));

  /** Anzeigename für User- und Gast-Begrüßung. */
  readonly displayName = computed(() => this.getDisplayName(this.authService.displayName()));

  /** Tageszeitabhängige Begrüßung für das Summary-Dashboard. */
  readonly greetingText = this.getGreetingText(new Date().getHours());

  /** Mobile-Greeting nach Figma: Gäste bekommen nur einen Gruß ohne Namen. */
  readonly mobileGreetingText = computed(() => this.getMobileGreetingText(this.displayName()));

  /** Anzeigename für die mobile Begrüßung, bei Gästen bewusst leer. */
  readonly mobileDisplayName = computed(() => this.getMobileDisplayName(this.displayName()));

  /** Lädt Tasks über die Service-Fassade, ohne Supabase-Logik in Summary. */
  async ngOnInit(): Promise<void> {
    await this.taskService.loadTasks();
  }

  /** Erstellt alle sichtbaren Kennzahlen für die Summary-Seite. */
  private createStats(tasks: Task[]): SummaryStats {
    return {
      total: tasks.length,
      todo: this.countStatus(tasks, 'todo'),
      inProgress: this.countStatus(tasks, 'inProgress'),
      awaitFeedback: this.countStatus(tasks, 'awaitFeedback'),
      done: this.countStatus(tasks, 'done'),
      urgent: this.countUrgent(tasks),
      upcomingDeadline: this.getUpcomingDeadline(tasks),
    };
  }

  /** Zählt Tasks für eine bestimmte Board-Spalte. */
  private countStatus(tasks: Task[], status: TaskStatus): number {
    return tasks.filter((task) => task.status === status).length;
  }

  /** Zählt Tasks mit hoher Priorität. */
  private countUrgent(tasks: Task[]): number {
    return tasks.filter((task) => task.priority === 'urgent').length;
  }

  /** Liefert die nächste lesbare Deadline oder einen Fallback. */
  private getUpcomingDeadline(tasks: Task[]): string {
    const task = this.findNextDeadlineTask(tasks);
    return task ? this.formatDate(task.dueDate) : '—';
  }

  /** Sucht zuerst kommende Deadlines, sonst die nächste vorhandene Deadline. */
  private findNextDeadlineTask(tasks: Task[]): Task | undefined {
    const candidates = this.getDeadlineCandidates(tasks);
    const upcoming = candidates.filter((item) => item.timestamp >= this.todayTimestamp());
    const relevant = upcoming.length ? upcoming : candidates;
    return this.sortCandidates(relevant)[0]?.task;
  }

  /** Mappt gültige Task-Daten auf sortierbare Deadline-Kandidaten. */
  private getDeadlineCandidates(tasks: Task[]): DeadlineCandidate[] {
    return tasks
      .map((task) => ({ task, timestamp: this.toTimestamp(task.dueDate) }))
      .filter((item) => Number.isFinite(item.timestamp));
  }

  /** Sortiert Deadline-Kandidaten aufsteigend nach Fälligkeitsdatum. */
  private sortCandidates(candidates: DeadlineCandidate[]): DeadlineCandidate[] {
    return [...candidates].sort((a, b) => a.timestamp - b.timestamp);
  }

  /** Formatiert ISO-Daten im Join-Figma-Stil. */
  private formatDate(dueDate: string): string {
    const date = new Date(this.toTimestamp(dueDate));
    return new Intl.DateTimeFormat('en-US', this.dateFormatOptions()).format(date);
  }

  /** Liefert die Formatoptionen für Summary-Deadlines. */
  private dateFormatOptions(): Intl.DateTimeFormatOptions {
    return { month: 'long', day: 'numeric', year: 'numeric' };
  }

  /** Wandelt ein YYYY-MM-DD-Datum in einen lokalen Timestamp. */
  private toTimestamp(dueDate: string): number {
    const [year, month, day] = dueDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getTime();
  }

  /** Timestamp vom heutigen Tagesanfang. */
  private todayTimestamp(): number {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  }

  /** Liefert einen stabilen Anzeigenamen für Summary. */
  private getDisplayName(displayName: string): string {
    return displayName.trim() || 'Guest';
  }

  /** Liefert die passende Begrüßung anhand der Tageszeit. */
  private getGreetingText(hour: number): string {
    if (hour < 12) return 'Good morning,';
    if (hour < 18) return 'Good afternoon,';
    return 'Good evening,';
  }

  /** Liefert den mobilen Gruß ohne Komma, wenn nur ein Gast angemeldet ist. */
  private getMobileGreetingText(displayName: string): string {
    return displayName === 'Guest' ? this.greetingText.replace(',', '!') : this.greetingText;
  }

  /** Versteckt den Namen auf der mobilen Gast-Greeting-Ansicht. */
  private getMobileDisplayName(displayName: string): string {
    return displayName === 'Guest' ? '' : displayName;
  }
}
