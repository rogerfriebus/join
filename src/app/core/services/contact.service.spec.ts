import { ContactService } from './contact.service';
import { Contact } from '../models/contact.model';

/**
 * Gemockter Supabase-Client. Alle Query-Methoden sind verkettbar und das
 * Builder-Objekt ist "thenable", sodass `await` das konfigurierte Ergebnis
 * liefert OHNE echten Netzwerkaufruf. So testen die Unit-Tests die
 * Supabase-Methoden, ohne Supabase wirklich zu kontaktieren.
 */
const supabaseMock = vi.hoisted(() => {
  const calls: { method: string; args: unknown[] }[] = [];
  let result: { data: unknown; error: unknown } = { data: [], error: null };

  const builder: Record<string, unknown> = {};
  const chainable = ['from', 'select', 'order', 'insert', 'update', 'delete', 'eq'];
  for (const method of chainable) {
    builder[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return builder;
    };
  }
  // Terminierende Methoden geben ebenfalls den (thenable) Builder zurück.
  for (const method of ['single', 'maybeSingle']) {
    builder[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return builder;
    };
  }
  builder['then'] = (resolve: (value: unknown) => unknown) => resolve(result);

  return {
    calls,
    createClient: () => builder,
    reset: () => {
      calls.length = 0;
      result = { data: [], error: null };
    },
    setResult: (next: { data: unknown; error: unknown }) => {
      result = next;
    },
  };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => supabaseMock.createClient(),
}));

