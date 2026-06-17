import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Contact } from '../models/contact.model';
import { environment } from '../../../environments/environment';

/** Name der Supabase-Tabelle für Kontakte. */
const CONTACTS_TABLE = 'contacts';

/**
 * Form einer Kontaktzeile in der Supabase-Tabelle `contacts` (snake_case).
 * Siehe docs/supabase-setup.md.
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

/** Felder, die beim Insert/Update an Supabase gesendet werden (ohne id/Timestamps). */
type ContactRowPayload = Pick<ContactRow, 'name' | 'email' | 'phone' | 'color' | 'initials'>;

/** Mappt eine Supabase-Zeile (snake_case) auf das Frontend-Modell (camelCase). */
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

/** Mappt das Frontend-Modell (camelCase) auf das Insert-/Update-Payload (snake_case). */
function mapContactToRowPayload(contact: Contact): ContactRowPayload {
  return {
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    color: contact.color ?? null,
    initials: contact.initials ?? null,
  };
}

/**
 * Zentraler Service für Kontakte.
 *
 * Der Service ist die zentrale Stelle für die Contacts-Datenlogik. Er hält
 * weiterhin lokale Mock-Daten als Fallback (damit die UI ohne erreichbares
 * Backend entwickelt werden kann) und bietet zusätzlich Supabase-Methoden,
 * um Kontakte aus der Cloud zu laden bzw. zu schreiben.
 *
 * Demo-Setup (Developer-Akademie):
 *  - Supabase wird über Project URL + Publishable Key aus den environment-Dateien
 *    angebunden. Es werden BEWUSST keine Secret/Service-Role-Keys verwendet.
 *  - Die aktuelle Demo-RLS erlaubt anon-Zugriff auf `contacts`
 *    (nicht produktionsreif).
 */
@Injectable({ providedIn: 'root' })
export class ContactService {
  /**
   * Supabase-Client, lazy erzeugt. Wird erst beim ersten Supabase-Zugriff
   * instanziiert, damit die reinen Mock-Methoden (und Unit-Tests, die nur den
   * Mock nutzen) ohne Client auskommen. `createClient` öffnet keine Verbindung
   * und führt keinen Netzwerkaufruf aus, bevor eine Query gestartet wird.
   */
  private supabaseClient: SupabaseClient | null = null;
  /**
   * Mock-Datenbestand für die Entwicklung. Mindestens 10 seriöse Kontakte
   * für die Sprint-Abgabe. Wird später durch Supabase-Daten ersetzt.
   */
  private readonly mockContacts = signal<Contact[]>([
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
  ]);

  /** Liefert den aktuellen Kontaktbestand (vorerst Mock-Daten). */
  getContacts(): Contact[] {
    return this.mockContacts();
  }

  /** Liefert einen einzelnen Kontakt anhand der id oder undefined, wenn nicht gefunden. */
  getContactById(id: string): Contact | undefined {
    return this.mockContacts().find((contact) => contact.id === id);
  }

  /**
   * Legt einen Kontakt im (Mock-)Bestand an und gibt den gespeicherten
   * Kontakt zurück. Fehlt eine id, wird eine eindeutige id erzeugt.
   *
   * Später (Supabase): INSERT in die Tabelle `contacts`; die id kommt dann
   * aus der Datenbank.
   */
  addContact(contact: Contact): Contact {
    const id = contact.id ?? this.generateId();
    const newContact: Contact = { ...contact, id };
    this.mockContacts.update((contacts) => [...contacts, newContact]);
    return newContact;
  }

  /**
   * Aktualisiert einen bestehenden Kontakt anhand seiner id und gibt den
   * aktualisierten Kontakt zurück. Liefert undefined, wenn keine id gesetzt
   * ist oder kein Kontakt mit dieser id existiert.
   *
   * Später (Supabase): UPDATE der Zeile mit passender id.
   */
  updateContact(contact: Contact): Contact | undefined {
    if (!contact.id) {
      return undefined;
    }
    const index = this.mockContacts().findIndex((c) => c.id === contact.id);
    if (index === -1) {
      return undefined;
    }
    const updated: Contact = { ...contact };
    this.mockContacts.update((contacts) => {
      const next = [...contacts];
      next[index] = updated;
      return next;
    });
    return updated;
  }

