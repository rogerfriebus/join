/*import { Component, inject } from '@angular/core';
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
 *
@Component({
  selector: 'app-contacts',
  imports: [],
  templateUrl: './contacts.html',
  styleUrl: './contacts.scss',
})
export class Contacts {
  private readonly contactService = inject(ContactService);

  //Vorerst die Mock-Kontakte; später aus Supabase.
  readonly contacts: Contact[] = this.contactService.getContacts();
}*/

import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactService } from '../../core/services/contact.service';
import { Contact, ContactGroup } from '../../core/models/contact.model';


@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contacts.html',
  styleUrls: ['./contacts.scss'],
})
export class Contacts {
  private contactService = inject(ContactService);

  readonly contacts: Contact[] = this.contactService.getContacts();
  
  selectedContact: Contact | null = null;

  readonly groupedContacts: ContactGroup[] = computed(() => {
    const sorted = [...this.contacts].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    const groups = new Map<string, Contact[]>();

    for (const contact of sorted) {
      const letter = contact.name[0].toUpperCase();
      if (!groups.has(letter)) {
        groups.set(letter, []);
      }
      groups.get(letter)!.push(contact);
    }

    return Array.from(groups.entries()).map(([letter, contacts]) => ({
      letter,
      contacts,
    }));
  })();

  selectContact(contact: Contact): void {
    this.selectedContact = contact;
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}