describe('ContactService', () => {
  let service: ContactService;

  // Frische Instanz pro Test: der Mock-Bestand ist mutable, daher dürfen
  // sich die Tests nicht über gemeinsamen State beeinflussen.
  beforeEach(() => {
    service = new ContactService();
  });

  describe('getContacts', () => {
    it('liefert eine Liste', () => {
      expect(Array.isArray(service.getContacts())).toBe(true);
    });

    it('enthält mindestens 10 Kontakte', () => {
      expect(service.getContacts().length).toBeGreaterThanOrEqual(10);
    });

    it('hat eindeutige IDs', () => {
      const ids = service.getContacts().map((contact) => contact.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('getContactById', () => {
    it('findet einen bestehenden Kontakt', () => {
      const first = service.getContacts()[0];
      expect(service.getContactById(first.id as string)).toEqual(first);
    });

    it('gibt undefined bei unbekannter ID zurück', () => {
      expect(service.getContactById('does-not-exist')).toBeUndefined();
    });
  });

  describe('addContact', () => {
    const draft: Contact = {
      name: 'Maximilian Vogel',
      email: 'maximilian.vogel@example.com',
      phone: '+49 155 9876543',
    };

    it('fügt einen Kontakt hinzu', () => {
      const before = service.getContacts().length;
      service.addContact(draft);
      expect(service.getContacts().length).toBe(before + 1);
    });

    it('erzeugt eine ID, wenn keine ID vorhanden ist', () => {
      const added = service.addContact(draft);
      expect(added.id).toBeTruthy();
    });

    it('erzeugt keine doppelte ID', () => {
      const added = service.addContact(draft);
      const ids = service.getContacts().map((contact) => contact.id);
      expect(ids.filter((id) => id === added.id).length).toBe(1);
    });

    it('macht den neuen Kontakt per getContactById auffindbar', () => {
      const added = service.addContact(draft);
      expect(service.getContactById(added.id as string)).toEqual(added);
    });
  });

  describe('updateContact', () => {
    it('aktualisiert einen bestehenden Kontakt', () => {
      const first = service.getContacts()[0];
      const updated = service.updateContact({ ...first, name: 'Geänderter Name' });
      expect(updated?.name).toBe('Geänderter Name');
      expect(service.getContactById(first.id as string)?.name).toBe('Geänderter Name');
    });

    it('gibt undefined bei unbekannter ID zurück', () => {
      const result = service.updateContact({
        id: 'does-not-exist',
        name: 'Niemand Nirgends',
        email: 'niemand@example.com',
        phone: '+49 100 0000000',
      });
      expect(result).toBeUndefined();
    });

    it('gibt undefined zurück, wenn keine ID gesetzt ist', () => {
      const result = service.updateContact({
        name: 'Ohne Id',
        email: 'ohne.id@example.com',
        phone: '+49 100 1111111',
      });
      expect(result).toBeUndefined();
    });
  });

  describe('deleteContact', () => {
    it('löscht einen bestehenden Kontakt und gibt true zurück', () => {
      const first = service.getContacts()[0];
      const before = service.getContacts().length;
      expect(service.deleteContact(first.id as string)).toBe(true);
      expect(service.getContacts().length).toBe(before - 1);
    });

    it('macht den Kontakt danach nicht mehr auffindbar', () => {
      const first = service.getContacts()[0];
      service.deleteContact(first.id as string);
      expect(service.getContactById(first.id as string)).toBeUndefined();
    });

    it('gibt false bei unbekannter ID zurück', () => {
      const before = service.getContacts().length;
      expect(service.deleteContact('does-not-exist')).toBe(false);
      expect(service.getContacts().length).toBe(before);
    });
  });

  // Diese Tests verwenden den gemockten Supabase-Client (siehe oben) und
  // führen daher KEINE echten Netzwerkaufrufe aus.
  describe('Supabase-Methoden', () => {
    beforeEach(() => {
      supabaseMock.reset();
    });

    it('loadContactsFromSupabase mappt snake_case auf camelCase und aktualisiert den Bestand', async () => {
      supabaseMock.setResult({
        data: [
          {
            id: 'u1',
            name: 'Demo Person',
            email: 'demo.person@example.com',
            phone: '+49 100 0000000',
            color: '#FF7A00',
            initials: 'DP',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-02-02T00:00:00Z',
          },
        ],
        error: null,
      });

      const result = await service.loadContactsFromSupabase();

      expect(result).toEqual([
        {
          id: 'u1',
          name: 'Demo Person',
          email: 'demo.person@example.com',
          phone: '+49 100 0000000',
          color: '#FF7A00',
          initials: 'DP',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-02-02T00:00:00Z',
        },
      ]);
      // Interner Signal-Bestand wurde aktualisiert (gemeinsame Datenquelle).
      expect(service.getContacts()).toEqual(result);
    });

    it('loadContactsFromSupabase wirft bei einem Supabase-Fehler', async () => {
      supabaseMock.setResult({ data: null, error: { message: 'boom' } });
      await expect(service.loadContactsFromSupabase()).rejects.toThrow(/boom/);
    });

    it('addContactToSupabase sendet ein snake_case-Payload und mappt das Ergebnis', async () => {
      supabaseMock.setResult({
        data: {
          id: 'new-id',
          name: 'Neuer Kontakt',
          email: 'neu@example.com',
          phone: '+49 100 1111111',
          color: null,
          initials: null,
          created_at: null,
          updated_at: null,
        },
        error: null,
      });

      const saved = await service.addContactToSupabase({
        name: 'Neuer Kontakt',
        email: 'neu@example.com',
        phone: '+49 100 1111111',
      });

      expect(saved.id).toBe('new-id');
      expect(saved.color).toBeUndefined();
      expect(saved.initials).toBeUndefined();

      const insertCall = supabaseMock.calls.find((call) => call.method === 'insert');
      expect(insertCall?.args[0]).toEqual({
        name: 'Neuer Kontakt',
        email: 'neu@example.com',
        phone: '+49 100 1111111',
        color: null,
        initials: null,
      });
    });

    it('updateContactInSupabase gibt ohne id undefined zurück und ruft Supabase nicht auf', async () => {
      const result = await service.updateContactInSupabase({
        name: 'Ohne Id',
        email: 'ohne.id@example.com',
        phone: '+49 100 2222222',
      });

      expect(result).toBeUndefined();
      expect(supabaseMock.calls.length).toBe(0);
    });

    it('deleteContactFromSupabase gibt true zurück, wenn eine Zeile gelöscht wurde', async () => {
      supabaseMock.setResult({ data: [{ id: 'del-id' }], error: null });
      expect(await service.deleteContactFromSupabase('del-id')).toBe(true);
    });

    it('deleteContactFromSupabase gibt false zurück, wenn keine Zeile gelöscht wurde', async () => {
      supabaseMock.setResult({ data: [], error: null });
      expect(await service.deleteContactFromSupabase('unbekannt')).toBe(false);
    });
  });
});
