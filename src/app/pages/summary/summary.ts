import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
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
  imports: [RouterLink],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly taskService = inject(TaskService);

  /** Reactive summary metrics derived from the central TaskService. */
  readonly stats = computed(() => this.createStats(this.taskService.tasks()));

  /** Display name used for authenticated-user and guest greetings. */
  readonly displayName = computed(() => this.getDisplayName(this.authService.displayName()));

  /** Time-based greeting for the Summary dashboard. */
  readonly greetingText = this.getGreetingText(new Date().getHours());

  /** Mobile greeting based on Figma: guests receive a greeting without a name. */
  readonly mobileGreetingText = computed(() => this.getMobileGreetingText(this.displayName()));

  /** Display name for the mobile greeting, intentionally empty for guests. */
  readonly mobileDisplayName = computed(() => this.getMobileDisplayName(this.displayName()));

  /** Loads tasks through the service facade without Supabase logic in Summary. */
  async ngOnInit(): Promise<void> {
    await this.taskService.loadTasks();
  }

  /** Creates all visible metrics for the Summary page. */
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

  /** Counts tasks for a specific board column. */
  private countStatus(tasks: Task[], status: TaskStatus): number {
    return tasks.filter((task) => task.status === status).length;
  }

  /** Counts urgent tasks. */
  private countUrgent(tasks: Task[]): number {
    return tasks.filter((task) => task.priority === 'urgent').length;
  }

  /** Returns the next readable deadline or a fallback value. */
  private getUpcomingDeadline(tasks: Task[]): string {
    const task = this.findNextDeadlineTask(tasks);
    return task ? this.formatDate(task.dueDate) : '—';
  }

  /** Prefers upcoming deadlines, otherwise returns the nearest available deadline. */
  private findNextDeadlineTask(tasks: Task[]): Task | undefined {
    const candidates = this.getDeadlineCandidates(tasks);
    const upcoming = candidates.filter((item) => item.timestamp >= this.todayTimestamp());
    const relevant = upcoming.length ? upcoming : candidates;
    return this.sortCandidates(relevant)[0]?.task;
  }

  /** Maps valid task dates to sortable deadline candidates. */
  private getDeadlineCandidates(tasks: Task[]): DeadlineCandidate[] {
    return tasks
      .map((task) => ({ task, timestamp: this.toTimestamp(task.dueDate) }))
      .filter((item) => Number.isFinite(item.timestamp));
  }

  /** Sorts deadline candidates by due date in ascending order. */
  private sortCandidates(candidates: DeadlineCandidate[]): DeadlineCandidate[] {
    return [...candidates].sort((a, b) => a.timestamp - b.timestamp);
  }

  /** Formats ISO dates using the Join Figma date style. */
  private formatDate(dueDate: string): string {
    const date = new Date(this.toTimestamp(dueDate));
    return new Intl.DateTimeFormat('en-US', this.dateFormatOptions()).format(date);
  }

  /** Returns the formatting options for Summary deadlines. */
  private dateFormatOptions(): Intl.DateTimeFormatOptions {
    return { month: 'long', day: 'numeric', year: 'numeric' };
  }

  /** Converts a YYYY-MM-DD value to a local timestamp. */
  private toTimestamp(dueDate: string): number {
    const [year, month, day] = dueDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getTime();
  }

  /** Timestamp for the start of the current day. */
  private todayTimestamp(): number {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  }

  /** Returns a stable display name for Summary. */
  private getDisplayName(displayName: string): string {
    return displayName.trim() || 'Guest';
  }

  /** Returns the appropriate greeting for the current time of day. */
  private getGreetingText(hour: number): string {
    if (hour < 12) return 'Good morning,';
    if (hour < 18) return 'Good afternoon,';
    return 'Good evening,';
  }

  /** Returns the mobile guest greeting without a comma. */
  private getMobileGreetingText(displayName: string): string {
    return displayName === 'Guest' ? this.greetingText.replace(',', '!') : this.greetingText;
  }

  /** Hides the name in the mobile guest greeting view. */
  private getMobileDisplayName(displayName: string): string {
    return displayName === 'Guest' ? '' : displayName;
  }
}
