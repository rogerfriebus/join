import { Component, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactService } from '../../core/services/contact.service';
import { Contact, ContactGroup } from '../../core/models/contact.model';
import { AddContactDialog } from './dialogs/add-contact-dialog/add-contact-dialog';
import { EditContactDialog } from './dialogs/edit-contact-dialog/edit-contact-dialog';


@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [CommonModule, AddContactDialog, EditContactDialog],
  templateUrl: './contacts.html',
  styleUrls: ['./contacts.scss'],
})
export class Contacts implements OnInit {
  private contactService = inject(ContactService);

  /** Read-only Kontakt-Signal aus der ContactService-Fassade. */
  readonly contacts = this.contactService.contacts;

  selectedContact: Contact | null = null;

  showAddDialog = false;
  showEditDialog = false;

  /** Reaktiv nach Anfangsbuchstaben gruppierte, alphabetisch sortierte Kontakte. */
  readonly groupedContacts = computed<ContactGroup[]>(() => {
    const sorted = [...this.contacts()].sort((a, b) =>
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
  });

  /** Lädt die Kontakte beim Öffnen der Seite über die Fassade aus Supabase. */
  async ngOnInit(): Promise<void> {
    await this.contactService.loadContacts();
  }

  selectContact(contact: Contact): void {
    this.selectedContact = contact;
  }

  async addContact(contact: Contact): Promise<void> {
    try {
      await this.contactService.addContact(contact);
    } catch (error) {
      console.error('Kontakt konnte nicht gespeichert werden.', error);
    }
  }

  async saveContact(updated: Contact): Promise<void> {
    try {
      const result = await this.contactService.updateContact(updated);
      this.selectedContact = result ?? updated;
    } catch (error) {
      console.error('Kontakt konnte nicht aktualisiert werden.', error);
    }
  }

  async deleteContact(contact: Contact): Promise<void> {
    if (!contact.id) return;
    try {
      await this.contactService.deleteContact(contact.id);
      this.selectedContact = null;
    } catch (error) {
      console.error('Kontakt konnte nicht gelöscht werden.', error);
    }
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