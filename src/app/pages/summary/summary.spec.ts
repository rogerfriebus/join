import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';

import { Summary } from './summary';
import { AuthService } from '../../core/services/auth.service';
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
  let displayNameSignal: ReturnType<typeof signal<string>>;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2099-07-06T08:00:00'));
    displayNameSignal = signal('Marco');
    loadTasksSpy = vi.fn().mockResolvedValue(undefined);

    const taskServiceStub = {
      tasks: signal<Task[]>(SUMMARY_TASKS).asReadonly(),
      loadTasks: loadTasksSpy,
    };

    const authServiceStub = {
      displayName: displayNameSignal.asReadonly(),
    };

    await TestBed.configureTestingModule({
      imports: [Summary],
      providers: [
        { provide: TaskService, useValue: taskServiceStub },
        { provide: AuthService, useValue: authServiceStub },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Summary);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads tasks through the TaskService facade', () => {
    expect(loadTasksSpy).toHaveBeenCalled();
  });


  it('links all summary cards to the board', () => {
    const boardLinks = fixture.nativeElement.querySelectorAll('a.summary-card[href="/board"]');

    expect(boardLinks.length).toBe(6);
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


  it('shows fixed line breaks for the board and progress card labels', () => {
    const labels = fixture.nativeElement.querySelectorAll('.summary-card__label');

    expect(labels.length).toBe(2);
    expect(labels[0].querySelectorAll('.summary-card__label-line').length).toBe(2);
    expect(labels[1].querySelectorAll('.summary-card__label-line').length).toBe(2);
  });

  it('shows the amount of urgent tasks', () => {
    expect(fixture.nativeElement.textContent).toContain('2');
    expect(fixture.nativeElement.textContent).toContain('Urgent');
  });

  it('shows the next upcoming deadline', () => {
    expect(fixture.nativeElement.textContent).toContain('July 8, 2099');
    expect(fixture.nativeElement.textContent).toContain('Upcoming Deadline');
  });

  it('shows a time based greeting with the current user name', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Good morning,');
    expect(text).toContain('Marco');
  });

  it('uses Guest as greeting fallback when no user name is available', () => {
    displayNameSignal.set('');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Guest');
  });

  it('shows a guest-friendly mobile greeting without the guest name', () => {
    displayNameSignal.set('');
    fixture.detectChanges();

    expect(component.mobileGreetingText()).toBe('Good morning!');
    expect(component.mobileDisplayName()).toBe('');
  });
});
