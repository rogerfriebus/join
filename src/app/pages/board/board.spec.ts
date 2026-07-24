import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';

import { Board } from './board';
import { TaskService } from '../../core/services/task.service';
import { ContactService } from '../../core/services/contact.service';
import { Task } from '../../core/models/task.model';
import { Contact } from '../../core/models/contact.model';
/**
 * Test tasks: todo and inProgress contain tasks, while awaitFeedback and done
 * remain empty for the empty-state test.
 */
const TEST_TASKS: Task[] = [
  {
    id: 'a',
    title: 'Todo Task',
    description: 'Todo description',
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

    // Uses a TaskService stub to avoid Supabase and network calls in tests.
    const taskServiceStub = {
      tasks: signal<Task[]>(TEST_TASKS).asReadonly(),
      loadTasks: loadTasksSpy,
      updateTaskStatus: updateTaskStatusSpy,
      updateSubtaskStatus: updateSubtaskStatusSpy,
      updateTask: updateTaskSpy,
      deleteTask: deleteTaskSpy,
    };

    // Uses a ContactService stub to avoid Supabase and network calls in tests.
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

  it('calls loadTasks on init via the TaskService', () => {
    expect(loadTasksSpy).toHaveBeenCalled();
  });

  it('calls loadContacts on init via the ContactService', () => {
    expect(loadContactsSpy).toHaveBeenCalled();
  });

  it('renders four board columns', () => {
    const columns = fixture.nativeElement.querySelectorAll('.board-column');
    expect(columns.length).toBe(4);
  });

  it('groups tasks by status into the matching columns', () => {
    const columns = fixture.nativeElement.querySelectorAll('.board-column');

    // Column order: To do, In progress, Await feedback, Done
    expect(columns[0].textContent).toContain('Todo Task');
    expect(columns[1].textContent).toContain('Progress Task');
    expect(columns[0].textContent).not.toContain('Progress Task');
  });

  it('shows an empty state for empty columns', () => {
    const columns = fixture.nativeElement.querySelectorAll('.board-column');

    // Await feedback and Done are empty
    expect(columns[2].textContent).toContain('No tasks Await feedback');
    expect(columns[3].textContent).toContain('No tasks Done');
  });

  it('shows subtask progress on the card', () => {
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

  it('updates a subtask directly from the task detail view', async () => {
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

  it('updates the task status when dropped into another column', async () => {
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

  it('filters tasks based on the search query', () => {
    component.updateSearchQuery({
      target: { value: 'progress' },
    } as unknown as Event);

    expect(component.board()[0].tasks.length).toBe(0);
    expect(component.board()[1].tasks.length).toBe(1);
    expect(component.board()[1].tasks[0].title).toBe('Progress Task');
  });

  it('detects when a search returns no matches', () => {
    component.updateSearchQuery({
      target: { value: 'xyz' },
    } as unknown as Event);

    expect(component.hasSearchQuery()).toBe(true);
    expect(component.hasSearchResults()).toBe(false);
  });

  it('shows a matching empty-state text per empty column during a search', () => {
    component.updateSearchQuery({
      target: { value: 'progress' },
    } as unknown as Event);

    const firstColumn = component.board()[0];

    expect(component.columnEmptyText(firstColumn)).toBe('No matching tasks');
  });

  it('opens the edit overlay with the existing task data', () => {
    component.openTaskEdit(TEST_TASKS[0]);

    expect(component.editTask()).toEqual(TEST_TASKS[0]);
    expect(component.editDraft().title).toBe('Todo Task');
    expect(component.editDraft().priority).toBe('urgent');
    expect(component.editDraft().subtasks.length).toBe(2);
  });

  it('highlights already selected contacts in the edit dropdown', () => {
    component.openTaskEdit(TEST_TASKS[0]);
    component.toggleEditAssigneeDropdown();
    fixture.detectChanges();

    const contacts = fixture.nativeElement.querySelectorAll('.dropdown-option');

    expect(contacts[0].classList.contains('checked')).toBe(true);
    expect(contacts[1].classList.contains('checked')).toBe(true);
    expect(contacts[2].classList.contains('checked')).toBe(false);
  });

  it('saves changed task data via the TaskService', async () => {
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

  it('applies an open subtask text edit when saving the task', async () => {
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

  it('does not save an invalid edited task without a title', async () => {
    component.openTaskEdit(TEST_TASKS[0]);

    component.updateEditTitle({
      target: { value: '' },
    } as unknown as Event);

    await component.saveTaskEdit();

    expect(updateTaskSpy).not.toHaveBeenCalled();
    expect(component.editSubmitted()).toBe(true);
  });

  it('does not save an edited task with a date in the past', async () => {
    component.openTaskEdit(TEST_TASKS[0]);

    component.updateEditDueDate({
      target: { value: '2000-01-01' },
    } as unknown as Event);

    await component.saveTaskEdit();

    expect(component.editDueDateIsPast()).toBe(true);
    expect(updateTaskSpy).not.toHaveBeenCalled();
    expect(component.editSubmitted()).toBe(true);
  });

  it('shows the date error message immediately after entering a past date', () => {
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

  it('deletes the selected task via the TaskService', async () => {
    component.openTaskDetail(TEST_TASKS[0]);

    await component.deleteSelectedTask();

    expect(deleteTaskSpy).toHaveBeenCalledWith('a');
    expect(component.selectedTask()).toBeNull();
  });

  it('limits visible assignees on the task card and counts additional contacts', () => {
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

  it('limits visible assignees in the edit form and counts additional contacts', () => {
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

  it('shows fallback values for unknown contact IDs', () => {
    expect(component.assigneeInitials('unknown')).toBe('?');
    expect(component.assigneeName('unknown')).toBe('Unknown contact');
    expect(component.assigneeColor('unknown')).toBe('#ff7a00');
  });
});
