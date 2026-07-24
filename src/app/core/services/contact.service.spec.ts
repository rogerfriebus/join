import { ContactService } from './contact.service';
import { Contact } from '../models/contact.model';
import { useSupabaseTestClient } from '../../../test-setup';

/**
 * Mocked Supabase client. All query methods are chainable and the builder
 * object is "thenable", so `await` resolves to the configured result WITHOUT a
 * real network call. This lets the unit tests exercise the Supabase methods
 * without actually contacting Supabase.
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
  // Terminating methods also return the (thenable) builder.
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

describe('ContactService', () => {
  let service: ContactService;

  // Fresh instance per test: the mock store is mutable, so the tests must not
  // influence each other through shared state. The globally mocked Supabase
  // client (see src/test-setup.ts) is pointed at this spec's builder and reset
  // before every test so no test depends on the Supabase result configured by a
  // previous test (or a previous spec).
  beforeEach(() => {
    useSupabaseTestClient(() => supabaseMock.createClient());
    supabaseMock.reset();
    service = new ContactService();
  });

  describe('getContacts', () => {
    it('returns a list', () => {
      expect(Array.isArray(service.getContacts())).toBe(true);
    });

    it('contains at least 10 contacts', () => {
      expect(service.getContacts().length).toBeGreaterThanOrEqual(10);
    });

    it('has unique IDs', () => {
      const ids = service.getContacts().map((contact) => contact.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('getContactById', () => {
    it('finds an existing contact', () => {
      const first = service.getContacts()[0];
      expect(service.getContactById(first.id as string)).toEqual(first);
    });

    it('returns undefined for an unknown ID', () => {
      expect(service.getContactById('does-not-exist')).toBeUndefined();
    });
  });

  // The facade CRUD methods go through the mocked Supabase client and update
  // the signal afterwards. NO real network calls.
  describe('addContact (facade)', () => {
    const draft: Contact = {
      name: 'Maximilian Vogel',
      email: 'maximilian.vogel@example.com',
      phone: '+49 155 9876543',
    };

    beforeEach(() => {
      supabaseMock.reset();
      supabaseMock.setResult({
        data: {
          id: 'db-id',
          name: draft.name,
          email: draft.email,
          phone: draft.phone,
          color: null,
          initials: null,
          created_at: null,
          updated_at: null,
        },
        error: null,
      });
    });

    it('saves to Supabase and adds the contact to the store', async () => {
      const before = service.getContacts().length;
      await service.addContact(draft);
      expect(service.getContacts().length).toBe(before + 1);
    });

    it('returns the contact stored in Supabase with its DB id', async () => {
      const added = await service.addContact(draft);
      expect(added.id).toBe('db-id');
    });

    it('makes the new contact findable via getContactById', async () => {
      const added = await service.addContact(draft);
      expect(service.getContactById(added.id as string)).toEqual(added);
    });
  });

  describe('updateContact (facade)', () => {
    beforeEach(() => {
      supabaseMock.reset();
    });

    it('updates an existing contact in the store and Supabase', async () => {
      const first = service.getContacts()[0];
      supabaseMock.setResult({
        data: {
          id: first.id,
          name: 'Updated name',
          email: first.email,
          phone: first.phone,
          color: first.color ?? null,
          initials: first.initials ?? null,
          created_at: null,
          updated_at: null,
        },
        error: null,
      });

      const updated = await service.updateContact({ ...first, name: 'Updated name' });
      expect(updated?.name).toBe('Updated name');
      expect(service.getContactById(first.id as string)?.name).toBe('Updated name');
    });

    it('returns undefined when no ID is set (without a Supabase call)', async () => {
      const result = await service.updateContact({
        name: 'Ohne Id',
        email: 'ohne.id@example.com',
        phone: '+49 100 1111111',
      });
      expect(result).toBeUndefined();
      expect(supabaseMock.calls.length).toBe(0);
    });

    it('returns undefined for an unknown record', async () => {
      supabaseMock.setResult({ data: null, error: null });
      const result = await service.updateContact({
        id: 'does-not-exist',
        name: 'Niemand Nirgends',
        email: 'niemand@example.com',
        phone: '+49 100 0000000',
      });
      expect(result).toBeUndefined();
    });
  });

  describe('deleteContact (facade)', () => {
    beforeEach(() => {
      supabaseMock.reset();
    });

    it('deletes an existing contact and returns true', async () => {
      const first = service.getContacts()[0];
      const before = service.getContacts().length;
      supabaseMock.setResult({ data: [{ id: first.id }], error: null });

      expect(await service.deleteContact(first.id as string)).toBe(true);
      expect(service.getContacts().length).toBe(before - 1);
      expect(service.getContactById(first.id as string)).toBeUndefined();
    });

    it('returns false when no row was deleted', async () => {
      const before = service.getContacts().length;
      supabaseMock.setResult({ data: [], error: null });

      expect(await service.deleteContact('does-not-exist')).toBe(false);
      expect(service.getContacts().length).toBe(before);
    });
  });

  describe('loadContacts (facade)', () => {
    beforeEach(() => {
      supabaseMock.reset();
    });

    it('loads from Supabase and updates the public signal', async () => {
      supabaseMock.setResult({
        data: [
          {
            id: 'sb1',
            name: 'Cloud contact',
            email: 'cloud@example.com',
            phone: '+49 100 3333333',
            color: null,
            initials: null,
            created_at: null,
            updated_at: null,
          },
        ],
        error: null,
      });

      await service.loadContacts();
      expect(service.contacts().map((c) => c.id)).toEqual(['sb1']);
    });

    it('keeps the mock fallback on a Supabase error and does not throw', async () => {
      const before = service.getContacts().length;
      supabaseMock.setResult({ data: null, error: { message: 'offline' } });

      await expect(service.loadContacts()).resolves.toBeUndefined();
      expect(service.getContacts().length).toBe(before);
    });
  });

  // These tests use the mocked Supabase client (see above) and therefore make
  // NO real network calls.
  describe('Supabase methods', () => {
    beforeEach(() => {
      supabaseMock.reset();
    });

    it('loadContactsFromSupabase maps snake_case to camelCase and updates the store', async () => {
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
      // The internal signal store was updated (shared data source).
      expect(service.getContacts()).toEqual(result);
    });

    it('loadContactsFromSupabase throws on a Supabase error', async () => {
      supabaseMock.setResult({ data: null, error: { message: 'boom' } });
      await expect(service.loadContactsFromSupabase()).rejects.toThrow(/boom/);
    });

    it('addContactToSupabase sends a snake_case payload and maps the result', async () => {
      supabaseMock.setResult({
        data: {
          id: 'new-id',
          name: 'New contact',
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
        name: 'New contact',
        email: 'neu@example.com',
        phone: '+49 100 1111111',
      });

      expect(saved.id).toBe('new-id');
      expect(saved.color).toBeUndefined();
      expect(saved.initials).toBeUndefined();

      const insertCall = supabaseMock.calls.find((call) => call.method === 'insert');
      expect(insertCall?.args[0]).toEqual({
        name: 'New contact',
        email: 'neu@example.com',
        phone: '+49 100 1111111',
        color: null,
        initials: null,
      });
    });

    it('updateContactInSupabase returns undefined without an id and does not call Supabase', async () => {
      const result = await service.updateContactInSupabase({
        name: 'Ohne Id',
        email: 'ohne.id@example.com',
        phone: '+49 100 2222222',
      });

      expect(result).toBeUndefined();
      expect(supabaseMock.calls.length).toBe(0);
    });

    it('deleteContactFromSupabase returns true when a row was deleted', async () => {
      supabaseMock.setResult({ data: [{ id: 'del-id' }], error: null });
      expect(await service.deleteContactFromSupabase('del-id')).toBe(true);
    });

    it('deleteContactFromSupabase returns false when no row was deleted', async () => {
      supabaseMock.setResult({ data: [], error: null });
      expect(await service.deleteContactFromSupabase('unbekannt')).toBe(false);
    });
  });

  // Sprint 3 - Turquoise 5: current auth user as a contact.
  describe('Current-User-Contact integration', () => {
    const user = { id: 'u1', name: 'Nina Test', email: 'nina.test@example.com', isGuest: false };
    const guest = { id: 'guest', name: 'Guest', isGuest: true };

    it('buildContactFromUser derives a contact with a stable id and initials', () => {
      const contact = service.buildContactFromUser(user);
      expect(contact?.id).toBe('auth-u1');
      expect(contact?.name).toBe('Nina Test');
      expect(contact?.email).toBe('nina.test@example.com');
      expect(contact?.initials).toBe('NT');
      expect(contact?.color).toBeTruthy();
    });

    it('buildContactFromUser returns null without a user', () => {
      expect(service.buildContactFromUser(null)).toBeNull();
    });

    it('buildContactFromUser handles a guest sensibly (name Guest, empty email)', () => {
      const contact = service.buildContactFromUser(guest);
      expect(contact?.id).toBe('auth-guest');
      expect(contact?.name).toBe('Guest');
      expect(contact?.email).toBe('');
      expect(contact?.initials).toBe('G');
    });

    it('getContactsWithCurrentUser adds the logged-in user at the top', () => {
      const before = service.getContacts().length;
      const list = service.getContactsWithCurrentUser(user);
      expect(list.length).toBe(before + 1);
      expect(list[0].id).toBe('auth-u1');
    });

    it('getContactsWithCurrentUser without a user returns the unchanged store', () => {
      expect(service.getContactsWithCurrentUser(null)).toEqual(service.getContacts());
    });

    it('does not create a duplicate when a contact with the same email already exists', () => {
      const existing = service.getContacts()[0];
      const sameEmailUser = { id: 'x', name: 'Anders Benannt', email: existing.email, isGuest: false };
      const list = service.getContactsWithCurrentUser(sameEmailUser);
      expect(list.length).toBe(service.getContacts().length);
      expect(service.currentUserContactId(sameEmailUser)).toBe(existing.id);
    });

    it('currentUserContactId returns the synthetic id when no existing contact matches', () => {
      expect(service.currentUserContactId(user)).toBe('auth-u1');
    });

    it('isCurrentUserContactId recognizes synthetic ids', () => {
      expect(service.isCurrentUserContactId('auth-u1')).toBe(true);
      expect(service.isCurrentUserContactId('1')).toBe(false);
      expect(service.isCurrentUserContactId(undefined)).toBe(false);
    });
  });
});
