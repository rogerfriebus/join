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

/** Leitet Initialen aus einem Namen ab (max. 2 Zeichen, Großbuchstaben). */
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
 * Normalisiert einen Kontakt in eine stabile, vollständige Form: garantiert
 * vorhandene Initialen (aus dem Namen abgeleitet, falls nicht gesetzt). Die
 * id bleibt bewusst unangetastet, damit CRUD-Referenzen stabil bleiben.
 */
function normalizeContact(contact: Contact): Contact {
  return {
    ...contact,
    initials: contact.initials?.trim() || deriveInitials(contact.name),
  };
}

/**
 * Stabiler Seed-Kontaktbestand mit festen String-IDs ("1"…"12").
 *
 * Dient zwei Zwecken:
 *  1. Initialer/Fallback-Bestand des sichtbaren Signals (Entwicklung ohne Backend).
 *  2. Unveränderliche Referenz-Directory: Die Demo-Tasks referenzieren Kontakte
 *     über diese stabilen IDs. Über sie bleibt das Board-Mapping deterministisch,
 *     auch nachdem das sichtbare Signal mit Supabase-Daten (UUIDs) ersetzt wurde.
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
   * Sichtbarer Kontaktbestand. Startet als Kopie des stabilen Seeds und wird
   * beim Laden durch Supabase-Daten (echte UUIDs) ersetzt – diese Kopie darf
   * daher mutiert/ersetzt werden, ohne den unveränderlichen Seed zu berühren.
   */
  private readonly mockContacts = signal<Contact[]>(SEED_CONTACTS.map((contact) => ({ ...contact })));

  /**
   * Unveränderliche Auflösungstabelle der Seed-Kontakte nach ihrer stabilen id
   * ("1"…"12"). Wird – anders als das sichtbare Signal – NIEMALS durch
   * Supabase-Daten ersetzt und dient als deterministischer Anker, damit die
   * `assignedContactIds` der Demo-Tasks über den gesamten Lifecycle auflösbar
   * bleiben (kein "?" nach dem Wechsel Mock → Supabase).
   */
  private readonly seedContactsById: ReadonlyMap<string, Contact> = new Map(
    SEED_CONTACTS.map((contact) => [contact.id as string, contact]),
  );

  /**
   * Öffentlicher, read-only Zugriff auf den aktuellen Kontaktbestand.
   *
   * Dies ist die zentrale Datenquelle der Fassade: UI-Komponenten lesen
   * Kontakte ausschließlich hierüber (reaktiv) und greifen NICHT auf das
   * private Signal oder die Supabase-Methoden zu.
   */
  readonly contacts = this.mockContacts.asReadonly();

  /**
   * Lädt den Kontaktbestand aus Supabase und aktualisiert das Signal.
   *
   * Fassaden-Methode für die UI. Schlägt das Laden fehl, bleibt der
   * bestehende (Mock-)Bestand als Fallback erhalten und der Fehler wird
   * geloggt – die Methode wirft also bewusst nicht.
   */
  async loadContacts(): Promise<void> {
    try {
      await this.loadContactsFromSupabase();
    } catch (error) {
      console.error(
        'Kontakte konnten nicht aus Supabase geladen werden – Mock-Fallback bleibt aktiv.',
        error,
      );
    }
  }

  /** Liefert den aktuellen Kontaktbestand (Snapshot). */
  getContacts(): Contact[] {
    return this.mockContacts();
  }

  /** Liefert einen einzelnen Kontakt anhand der id oder undefined, wenn nicht gefunden. */
  getContactById(id: string): Contact | undefined {
    return this.mockContacts().find((contact) => contact.id === id);
  }

  /**
   * Löst eine `assignedContactId` deterministisch auf einen Kontakt auf.
   *
   * Auflösungsreihenfolge:
   *  1. Aktueller (ggf. Supabase-)Bestand nach id – für Tasks mit echten
   *     Contact-UUIDs.
   *  2. Stabiler Seed nach id ("1"…"12") – für die Demo-Tasks, deren Referenzen
   *     erhalten bleiben, auch nachdem das Signal mit UUIDs ersetzt wurde.
   *
   * Dadurch bleibt das Board-Mapping stabil und liefert nie "?" allein durch
   * einen Wechsel der Datenquelle (Mock → Supabase).
   */
  resolveContact(contactId: string): Contact | undefined {
    return (
      this.mockContacts().find((contact) => contact.id === contactId) ??
      this.seedContactsById.get(contactId)
    );
  }

  /**
   * Legt einen Kontakt an: speichert ihn in Supabase und aktualisiert danach
   * den sichtbaren Bestand (Signal). Gibt den gespeicherten Kontakt inkl. der
   * von der DB erzeugten id zurück.
   *
   * Fassaden-Methode für die UI.
   */
  async addContact(contact: Contact): Promise<Contact> {
    const saved = await this.addContactToSupabase(contact);
    this.mockContacts.update((contacts) => [...contacts, saved]);
    return saved;
  }

  /**
   * Aktualisiert einen bestehenden Kontakt: speichert die Änderung in Supabase
   * und aktualisiert danach den sichtbaren Bestand (Signal). Liefert undefined,
   * wenn keine id gesetzt ist oder kein passender Datensatz existiert.
   *
   * Fassaden-Methode für die UI.
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
   * Entfernt einen Kontakt: löscht ihn in Supabase und aktualisiert danach den
   * sichtbaren Bestand (Signal). Gibt true zurück, wenn ein Kontakt gelöscht
   * wurde, sonst false.
   *
   * Fassaden-Methode für die UI.
   */
  async deleteContact(id: string): Promise<boolean> {
    const deleted = await this.deleteContactFromSupabase(id);
    if (deleted) {
      this.mockContacts.update((contacts) => contacts.filter((c) => c.id !== id));
    }
    return deleted;
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
