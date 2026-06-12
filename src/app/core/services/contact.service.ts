import { Injectable, signal } from '@angular/core';
import { Contact } from '../models/contact.model';

/**
 * Platzhalter-Service für Kontakte.
 *
 * Aktuell arbeitet der Service mit lokalen Mock-Daten, damit die UI ohne
 * Backend entwickelt werden kann. Es werden BEWUSST keine Supabase-Keys
 * hier hinterlegt.
 *
 * TODO (Sprint 1+, gemeinsam):
 *  - Supabase-Client über environment-Konfiguration einbinden (keine Secrets im Repo).
 *  - getContacts/addContact/updateContact/deleteContact gegen die Tabelle `contacts` umsetzen.
 *  - Methoden auf asynchrone Rückgaben (Promise/Observable) umstellen.
 *  - Gast-Login und User teilen sich laut Kursvorgabe denselben Datenbestand.
 */
@Injectable({ providedIn: 'root' })
export class ContactService {
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
}
