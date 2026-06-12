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

  // TODO (Sprint 1+): Kontakt anlegen (Supabase INSERT).
  addContact(_contact: Contact): void {
    // TODO: Implementierung gegen Supabase.
  }

  // TODO (Sprint 1+): Kontakt aktualisieren (Supabase UPDATE).
  updateContact(_contact: Contact): void {
    // TODO: Implementierung gegen Supabase.
  }

  // TODO (Sprint 1+): Kontakt löschen (Supabase DELETE).
  deleteContact(_id: string): void {
    // TODO: Implementierung gegen Supabase.
  }
}
