import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';

import { Board } from './board';
import { TaskService } from '../../core/services/task.service';
import { ContactService } from '../../core/services/contact.service';
import { Task } from '../../core/models/task.model';
import { Contact } from '../../core/models/contact.model';

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

const TEST_CONTACTS: Contact[] = [
  {
    id: '1',
    name: 'Anja Schulz',
    email: 'anja.schulz@example.com',
    phone: '+49 151 1234567',
    initials: 'AS',
    color: '#FF7A00',
  },
  {
    id: '2',
    name: 'Benjamin Krüger',
    email: 'benjamin.krueger@example.com',
    phone: '+49 160 2345678',
    initials: 'BK',
    color: '#9327FF',
  },
];

describe('Board', () => {
  let component: Board;
  let fixture: ComponentFixture<Board>;
  let loadTasksSpy: ReturnType<typeof vi.fn>;
  let updateTaskStatusSpy: ReturnType<typeof vi.fn>;
  let loadContactsSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    loadTasksSpy = vi.fn().mockResolvedValue(undefined);
    updateTaskStatusSpy = vi.fn().mockResolvedValue(undefined);
    loadContactsSpy = vi.fn().mockResolvedValue(undefined);

    // Stub statt echter TaskService: keine Supabase-/Netzwerkaufrufe im Test.
    const taskServiceStub = {
      tasks: signal<Task[]>(TEST_TASKS).asReadonly(),
      loadTasks: loadTasksSpy,
      updateTaskStatus: updateTaskStatusSpy,
    };

    // Stub statt echter ContactService: keine Supabase-/Netzwerkaufrufe im Test.
    const contactServiceStub = {
      contacts: signal<Contact[]>(TEST_CONTACTS).asReadonly(),
      loadContacts: loadContactsSpy,
    };

    await TestBed.configureTestingModule({
      imports: [Board],
      providers: [
        provideRouter([]),
        { provide: TaskService, useValue: taskServiceStub },
        { provide: ContactService, useValue: contactServiceStub },
      ],
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

  it('ruft loadContacts beim Init über den ContactService auf', () => {
    expect(loadContactsSpy).toHaveBeenCalled();
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

  it('aktualisiert den Task-Status beim Drop in eine andere Spalte', async () => {
    const dragEvent = {
      dataTransfer: {
        setData: vi.fn(),
        effectAllowed: 'none',
      },
    } as unknown as DragEvent;

    component.startTaskDrag(TEST_TASKS[0], dragEvent);

    await component.dropTask('done');

    expect(updateTaskStatusSpy).toHaveBeenCalledWith('a', 'done');
  });

  it('filtert Tasks anhand der Suche', () => {
    component.updateSearchQuery({
      target: { value: 'progress' },
    } as unknown as Event);

    expect(component.board()[0].tasks.length).toBe(0);
    expect(component.board()[1].tasks.length).toBe(1);
    expect(component.board()[1].tasks[0].title).toBe('Progress Task');
  });

  it('erkennt, wenn eine Suche keine Treffer liefert', () => {
    component.updateSearchQuery({
      target: { value: 'xyz' },
    } as unknown as Event);

    expect(component.hasSearchQuery()).toBe(true);
    expect(component.hasSearchResults()).toBe(false);
  });

  it('zeigt bei Suche einen passenden Empty-State-Text pro leerer Spalte', () => {
    component.updateSearchQuery({
      target: { value: 'progress' },
    } as unknown as Event);

    const firstColumn = component.board()[0];

    expect(component.columnEmptyText(firstColumn)).toBe('No matching tasks');
  });

  it('löst Kontakt-Initialen über den ContactService auf', () => {
    expect(component.assigneeInitials('1')).toBe('AS');
    expect(component.assigneeInitials('2')).toBe('BK');
  });

  it('löst Kontakt-Namen über den ContactService auf', () => {
    expect(component.assigneeName('1')).toBe('Anja Schulz');
    expect(component.assigneeName('2')).toBe('Benjamin Krüger');
  });

  it('löst Kontakt-Farben über den ContactService auf', () => {
    expect(component.assigneeColor('1')).toBe('#FF7A00');
    expect(component.assigneeColor('2')).toBe('#9327FF');
  });

  it('zeigt Fallback-Werte für unbekannte Kontakt-IDs', () => {
    expect(component.assigneeInitials('unknown')).toBe('?');
    expect(component.assigneeName('unknown')).toBe('Unknown contact');
    expect(component.assigneeColor('unknown')).toBe('#ff7a00');
  });
});
