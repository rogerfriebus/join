import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';

import { Board } from './board';
import { TaskService } from '../../core/services/task.service';
import { Task } from '../../core/models/task.model';

/**
 * Test-Tasks: todo und inProgress sind belegt, awaitFeedback und done sind leer
 * (für den Empty-State-Test).
 */
const TEST_TASKS: Task[] = [
  {
    id: 'a',
    title: 'Todo Task',
    description: 'Beschreibung Todo',
    dueDate: '2026-07-01',
    priority: 'urgent',
    category: 'Technical Task',
    status: 'todo',
    assignedContactIds: ['1', '2'],
    subtasks: [
      { id: 'a-s1', title: 'x', done: true },
      { id: 'a-s2', title: 'y', done: false },
    ],
  },
  {
    id: 'b',
    title: 'Progress Task',
    dueDate: '2026-07-02',
    priority: 'medium',
    category: 'User Story',
    status: 'inProgress',
    assignedContactIds: [],
    subtasks: [],
  },
];

describe('Board', () => {
  let component: Board;
  let fixture: ComponentFixture<Board>;
  let loadTasksSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    loadTasksSpy = vi.fn().mockResolvedValue(undefined);

    // Stub statt echter TaskService: keine Supabase-/Netzwerkaufrufe im Test.
    const taskServiceStub = {
      tasks: signal<Task[]>(TEST_TASKS).asReadonly(),
      loadTasks: loadTasksSpy,
    };

    await TestBed.configureTestingModule({
      imports: [Board],
      providers: [provideRouter([]), { provide: TaskService, useValue: taskServiceStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(Board);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ruft loadTasks beim Init über den TaskService auf', () => {
    expect(loadTasksSpy).toHaveBeenCalled();
  });

  it('rendert vier Board-Spalten', () => {
    const columns = fixture.nativeElement.querySelectorAll('.board-column');
    expect(columns.length).toBe(4);
  });

  it('gruppiert Tasks nach Status in die passenden Spalten', () => {
    const columns = fixture.nativeElement.querySelectorAll('.board-column');

    // Reihenfolge: ToDo, In Progress, Awaiting Feedback, Done
    expect(columns[0].textContent).toContain('Todo Task');
    expect(columns[1].textContent).toContain('Progress Task');
    expect(columns[0].textContent).not.toContain('Progress Task');
  });

  it('zeigt einen Empty-State für leere Spalten', () => {
    const columns = fixture.nativeElement.querySelectorAll('.board-column');

    // Awaiting Feedback und Done sind leer
    expect(columns[2].textContent).toContain('No tasks Awaiting Feedback');
    expect(columns[3].textContent).toContain('No tasks Done');
  });

  it('zeigt Subtask-Fortschritt auf der Karte', () => {
    const columns = fixture.nativeElement.querySelectorAll('.board-column');
    expect(columns[0].textContent).toContain('1/2 Subtasks');
  });
});
