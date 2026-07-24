import { CommonModule } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Task } from '../../core/models/task.model';
import { AddTaskModal } from '../add-task-modal/add-task-modal';
import { BoardEditController } from './board-edit.controller';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, RouterLink, AddTaskModal],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class Board extends BoardEditController {
  private readonly router = inject(Router);

  showAddTaskModal = false;
  isMobile = window.innerWidth < 1060;

  /** Updates the responsive add-task behaviour. */
  @HostListener('window:resize')
  onResize(): void {
    this.isMobile = window.innerWidth < 1060;
  }

  /** Closes the add-task modal after a task was created. */
  onTaskCreated(_task: Task): void {
    this.showAddTaskModal = false;
  }

  /** Opens Add Task as a page on mobile and as a modal on desktop. */
  openAddTask(): void {
    if (this.isMobile) return void this.router.navigate(['/add-task']);
    this.showAddTaskModal = true;
  }
}