  /**
   * Entfernt einen Kontakt anhand seiner id. Gibt true zurück, wenn ein
   * Kontakt entfernt wurde, sonst false.
   *
   * Später (Supabase): DELETE der Zeile mit passender id.
   */
  deleteContact(id: string): boolean {
    const before = this.mockContacts().length;
    this.mockContacts.update((contacts) => contacts.filter((c) => c.id !== id));
    return this.mockContacts().length < before;
  }

  /**
   * Erzeugt eine eindeutige id für neue Kontakte (Mock-Betrieb).
   * Basiert auf der höchsten vorhandenen numerischen id + 1 und stellt
   * sicher, dass die id noch nicht vergeben ist. Mit Supabase entfällt dies.
   */
  private generateId(): string {
    const numericIds = this.mockContacts()
      .map((contact) => Number(contact.id))
      .filter((value) => Number.isFinite(value));
    let next = (numericIds.length ? Math.max(...numericIds) : 0) + 1;
    const existing = new Set(this.mockContacts().map((contact) => contact.id));
    while (existing.has(String(next))) {
      next++;
    }
    return String(next);
  }

  // ---------------------------------------------------------------------------
  // Supabase-Zugriff
  //
  // Diese Methoden sprechen die Supabase-Tabelle `contacts` an. Die bestehenden
  // Mock-Methoden bleiben unverändert als Fallback erhalten. Bei einem
  // Fehlschlag werfen die Methoden, damit Aufrufer auf den Mock-Bestand
  // zurückfallen können.
  // ---------------------------------------------------------------------------

  /**
   * Liefert den lazy erzeugten Supabase-Client. Konfiguration kommt aus den
   * Angular-environment-Dateien (Project URL + Publishable Key, kein Secret).
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
   * Lädt alle Kontakte aus Supabase und gibt sie als Frontend-Modelle zurück.
   * Bei Erfolg wird zusätzlich der interne Signal-Bestand aktualisiert, damit
   * die UI später dieselbe Datenquelle nutzen kann. Wirft bei einem Fehler.
   */
  async loadContactsFromSupabase(): Promise<Contact[]> {
    const { data, error } = await this.getClient()
      .from(CONTACTS_TABLE)
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Kontakte konnten nicht aus Supabase geladen werden: ${error.message}`);
    }

    const contacts = ((data ?? []) as ContactRow[]).map(mapRowToContact);
    this.mockContacts.set(contacts);
    return contacts;
  }

  /**
   * Legt einen Kontakt in Supabase an und gibt den gespeicherten Kontakt
   * (inkl. von der DB erzeugter id/Timestamps) zurück. Wirft bei einem Fehler.
   */
  async addContactToSupabase(contact: Contact): Promise<Contact> {
    const { data, error } = await this.getClient()
      .from(CONTACTS_TABLE)
      .insert(mapContactToRowPayload(contact))
      .select()
      .single();

    if (error) {
      throw new Error(`Kontakt konnte nicht in Supabase angelegt werden: ${error.message}`);
    }

    return mapRowToContact(data as ContactRow);
  }

  /**
   * Aktualisiert einen Kontakt in Supabase anhand seiner id und gibt den
   * aktualisierten Kontakt zurück. Liefert undefined, wenn keine id gesetzt
   * ist oder kein passender Datensatz existiert. Wirft bei einem Fehler.
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
      throw new Error(`Kontakt konnte nicht in Supabase aktualisiert werden: ${error.message}`);
    }

    return data ? mapRowToContact(data as ContactRow) : undefined;
  }

  /**
   * Löscht einen Kontakt in Supabase anhand seiner id. Gibt true zurück, wenn
   * ein Datensatz gelöscht wurde, sonst false. Wirft bei einem Fehler.
   */
  async deleteContactFromSupabase(id: string): Promise<boolean> {
    const { data, error } = await this.getClient()
      .from(CONTACTS_TABLE)
      .delete()
      .eq('id', id)
      .select('id');

    if (error) {
      throw new Error(`Kontakt konnte nicht aus Supabase gelöscht werden: ${error.message}`);
    }

    return (data?.length ?? 0) > 0;
  }
}
