import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { Summary } from './summary';
import { TaskService } from '../../core/services/task.service';
import { Task } from '../../core/models/task.model';

const SUMMARY_TASKS: Task[] = [
  {
    id: 'a',
    title: 'Todo Task',
    dueDate: '2099-07-15',
    priority: 'urgent',
    category: 'Technical Task',
    status: 'todo',
    assignedContactIds: [],
    subtasks: [],
  },
  {
    id: 'b',
    title: 'Progress Task',
    dueDate: '2099-07-10',
    priority: 'medium',
    category: 'User Story',
    status: 'inProgress',
    assignedContactIds: [],
    subtasks: [],
  },
  {
    id: 'c',
    title: 'Feedback Task',
    dueDate: '2099-07-08',
    priority: 'low',
    category: 'Technical Task',
    status: 'awaitFeedback',
    assignedContactIds: [],
    subtasks: [],
  },
  {
    id: 'd',
    title: 'Done Task',
    dueDate: '2099-07-20',
    priority: 'urgent',
    category: 'User Story',
    status: 'done',
    assignedContactIds: [],
    subtasks: [],
  },
];

describe('Summary', () => {
  let component: Summary;
  let fixture: ComponentFixture<Summary>;
  let loadTasksSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    loadTasksSpy = vi.fn().mockResolvedValue(undefined);

    const taskServiceStub = {
      tasks: signal<Task[]>(SUMMARY_TASKS).asReadonly(),
      loadTasks: loadTasksSpy,
    };

    await TestBed.configureTestingModule({
      imports: [Summary],
      providers: [{ provide: TaskService, useValue: taskServiceStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(Summary);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads tasks through the TaskService facade', () => {
    expect(loadTasksSpy).toHaveBeenCalled();
  });

  it('shows the total amount of tasks', () => {
    expect(fixture.nativeElement.textContent).toContain('4');
    expect(fixture.nativeElement.textContent).toContain('Tasks in Board');
  });

  it('counts tasks by board status', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('To-do');
    expect(text).toContain('Done');
    expect(text).toContain('Tasks in Progress');
    expect(text).toContain('Awaiting Feedback');
  });

  it('shows the amount of urgent tasks', () => {
    expect(fixture.nativeElement.textContent).toContain('2');
    expect(fixture.nativeElement.textContent).toContain('Urgent');
  });

  it('shows the next upcoming deadline', () => {
    expect(fixture.nativeElement.textContent).toContain('July 8, 2099');
    expect(fixture.nativeElement.textContent).toContain('Upcoming Deadline');
  });
});
