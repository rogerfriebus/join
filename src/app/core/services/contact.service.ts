import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Contact } from '../models/contact.model';
import { AuthUser } from './auth.service';
import { environment } from '../../../environments/environment';

/** Name of the Supabase table for contacts. */
const CONTACTS_TABLE = 'contacts';

/** Prefix of the stable id of a contact derived from the auth user. */
const CURRENT_USER_CONTACT_PREFIX = 'auth-';

/** Avatar color of the own account (Join accent color). */
const CURRENT_USER_CONTACT_COLOR = '#29ABE2';

/**
 * Shape of a contact row in the Supabase table `contacts` (snake_case).
 * See docs/supabase-setup.md.
 */
interface ContactRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  color: string | null;
  initials: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/** Fields sent to Supabase on insert/update (without id/timestamps). */
type ContactRowPayload = Pick<ContactRow, 'name' | 'email' | 'phone' | 'color' | 'initials'>;

/** Maps a Supabase row (snake_case) to the frontend model (camelCase). */
function mapRowToContact(row: ContactRow): Contact {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    color: row.color ?? undefined,
    initials: row.initials ?? undefined,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

/** Maps the frontend model (camelCase) to the insert/update payload (snake_case). */
function mapContactToRowPayload(contact: Contact): ContactRowPayload {
  return {
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    color: contact.color ?? null,
    initials: contact.initials ?? null,
  };
}

/** Derives initials from a name (max. 2 characters, uppercase). */
function deriveInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Normalizes a contact into a stable, complete form: guarantees present
 * initials (derived from the name if not set). The id is deliberately left
 * untouched so that CRUD references stay stable.
 */
function normalizeContact(contact: Contact): Contact {
  return {
    ...contact,
    initials: contact.initials?.trim() || deriveInitials(contact.name),
  };
}

/**
 * Stable seed contact set with fixed string IDs ("1"…"12").
 *
 * Serves two purposes:
 *  1. Initial/fallback set of the visible signal (development without a backend).
 *  2. Immutable reference directory: the demo tasks reference contacts via these
 *     stable IDs. Through them the board mapping stays deterministic, even after
 *     the visible signal has been replaced with Supabase data (UUIDs).
 */
const SEED_CONTACTS: readonly Contact[] = [
  { id: '1', name: 'Anja Schulz', email: 'anja.schulz@example.com', phone: '+49 151 1234567', initials: 'AS', color: '#FF7A00' },
  { id: '2', name: 'Benjamin Krüger', email: 'benjamin.krueger@example.com', phone: '+49 160 2345678', initials: 'BK', color: '#9327FF' },
  { id: '3', name: 'Carolin Weber', email: 'carolin.weber@example.com', phone: '+49 170 3456789', initials: 'CW', color: '#6E52FF' },
  { id: '4', name: 'David Hoffmann', email: 'david.hoffmann@example.com', phone: '+49 152 4567890', initials: 'DH', color: '#FC71FF' },
  { id: '5', name: 'Elena Fischer', email: 'elena.fischer@example.com', phone: '+49 171 5678901', initials: 'EF', color: '#FFBB2B' },
  { id: '6', name: 'Florian Becker', email: 'florian.becker@example.com', phone: '+49 162 6789012', initials: 'FB', color: '#1FD7C1' },
  { id: '7', name: 'Greta Wagner', email: 'greta.wagner@example.com', phone: '+49 172 7890123', initials: 'GW', color: '#462F8A' },
  { id: '8', name: 'Hannes Richter', email: 'hannes.richter@example.com', phone: '+49 153 8901234', initials: 'HR', color: '#FF4646' },
  { id: '9', name: 'Isabel Neumann', email: 'isabel.neumann@example.com', phone: '+49 163 9012345', initials: 'IN', color: '#00BEE8' },
  { id: '10', name: 'Jonas Schäfer', email: 'jonas.schaefer@example.com', phone: '+49 173 0123456', initials: 'JS', color: '#FFA35E' },
  { id: '11', name: 'Katharina Lange', email: 'katharina.lange@example.com', phone: '+49 154 1234567', initials: 'KL', color: '#FF5EB3' },
  { id: '12', name: 'Lukas Brandt', email: 'lukas.brandt@example.com', phone: '+49 174 2345678', initials: 'LB', color: '#20D300' },
].map(normalizeContact);

/**
 * Central service for contacts.
 *
 * The service is the central place for the contacts data logic. It still keeps
 * local mock data as a fallback (so the UI can be developed without a reachable
 * backend) and additionally offers Supabase methods to load contacts from the
 * cloud and to write them.
 *
 * Demo setup (Developer Akademie):
 *  - Supabase is connected via project URL + publishable key from the
 *    environment files. NO secret/service-role keys are used, deliberately.
 *  - The current demo RLS allows anon access to `contacts`
 *    (not production-ready).
 */
@Injectable({ providedIn: 'root' })
export class ContactService {
  /**
   * Supabase client, created lazily. It is instantiated only on the first
   * Supabase access so that the pure mock methods (and unit tests that use only
   * the mock) work without a client. `createClient` opens no connection and
   * makes no network call before a query is started.
   */
  private supabaseClient: SupabaseClient | null = null;
  /**
   * Visible contact set. Starts as a copy of the stable seed and is replaced
   * with Supabase data (real UUIDs) on load – this copy may therefore be
   * mutated/replaced without touching the immutable seed.
   */
  private readonly mockContacts = signal<Contact[]>(SEED_CONTACTS.map((contact) => ({ ...contact })));

  /**
   * Immutable resolution table of the seed contacts by their stable id
   * ("1"…"12"). Unlike the visible signal, it is NEVER replaced by Supabase
   * data and serves as a deterministic anchor so that the `assignedContactIds`
   * of the demo tasks stay resolvable across the entire lifecycle (no "?" after
   * the switch from mock → Supabase).
   */
  private readonly seedContactsById: ReadonlyMap<string, Contact> = new Map(
    SEED_CONTACTS.map((contact) => [contact.id as string, contact]),
  );

  /**
   * Public, read-only access to the current contact set.
   *
   * This is the central data source of the facade: UI components read contacts
   * exclusively through it (reactively) and do NOT access the private signal or
   * the Supabase methods.
   */
  readonly contacts = this.mockContacts.asReadonly();

  /**
   * Loads the contact set from Supabase and updates the signal.
   *
   * Facade method for the UI. If loading fails, the existing (mock) set is kept
   * as a fallback and the error is logged – so the method deliberately does not
   * throw.
   */
  async loadContacts(): Promise<void> {
    try {
      await this.loadContactsFromSupabase();
    } catch (error) {
      console.error(
        'Could not load contacts from Supabase – mock fallback stays active.',
        error,
      );
    }
  }

  /** Returns the current contact set (snapshot). */
  getContacts(): Contact[] {
    return this.mockContacts();
  }

  /** Returns a single contact by id, or undefined if not found. */
  getContactById(id: string): Contact | undefined {
    return this.mockContacts().find((contact) => contact.id === id);
  }

  /**
   * Resolves an `assignedContactId` deterministically to a contact.
   *
   * Resolution order:
   *  1. Current (possibly Supabase) set by id – for tasks with real
   *     contact UUIDs.
   *  2. Stable seed by id ("1"…"12") – for the demo tasks, whose references
   *     remain valid even after the signal has been replaced with UUIDs.
   *
   * This keeps the board mapping stable and never yields "?" merely because of
   * a switch of the data source (mock → Supabase).
   */
  resolveContact(contactId: string): Contact | undefined {
    return (
      this.mockContacts().find((contact) => contact.id === contactId) ??
      this.seedContactsById.get(contactId)
    );
  }

  /**
   * Creates a contact: saves it in Supabase and then updates the visible set
   * (signal). Returns the saved contact including the id generated by the DB.
   *
   * Facade method for the UI.
   */
  async addContact(contact: Contact): Promise<Contact> {
    const saved = await this.addContactToSupabase(contact);
    this.mockContacts.update((contacts) => [...contacts, saved]);
    return saved;
  }

  /**
   * Updates an existing contact: saves the change in Supabase and then updates
   * the visible set (signal). Returns undefined when no id is set or no
   * matching record exists.
   *
   * Facade method for the UI.
   */
  async updateContact(contact: Contact): Promise<Contact | undefined> {
    const updated = await this.updateContactInSupabase(contact);
    if (updated) {
      this.mockContacts.update((contacts) =>
        contacts.map((c) => (c.id === updated.id ? updated : c)),
      );
    }
    return updated;
  }

  /**
   * Removes a contact: deletes it in Supabase and then updates the visible set
   * (signal). Returns true when a contact was deleted, otherwise false.
   *
   * Facade method for the UI.
   */
  async deleteContact(id: string): Promise<boolean> {
    const deleted = await this.deleteContactFromSupabase(id);
    if (deleted) {
      this.mockContacts.update((contacts) => contacts.filter((c) => c.id !== id));
    }
    return deleted;
  }

  // ---------------------------------------------------------------------------
  // Current auth user as a contact (Sprint 3: Turquoise 5)
  //
  // The logged-in user should be visible and editable in the contacts list. The
  // logic is deliberately implemented as pure methods parameterized with the
  // AuthUser (NO AuthService injection) so that ContactService stays testable
  // without an injection context (`new ContactService()`) as before. The
  // reactive link with the AuthService happens on the contacts page.
  // ---------------------------------------------------------------------------

  /** True when the id marks a (synthetic) contact derived from the auth user. */
  isCurrentUserContactId(id: string | undefined): boolean {
    return id?.startsWith(CURRENT_USER_CONTACT_PREFIX) ?? false;
  }

  /**
   * Derives a contact from the current auth user (or null when nobody is logged
   * in). Name/email come from the user; initials and a fixed accent color are
   * added. The id is stable: `auth-<userId>`.
   * Guests (without email) get a sensible "Guest" contact.
   */
  buildContactFromUser(user: AuthUser | null | undefined): Contact | null {
    if (!user) {
      return null;
    }
    const name = user.name?.trim() || (user.isGuest ? 'Guest' : user.email?.trim() || 'User');
    return normalizeContact({
      id: `${CURRENT_USER_CONTACT_PREFIX}${user.id}`,
      name,
      email: user.email?.trim() ?? '',
      phone: '',
      color: CURRENT_USER_CONTACT_COLOR,
    });
  }

  /**
   * Combined contact list: existing set + current auth user as a contact,
   * without a duplicate. If a contact for the user already exists (match by
   * email, otherwise by name), NO synthetic entry is created. The own account
   * appears at the very top.
   */
  getContactsWithCurrentUser(user: AuthUser | null | undefined): Contact[] {
    const base = this.mockContacts();
    const self = this.buildContactFromUser(user);
    if (!self) {
      return base;
    }
    return this.findExistingUserContact(self, base) ? base : [self, ...base];
  }

  /**
   * Returns the id of the contact that represents the current auth user in the
   * combined list – either an already existing contact (match by email/name) or
   * the synthetic `auth-<userId>`. undefined without a user.
   */
  currentUserContactId(user: AuthUser | null | undefined): string | undefined {
    const self = this.buildContactFromUser(user);
    if (!self) {
      return undefined;
    }
    return this.findExistingUserContact(self, this.mockContacts())?.id ?? self.id;
  }

  /**
   * Searches the set for a contact that already represents the derived user
   * contact: preferably by (non-empty) email, otherwise by name – each
   * case-insensitive. Prevents duplicates and re-registers an already saved own
   * contact (after editing) correctly as the "own" one.
   */
  private findExistingUserContact(self: Contact, base: Contact[]): Contact | undefined {
    const email = self.email.trim().toLowerCase();
    if (email) {
      return base.find((contact) => contact.email.trim().toLowerCase() === email);
    }
    const name = self.name.trim().toLowerCase();
    return base.find((contact) => contact.name.trim().toLowerCase() === name);
  }

  // ---------------------------------------------------------------------------
  // Supabase access
  //
  // These methods talk to the Supabase table `contacts`. The existing mock
  // methods remain unchanged as a fallback. On a failure the methods throw so
  // that callers can fall back to the mock set.
  // ---------------------------------------------------------------------------

  /**
   * Returns the lazily created Supabase client. Configuration comes from the
   * Angular environment files (project URL + publishable key, no secret).
   */
  private getClient(): SupabaseClient {
    if (!this.supabaseClient) {
      this.supabaseClient = createClient(
        environment.supabase.url,
        environment.supabase.publishableKey,
      );
    }
    return this.supabaseClient;
  }

  /**
   * Loads all contacts from Supabase and returns them as frontend models.
   * On success the internal signal set is additionally updated so that the UI
   * can later use the same data source. Throws on an error.
   */
  async loadContactsFromSupabase(): Promise<Contact[]> {
    const { data, error } = await this.getClient()
      .from(CONTACTS_TABLE)
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Could not load contacts from Supabase: ${error.message}`);
    }

    const contacts = ((data ?? []) as ContactRow[]).map(mapRowToContact);
    this.mockContacts.set(contacts);
    return contacts;
  }

  /**
   * Creates a contact in Supabase and returns the saved contact (including the
   * id/timestamps generated by the DB). Throws on an error.
   */
  async addContactToSupabase(contact: Contact): Promise<Contact> {
    const { data, error } = await this.getClient()
      .from(CONTACTS_TABLE)
      .insert(mapContactToRowPayload(contact))
      .select()
      .single();

    if (error) {
      throw new Error(`Could not create contact in Supabase: ${error.message}`);
    }

    return mapRowToContact(data as ContactRow);
  }

  /**
   * Updates a contact in Supabase by its id and returns the updated contact.
   * Returns undefined when no id is set or no matching record exists. Throws on
   * an error.
   */
  async updateContactInSupabase(contact: Contact): Promise<Contact | undefined> {
    if (!contact.id) {
      return undefined;
    }

    const { data, error } = await this.getClient()
      .from(CONTACTS_TABLE)
      .update(mapContactToRowPayload(contact))
      .eq('id', contact.id)
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(`Could not update contact in Supabase: ${error.message}`);
    }

    return data ? mapRowToContact(data as ContactRow) : undefined;
  }

  /**
   * Deletes a contact in Supabase by its id. Returns true when a record was
   * deleted, otherwise false. Throws on an error.
   */
  async deleteContactFromSupabase(id: string): Promise<boolean> {
    const { data, error } = await this.getClient()
      .from(CONTACTS_TABLE)
      .delete()
      .eq('id', id)
      .select('id');

    if (error) {
      throw new Error(`Could not delete contact from Supabase: ${error.message}`);
    }

    return (data?.length ?? 0) > 0;
  }
}
