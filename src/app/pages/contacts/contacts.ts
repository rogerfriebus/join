import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactService } from '../../core/services/contact.service';
import { Contact, ContactGroup } from '../../core/models/contact.model';
import { AddContactDialog} from './dialogs/add-contact-dialog/add-contact-dialog';


@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [CommonModule,  AddContactDialog],
  templateUrl: './contacts.html',
  styleUrls: ['./contacts.scss'],
})
export class Contacts {
  private contactService = inject(ContactService);

  readonly contacts: Contact[] = this.contactService.getContacts();

  selectedContact: Contact | null = null;

  showAddDialog = false;

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