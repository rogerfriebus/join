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

describe('Board', () => {
  let component: Board;
  let fixture: ComponentFixture<Board>;
  let loadTasksSpy: ReturnType<typeof vi.fn>;
  let updateTaskStatusSpy: ReturnType<typeof vi.fn>;
  let updateSubtaskStatusSpy: ReturnType<typeof vi.fn>;
  let updateTaskSpy: ReturnType<typeof vi.fn>;
  let deleteTaskSpy: ReturnType<typeof vi.fn>;
  let loadContactsSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    loadTasksSpy = vi.fn().mockResolvedValue(undefined);
    updateTaskStatusSpy = vi.fn().mockResolvedValue(undefined);
    updateSubtaskStatusSpy = vi.fn().mockResolvedValue(undefined);
    updateTaskSpy = vi.fn().mockResolvedValue(TEST_TASKS[0]);
    deleteTaskSpy = vi.fn().mockResolvedValue(true);
    loadContactsSpy = vi.fn().mockResolvedValue(undefined);

    // Stub statt echter TaskService: keine Supabase-/Netzwerkaufrufe im Test.
    const taskServiceStub = {
      tasks: signal<Task[]>(TEST_TASKS).asReadonly(),
      loadTasks: loadTasksSpy,
      updateTaskStatus: updateTaskStatusSpy,
      updateSubtaskStatus: updateSubtaskStatusSpy,
      updateTask: updateTaskSpy,
      deleteTask: deleteTaskSpy,
    };

    // Stub statt echter ContactService: keine Supabase-/Netzwerkaufrufe im Test.
    const contactServiceStub = {
      contacts: signal<Contact[]>([
        {
          id: '1',
          name: 'Marco Alsen',
          email: 'marco@example.com',
          phone: '123',
          color: '#ff7a00',
          initials: 'MA',
        },
        {
          id: '2',
          name: 'Roger Example',
          email: 'roger@example.com',
          phone: '456',
          color: '#29abe2',
          initials: 'RE',
        },
        {
          id: '3',
          name: 'Anna Example',
          email: 'anna@example.com',
          phone: '789',
          color: '#7ae229',
          initials: 'AE',
        },
      ]).asReadonly(),
      loadContacts: loadContactsSpy,
      resolveContact: (_id: string): Contact | undefined => undefined,
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

    // Await feedback und Done sind leer
    expect(columns[2].textContent).toContain('No tasks Await feedback');
    expect(columns[3].textContent).toContain('No tasks Done');
  });

  it('zeigt Subtask-Fortschritt auf der Karte', () => {
    const columns = fixture.nativeElement.querySelectorAll('.board-column');
    expect(columns[0].textContent).toContain('1/2 Subtasks');
  });

  it('renders assignees and subtasks in separate scroll containers', () => {
    const detailedTask: Task = {
      ...TEST_TASKS[0],
      assignedContactIds: ['1', '2', '3', '4', '5'],
      subtasks: Array.from({ length: 5 }, (_, index) => ({
        id: `detail-subtask-${index}`,
        title: `Detail subtask ${index + 1}`,
        done: false,
      })),
    };

    component.openTaskDetail(detailedTask);
    fixture.detectChanges();

    const assigneeList = fixture.nativeElement.querySelector('.task-detail__assignees');
    const subtaskList = fixture.nativeElement.querySelector('.task-detail__subtasks');

    expect(assigneeList?.querySelectorAll('.task-detail__assignee').length).toBe(5);
    expect(subtaskList?.querySelectorAll('.task-detail__subtask').length).toBe(5);
  });

  it('aktualisiert einen Subtask direkt aus der Task-Detailansicht', async () => {
    const updatedTask: Task = {
      ...TEST_TASKS[0],
      subtasks: TEST_TASKS[0].subtasks.map((subtask) =>
        subtask.id === 'a-s2' ? { ...subtask, done: true } : subtask,
      ),
    };

    updateSubtaskStatusSpy.mockResolvedValueOnce(updatedTask);
    component.openTaskDetail(TEST_TASKS[0]);

    await component.toggleDetailSubtask(TEST_TASKS[0], TEST_TASKS[0].subtasks[1]);

    expect(updateSubtaskStatusSpy).toHaveBeenCalledWith('a', 'a-s2', true);
    expect(component.selectedTask()).toEqual(updatedTask);
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

  it('öffnet das Edit-Overlay mit den vorhandenen Task-Daten', () => {
    component.openTaskEdit(TEST_TASKS[0]);

    expect(component.editTask()).toEqual(TEST_TASKS[0]);
    expect(component.editDraft().title).toBe('Todo Task');
    expect(component.editDraft().priority).toBe('urgent');
    expect(component.editDraft().subtasks.length).toBe(2);
  });

  it('hebt bereits ausgewählte Kontakte im Edit-Dropdown hervor', () => {
    component.openTaskEdit(TEST_TASKS[0]);
    component.toggleEditAssigneeDropdown();
    fixture.detectChanges();

    const contacts = fixture.nativeElement.querySelectorAll('.dropdown-option');

    expect(contacts[0].classList.contains('checked')).toBe(true);
    expect(contacts[1].classList.contains('checked')).toBe(true);
    expect(contacts[2].classList.contains('checked')).toBe(false);
  });

  it('speichert geänderte Task-Daten über den TaskService', async () => {
    component.openTaskEdit(TEST_TASKS[0]);

    component.updateEditTitle({
      target: { value: 'Updated Task' },
    } as unknown as Event);

    component.setEditPriority('low');
    component.updateEditDueDate({
      target: { value: '2099-12-31' },
    } as unknown as Event);

    await component.saveTaskEdit();

    expect(updateTaskSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'a',
        title: 'Updated Task',
        priority: 'low',
      }),
    );
  });

  it('übernimmt einen offenen Subtask-Text-Edit beim Speichern des Tasks', async () => {
    component.openTaskEdit(TEST_TASKS[0]);
    component.updateEditDueDate({
      target: { value: '2099-12-31' },
    } as unknown as Event);
    component.startEditSubtaskText(TEST_TASKS[0].subtasks[0]);
    component.updateEditingEditSubtaskValue({
      target: { value: 'Updated subtask' },
    } as unknown as Event);

    await component.saveTaskEdit();

    expect(updateTaskSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        subtasks: expect.arrayContaining([
          expect.objectContaining({ id: 'a-s1', title: 'Updated subtask' }),
        ]),
      }),
    );
    expect(component.editingEditSubtaskId()).toBeNull();
  });

  it('speichert keine ungültige Edit-Task ohne Titel', async () => {
    component.openTaskEdit(TEST_TASKS[0]);

    component.updateEditTitle({
      target: { value: '' },
    } as unknown as Event);

    await component.saveTaskEdit();

    expect(updateTaskSpy).not.toHaveBeenCalled();
    expect(component.editSubmitted()).toBe(true);
  });

  it('speichert keine Edit-Task mit einem Datum in der Vergangenheit', async () => {
    component.openTaskEdit(TEST_TASKS[0]);

    component.updateEditDueDate({
      target: { value: '2000-01-01' },
    } as unknown as Event);

    await component.saveTaskEdit();

    expect(component.editDueDateIsPast()).toBe(true);
    expect(updateTaskSpy).not.toHaveBeenCalled();
    expect(component.editSubmitted()).toBe(true);
  });

  it('zeigt die Datumsfehlermeldung direkt nach Eingabe eines vergangenen Datums', () => {
    component.openTaskEdit({ ...TEST_TASKS[0], dueDate: '2099-12-31' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.error-message')).toBeNull();

    component.updateEditDueDate({
      target: { value: '2000-01-01' },
    } as unknown as Event);
    fixture.detectChanges();

    const errorMessage = fixture.nativeElement.querySelector('.error-message');

    expect(component.editDueDateTouched()).toBe(true);
    expect(errorMessage?.textContent.trim()).toBe('Due date cannot be in the past.');
  });

  it('löscht den ausgewählten Task über den TaskService', async () => {
    component.openTaskDetail(TEST_TASKS[0]);

    await component.deleteSelectedTask();

    expect(deleteTaskSpy).toHaveBeenCalledWith('a');
    expect(component.selectedTask()).toBeNull();
  });

  it('begrenzt sichtbare Assignees auf der Task-Card und zählt weitere Kontakte', () => {
    const taskWithManyAssignees: Task = {
      ...TEST_TASKS[0],
      assignedContactIds: ['1', '2', '3', '4', '5', '6', '7', '8'],
    };

    expect(component.visibleAssigneeIds(taskWithManyAssignees)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
    ]);
    expect(component.hiddenAssigneeCount(taskWithManyAssignees)).toBe(2);
  });

  it('begrenzt sichtbare Assignees im Edit-Formular und zählt weitere Kontakte', () => {
    const contacts = Array.from({ length: 8 }, (_, index) => ({
      id: String(index + 1),
      name: `Contact ${index + 1}`,
      email: `contact${index + 1}@example.com`,
      phone: '',
      color: '#29abe2',
      initials: `C${index + 1}`,
    }));

    Object.defineProperty(component, 'contacts', {
      value: signal<Contact[]>(contacts).asReadonly(),
    });

    component.editDraft.update((draft) => ({
      ...draft,
      assignedContactIds: contacts.map((contact) => contact.id!),
    }));

    expect(component.visibleEditAssignedContacts().length).toBe(6);
    expect(component.hiddenEditAssigneeCount()).toBe(2);
  });

  it('zeigt Fallback-Werte für unbekannte Kontakt-IDs', () => {
    expect(component.assigneeInitials('unknown')).toBe('?');
    expect(component.assigneeName('unknown')).toBe('Unknown contact');
    expect(component.assigneeColor('unknown')).toBe('#ff7a00');
  });
});
