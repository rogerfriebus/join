import { Task, TaskStatus } from '../../core/models/task.model';
import { BoardBaseController } from './board-base.controller';

/** Drag-and-drop interactions shared by the board component. */
export abstract class BoardDragController extends BoardBaseController {
  /** Starts dragging a task card. */
  startTaskDrag(task: Task, event: DragEvent): void {
    this.draggedTask.set(task);
    event.dataTransfer?.setData('text/plain', task.id);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  /** Marks a column as the current drop target. */
  setDragTarget(status: TaskStatus): void {
    if (this.draggedTask()) this.dragTargetStatus.set(status);
  }

  /** Removes the visual drop-target indicator. */
  clearDragTarget(): void {
    this.dragTargetStatus.set(null);
  }

  /** Ends the drag operation. */
  endTaskDrag(): void {
    this.draggedTask.set(null);
    this.dragTargetStatus.set(null);
  }

  /** Moves a dragged task to another column. */
  async dropTask(status: TaskStatus): Promise<void> {
    const task = this.draggedTask();
    if (!task || task.status === status) return this.endTaskDrag();
    try {
      await this.taskService.updateTaskStatus(task.id, status);
    } finally {
      this.endTaskDrag();
    }
  }
}
