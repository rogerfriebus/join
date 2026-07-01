import { TaskService } from './task.service';
import { Task } from '../models/task.model';

/**
 * Gemockter Supabase-Client für Tasks/Subtasks.
 *
 * Alle Query-Methoden sind verkettbar; das Builder-Objekt ist "thenable" und
 * löst je nach zuletzt adressierter Tabelle (`from(table)`) das konfigurierte
 * Ergebnis auf – OHNE echten Netzwerkaufruf. So lassen sich Load-, Write- und
 * Mapping-Pfade testen, ohne Supabase wirklich zu kontaktieren.
 */
const supabaseMock = vi.hoisted(() => {
  const calls: { method: string; table: string; args: unknown[] }[] = [];
  let currentTable = '';
  const results: Record<string, { data: unknown; error: unknown }> = {
    tasks: { data: [], error: null },
    subtasks: { data: [], error: null },
  };

  const builder: Record<string, unknown> = {};
  for (const method of ['select', 'order', 'insert', 'update', 'upsert', 'delete', 'eq', 'single', 'maybeSingle']) {
    builder[method] = (...args: unknown[]) => {
      calls.push({ method, table: currentTable, args });
      return builder;
    };
  }
  builder['from'] = (table: string) => {
    currentTable = table;
    calls.push({ method: 'from', table, args: [table] });
    return builder;
  };
  builder['then'] = (resolve: (value: unknown) => unknown) =>
    resolve(results[currentTable] ?? { data: null, error: null });

  return {
    calls,
    createClient: () => builder,
    reset: () => {
      calls.length = 0;
      currentTable = '';
      results['tasks'] = { data: [], error: null };
      results['subtasks'] = { data: [], error: null };
    },
    setTableResult: (table: string, next: { data: unknown; error: unknown }) => {
      results[table] = next;
    },
  };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => supabaseMock.createClient(),
}));

