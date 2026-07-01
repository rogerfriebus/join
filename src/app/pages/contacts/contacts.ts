import { Component, HostListener, inject, computed, OnInit } from '@angular/core';
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

  readonly contacts = this.contactService.contacts;

  selectedContact: Contact | null = null;

  showAddDialog = false;
  showEditDialog = false;
  showFabMenu = false;

  mobileView: 'list' | 'detail' = 'list';
  isMobile = window.innerWidth < 792;

  @HostListener('window:resize')
  onResize(): void {
    this.isMobile = window.innerWidth < 792;
  }

  backToList(): void {
    this.mobileView = 'list';
    this.selectedContact = null;
  }

  toggleFabMenu(): void {
    this.showFabMenu = !this.showFabMenu;
    if (this.showFabMenu) {
      setTimeout(() => {
        document.addEventListener('click', this.closeFabMenuHandler);
      }, 0);
    }
  }

  closeFabMenuHandler = (): void => {
    this.showFabMenu = false;
    document.removeEventListener('click', this.closeFabMenuHandler);
  }

  closeFabMenu(): void {
    this.showFabMenu = false;
    document.removeEventListener('click', this.closeFabMenuHandler);
  }

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

  async ngOnInit(): Promise<void> {
    await this.contactService.loadContacts();
  }

  selectContact(contact: Contact): void {
    this.selectedContact = contact;
    if (this.isMobile) this.mobileView = 'detail';
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

  openEdit(): void {
    this.showFabMenu = false;
    this.showEditDialog = true;
  }

  deleteSelected(): void {
    this.showFabMenu = false;
    if (this.selectedContact) this.deleteContact(this.selectedContact);
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