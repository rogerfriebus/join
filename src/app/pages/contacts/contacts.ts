import { Component, inject } from '@angular/core';
import { ContactService } from '../../core/services/contact.service';
import { Contact } from '../../core/models/contact.model';

/**
 * Contacts-Seite (Sprint-1-Basis).
 *
 * Zeigt vorerst nur die Mock-Kontakte aus dem ContactService. Die eigentliche
 * Fachlogik wird schrittweise ergänzt.
 *
 * TODO (Sprint 1, Marko + gemeinsam):
 *  - Kontakte alphabetisch nach Anfangsbuchstabe gruppieren (A, B, C ...).
 *  - Detailansicht für einen ausgewählten Kontakt.
 *  - Add Contact (Dialog/Formular).
 *  - Edit Contact (Dialog/Formular).
 *  - Delete Contact.
 *  - Formular-Validierung (siehe contacts.html / docs).
 */
@Component({
  selector: 'app-contacts',
  imports: [],
  templateUrl: './contacts.html',
  styleUrl: './contacts.scss',
})
export class Contacts {
  private readonly contactService = inject(ContactService);

  /** Vorerst die Mock-Kontakte; später aus Supabase. */
  readonly contacts: Contact[] = this.contactService.getContacts();
}