describe('TaskService', () => {
  let service: TaskService;

  beforeEach(() => {
    supabaseMock.reset();
    service = new TaskService();
  });

  const draft: Task = {
    id: '',
    title: 'Neuer Demo-Task',
    dueDate: '2026-08-01',
    priority: 'medium',
    category: 'Technical Task',
    status: 'todo',
    assignedContactIds: ['1'],
    subtasks: [],
  };

  // ---- synchrone Lesezugriffe (arbeiten auf dem Demo-/Signal-Bestand) -------

  describe('getTasks', () => {
    it('liefert eine Liste', () => {
      expect(Array.isArray(service.getTasks())).toBe(true);
    });

    it('enthält mindestens 5 Tasks (Demo-Fallback)', () => {
      expect(service.getTasks().length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('getTaskById', () => {
    it('findet einen bestehenden Task', () => {
      const first = service.getTasks()[0];
      expect(service.getTaskById(first.id)).toEqual(first);
    });

    it('gibt undefined bei unbekannter ID zurück', () => {
      expect(service.getTaskById('does-not-exist')).toBeUndefined();
    });
  });

  // ---- Supabase-Fassade -----------------------------------------------------

  describe('loadTasks', () => {
    it('lädt Tasks und Subtasks, mappt snake_case→camelCase und aktualisiert das Signal', async () => {
      supabaseMock.setTableResult('tasks', {
        data: [
          {
            id: 'sbT',
            title: 'Cloud Task',
            description: 'Aus Supabase geladen',
            due_date: '2026-09-01',
            priority: 'urgent',
            category: 'User Story',
            status: 'todo',
            assigned_contact_ids: ['1', '2'],
            created_at: '2026-08-01',
            updated_at: '2026-08-02',
          },
        ],
        error: null,
      });
      supabaseMock.setTableResult('subtasks', {
        data: [
          { id: 'sbT-s1', task_id: 'sbT', title: 'Cloud Subtask', done: true, position: 0, created_at: null, updated_at: null },
        ],
        error: null,
      });

      await service.loadTasks();

      const tasks = service.getTasks();
      expect(tasks.map((t) => t.id)).toEqual(['sbT']);
      expect(tasks[0]).toEqual({
        id: 'sbT',
        title: 'Cloud Task',
        description: 'Aus Supabase geladen',
        dueDate: '2026-09-01',
        priority: 'urgent',
        category: 'User Story',
        status: 'todo',
        assignedContactIds: ['1', '2'],
        subtasks: [{ id: 'sbT-s1', title: 'Cloud Subtask', done: true }],
        createdAt: '2026-08-01',
        updatedAt: '2026-08-02',
      });
    });

    it('behält den Demo-Fallback bei einem Supabase-Fehler und wirft nicht', async () => {
      const before = service.getTasks().length;
      supabaseMock.setTableResult('tasks', { data: null, error: { message: 'offline' } });

      await expect(service.loadTasks()).resolves.toBeUndefined();
      expect(service.getTasks().length).toBe(before);
    });
  });

  describe('addTask', () => {
    const savedRow = {
      id: 't7',
      title: 'Neuer Demo-Task',
      description: null,
      due_date: '2026-08-01',
      priority: 'medium',
      category: 'Technical Task',
      status: 'todo',
      assigned_contact_ids: ['1'],
      created_at: null,
      updated_at: null,
    };

    beforeEach(() => {
      supabaseMock.setTableResult('tasks', { data: savedRow, error: null });
    });

    it('speichert in Supabase und fügt den Task dem Bestand hinzu', async () => {
      const before = service.getTasks().length;
      await service.addTask({ ...draft });
      expect(service.getTasks().length).toBe(before + 1);
    });

    it('gibt den gespeicherten Task zurück und macht ihn auffindbar', async () => {
      const added = await service.addTask({ ...draft });
      expect(added.id).toBe('t7');
      expect(service.getTaskById('t7')).toEqual(added);
    });

    it('erzeugt eine ID im Upsert-Payload, wenn keine vorhanden ist', async () => {
      await service.addTask({ ...draft, id: '' });
      const upsertCall = supabaseMock.calls.find((c) => c.method === 'upsert');
      expect((upsertCall?.args[0] as { id?: string })?.id).toBeTruthy();
    });

    it('übernimmt eine vorhandene ID im Upsert-Payload', async () => {
      await service.addTask({ ...draft, id: 'custom-id' });
      const upsertCall = supabaseMock.calls.find((c) => c.method === 'upsert');
      expect((upsertCall?.args[0] as { id?: string })?.id).toBe('custom-id');
    });
  });

  describe('updateTask', () => {
    it('aktualisiert Task in Supabase und Bestand', async () => {
      const first = service.getTasks()[0];
      supabaseMock.setTableResult('tasks', {
        data: {
          id: first.id,
          title: 'Geänderter Titel',
          description: first.description ?? null,
          due_date: first.dueDate,
          priority: first.priority,
          category: first.category,
          status: first.status,
          assigned_contact_ids: first.assignedContactIds,
          created_at: null,
          updated_at: null,
        },
        error: null,
      });

      const updated = await service.updateTask({ ...first, title: 'Geänderter Titel' });
      expect(updated?.title).toBe('Geänderter Titel');
      expect(service.getTaskById(first.id)?.title).toBe('Geänderter Titel');
    });

    it('gibt undefined ohne ID zurück (ohne Supabase-Aufruf)', async () => {
      const result = await service.updateTask({ ...draft, id: '' });
      expect(result).toBeUndefined();
      expect(supabaseMock.calls.length).toBe(0);
    });

    it('gibt undefined bei unbekanntem Task zurück', async () => {
      supabaseMock.setTableResult('tasks', { data: null, error: null });
      const result = await service.updateTask({ ...draft, id: 'does-not-exist' });
      expect(result).toBeUndefined();
    });
  });

  describe('deleteTask', () => {
    it('löscht über Supabase und aktualisiert den Bestand', async () => {
      const first = service.getTasks()[0];
      const before = service.getTasks().length;
      supabaseMock.setTableResult('tasks', { data: [{ id: first.id }], error: null });

      expect(await service.deleteTask(first.id)).toBe(true);
      expect(service.getTasks().length).toBe(before - 1);
      expect(service.getTaskById(first.id)).toBeUndefined();
    });

    it('gibt false zurück, wenn keine Zeile gelöscht wurde', async () => {
      const before = service.getTasks().length;
      supabaseMock.setTableResult('tasks', { data: [], error: null });

      expect(await service.deleteTask('does-not-exist')).toBe(false);
      expect(service.getTasks().length).toBe(before);
    });
  });

  describe('updateTaskStatus', () => {
    it('ändert den Status in Supabase und Bestand', async () => {
      const first = service.getTasks()[0];
      supabaseMock.setTableResult('tasks', {
        data: {
          id: first.id,
          title: first.title,
          description: first.description ?? null,
          due_date: first.dueDate,
          priority: first.priority,
          category: first.category,
          status: 'done',
          assigned_contact_ids: first.assignedContactIds,
          created_at: null,
          updated_at: null,
        },
        error: null,
      });

      const updated = await service.updateTaskStatus(first.id, 'done');
      expect(updated?.status).toBe('done');
      expect(service.getTaskById(first.id)?.status).toBe('done');
    });

    it('gibt undefined bei unbekannter ID zurück', async () => {
      supabaseMock.setTableResult('tasks', { data: null, error: null });
      expect(await service.updateTaskStatus('does-not-exist', 'done')).toBeUndefined();
    });
  });

  describe('updateSubtaskStatus', () => {
    function taskWithSubtask() {
      return service.getTasks().find((task) => task.subtasks.length > 0)!;
    }

    it('ändert den done-Wert in Supabase und Bestand', async () => {
      const task = taskWithSubtask();
      const subtask = task.subtasks[0];
      supabaseMock.setTableResult('subtasks', {
        data: { id: subtask.id, task_id: task.id, title: subtask.title, done: !subtask.done, position: 0, created_at: null, updated_at: null },
        error: null,
      });

      const updated = await service.updateSubtaskStatus(task.id, subtask.id, !subtask.done);
      expect(updated?.subtasks.find((s) => s.id === subtask.id)?.done).toBe(!subtask.done);
      expect(
        service.getTaskById(task.id)?.subtasks.find((s) => s.id === subtask.id)?.done,
      ).toBe(!subtask.done);
    });

    it('gibt undefined bei unbekanntem Task zurück (ohne Supabase-Aufruf)', async () => {
      const result = await service.updateSubtaskStatus('does-not-exist', 'sub', true);
      expect(result).toBeUndefined();
      expect(supabaseMock.calls.length).toBe(0);
    });

    it('gibt undefined bei unbekanntem Subtask zurück (ohne Supabase-Aufruf)', async () => {
      const task = taskWithSubtask();
      const result = await service.updateSubtaskStatus(task.id, 'does-not-exist', true);
      expect(result).toBeUndefined();
      expect(supabaseMock.calls.length).toBe(0);
    });
  });
});
