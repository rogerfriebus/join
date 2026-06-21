import { TaskService } from './task.service';
import { Task } from '../models/task.model';

describe('TaskService', () => {
  let service: TaskService;

  // Frische Instanz pro Test: der Bestand ist mutable (per Signal), daher
  // dürfen sich die Tests nicht über gemeinsamen State beeinflussen.
  beforeEach(() => {
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

  describe('getTasks', () => {
    it('liefert eine Liste', () => {
      expect(Array.isArray(service.getTasks())).toBe(true);
    });

    it('enthält mindestens 5 Tasks', () => {
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

  describe('addTask', () => {
    it('fügt einen neuen Task hinzu', () => {
      const before = service.getTasks().length;
      service.addTask({ ...draft });
      expect(service.getTasks().length).toBe(before + 1);
    });

    it('erzeugt eine ID, wenn keine ID vorhanden ist', () => {
      const added = service.addTask({ ...draft, id: '' });
      expect(added.id).toBeTruthy();
    });

    it('erzeugt keine doppelte ID', () => {
      const added = service.addTask({ ...draft, id: '' });
      const ids = service.getTasks().map((task) => task.id);
      expect(ids.filter((id) => id === added.id).length).toBe(1);
    });

    it('macht den neuen Task per getTaskById auffindbar', () => {
      const added = service.addTask({ ...draft, id: '' });
      expect(service.getTaskById(added.id)).toEqual(added);
    });

    it('übernimmt eine vorhandene ID', () => {
      const added = service.addTask({ ...draft, id: 'custom-id' });
      expect(added.id).toBe('custom-id');
    });
  });

  describe('updateTask', () => {
    it('aktualisiert einen bestehenden Task', () => {
      const first = service.getTasks()[0];
      const updated = service.updateTask({ ...first, title: 'Geänderter Titel' });
      expect(updated?.title).toBe('Geänderter Titel');
      expect(service.getTaskById(first.id)?.title).toBe('Geänderter Titel');
    });

    it('gibt undefined bei unbekannter ID zurück', () => {
      const result = service.updateTask({ ...draft, id: 'does-not-exist' });
      expect(result).toBeUndefined();
    });

    it('gibt undefined ohne ID zurück', () => {
      const result = service.updateTask({ ...draft, id: '' });
      expect(result).toBeUndefined();
    });
  });

  describe('deleteTask', () => {
    it('löscht einen bestehenden Task und gibt true zurück', () => {
      const first = service.getTasks()[0];
      const before = service.getTasks().length;
      expect(service.deleteTask(first.id)).toBe(true);
      expect(service.getTasks().length).toBe(before - 1);
    });

    it('macht den Task danach nicht mehr auffindbar', () => {
      const first = service.getTasks()[0];
      service.deleteTask(first.id);
      expect(service.getTaskById(first.id)).toBeUndefined();
    });

    it('gibt false bei unbekannter ID zurück', () => {
      const before = service.getTasks().length;
      expect(service.deleteTask('does-not-exist')).toBe(false);
      expect(service.getTasks().length).toBe(before);
    });
  });

  describe('updateTaskStatus', () => {
    it('ändert den Status eines bestehenden Tasks', () => {
      const first = service.getTasks()[0];
      const updated = service.updateTaskStatus(first.id, 'done');
      expect(updated?.status).toBe('done');
      expect(service.getTaskById(first.id)?.status).toBe('done');
    });

    it('lässt andere Felder unverändert', () => {
      const first = service.getTasks()[0];
      const updated = service.updateTaskStatus(first.id, 'done');
      expect(updated?.title).toBe(first.title);
    });

    it('gibt undefined bei unbekannter ID zurück', () => {
      expect(service.updateTaskStatus('does-not-exist', 'done')).toBeUndefined();
    });
  });

  describe('updateSubtaskStatus', () => {
    /** Liefert den ersten Task, der mindestens einen Subtask besitzt. */
    function taskWithSubtask() {
      return service.getTasks().find((task) => task.subtasks.length > 0)!;
    }

    it('ändert den done-Wert eines bestehenden Subtasks', () => {
      const task = taskWithSubtask();
      const subtask = task.subtasks[0];
      const updated = service.updateSubtaskStatus(task.id, subtask.id, !subtask.done);
      const changed = updated?.subtasks.find((s) => s.id === subtask.id);
      expect(changed?.done).toBe(!subtask.done);
      expect(
        service.getTaskById(task.id)?.subtasks.find((s) => s.id === subtask.id)?.done,
      ).toBe(!subtask.done);
    });

    it('gibt undefined bei unbekanntem Task zurück', () => {
      expect(service.updateSubtaskStatus('does-not-exist', 'sub', true)).toBeUndefined();
    });

    it('gibt undefined bei unbekanntem Subtask zurück', () => {
      const task = taskWithSubtask();
      expect(service.updateSubtaskStatus(task.id, 'does-not-exist', true)).toBeUndefined();
    });
  });
});
