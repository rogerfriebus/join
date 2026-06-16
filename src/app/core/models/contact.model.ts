/**
 * Datenmodell für einen Kontakt.
 *
 * Spiegelt die geplante Supabase-Tabelle `contacts` wider (siehe
 * docs/supabase-setup.md). In der DB sind die Felder snake_case
 * (created_at / updated_at); im Frontend nutzen wir camelCase.
 */
export interface Contact {
  /** UUID, in Supabase Primary Key. Bei neuen, noch nicht gespeicherten Kontakten optional. */
  id?: string;
  /** Vollständiger Name (Vor- und Nachname). Pflichtfeld. */
  name: string;
  /** E-Mail-Adresse. Pflichtfeld. */
  email: string;
  /** Telefonnummer (nur Ziffern, optional führendes +). Pflichtfeld. */
  phone: string;
  /** Avatar-Farbe (Hex), für die spätere Contacts-UI. Optional, ggf. ableitbar. */
  color?: string;
  /** Initialen (z. B. "AS"), für die spätere Contacts-UI. Optional, ggf. ableitbar. */
  initials?: string;
  /** Erstellungszeitpunkt (ISO-String), wird von Supabase gesetzt. */
  createdAt?: string;
  /** Letzter Änderungszeitpunkt (ISO-String), wird von Supabase gesetzt. */
  updatedAt?: string;
}

export interface ContactGroup {
  letter: string;
  contacts: Contact[];
}