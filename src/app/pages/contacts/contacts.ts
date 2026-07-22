import { Component, HostListener, inject, computed, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactService } from '../../core/services/contact.service';
import { AuthService } from '../../core/services/auth.service';
import { Contact, ContactGroup } from '../../core/models/contact.model';
import { AddContactDialog } from './dialogs/add-contact-dialog/add-contact-dialog';
import { EditContactDialog } from './dialogs/edit-contact-dialog/edit-contact-dialog';


/**
 * Contact management page.
 *
 * Displays all contacts grouped alphabetically and allows users
 * to select, add, edit, and delete contacts. On mobile devices,
 * the component switches between the list and detail views.
 */
@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [CommonModule, AddContactDialog, EditContactDialog],
  templateUrl: './contacts.html',
  styleUrls: ['./contacts.scss'],
})
export class Contacts implements OnInit {
  private contactService = inject(ContactService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  /** All contacts, including the currently logged-in user as a contact entry. */
  readonly contacts = computed(() =>
    this.contactService.getContactsWithCurrentUser(this.authService.user()),
  );

  /** Contact ID of the currently logged-in user. */
  readonly currentUserContactId = computed(() =>
    this.contactService.currentUserContactId(this.authService.user()),
  );

  /** Currently selected contact for the detail view, or null. */
  selectedContact: Contact | null = null;

  /** Controls the visibility of the add contact dialog. */
  showAddDialog = false;

  /** Controls the visibility of the edit contact dialog. */
  showEditDialog = false;

  /** Controls the visibility of the mobile FAB menu. */
  showFabMenu = false;

  /** Active mobile view: either the contact list or the detail view. */
  mobileView: 'list' | 'detail' = 'list';

  /** Indicates whether the device is considered mobile (width < 792px). */
  isMobile = window.innerWidth < 792;

  /** Updates the mobile breakpoint whenever the window is resized. */
  @HostListener('window:resize')
  onResize(): void {
    this.isMobile = window.innerWidth < 792;
  }

  /** Switches back to the list view on mobile devices and clears the selection. */
  backToList(): void {
    this.mobileView = 'list';
    this.selectedContact = null;
  }

  /** Toggles the mobile FAB menu and registers an outside-click listener if needed. */
  toggleFabMenu(): void {
    this.showFabMenu = !this.showFabMenu;
    if (this.showFabMenu) {
      setTimeout(() => {
        document.addEventListener('click', this.closeFabMenuHandler);
      }, 0);
    }
  }

  /** Closes the FAB menu when clicking outside and removes the event listener. */
  closeFabMenuHandler = (): void => {
    this.showFabMenu = false;
    document.removeEventListener('click', this.closeFabMenuHandler);
  };

  /** Closes the FAB menu programmatically and removes the event listener. */
  closeFabMenu(): void {
    this.showFabMenu = false;
    document.removeEventListener('click', this.closeFabMenuHandler);
  }

  /** All contacts sorted alphabetically and grouped by their first letter. */
  readonly groupedContacts = computed<ContactGroup[]>(() => {
    const sorted = [...this.contacts()].sort((a, b) =>
      a.name.localeCompare(b.name),
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

  /** Loads all contacts when the component is initialized. */
  async ngOnInit(): Promise<void> {
    await this.contactService.loadContacts();
  }

  /**
   * Selects a contact and displays its detail view.
   * Temporarily clears the selection to restart the entry animation.
   */
  selectContact(contact: Contact): void {
    this.selectedContact = null;

    setTimeout(() => {
      this.selectedContact = contact;

      if (this.isMobile) {
        this.mobileView = 'detail';
      }
      this.cdr.detectChanges();
    }, 50);
  }

  /** Saves a new contact using the ContactService. */
  async addContact(contact: Contact): Promise<void> {
    try {
      await this.contactService.addContact(contact);
    } catch (error) {
      console.error('Contact could not be saved.', error);
    }
  }

  /**
   * Updates an existing contact.
   * Handles the special case where the currently logged-in user edits
   * their own contact entry (it is created as a new contact instead of updated).
   */
  async saveContact(updated: Contact): Promise<void> {
    try {
      const result = this.contactService.isCurrentUserContactId(updated.id)
        ? await this.contactService.addContact({ ...updated, id: undefined })
        : await this.contactService.updateContact(updated);
      this.selectedContact = result ?? updated;
    } catch (error) {
      console.error('Contact could not be updated.', error);
    }
  }

  /** Deletes a contact and clears the current selection. */
  async deleteContact(contact: Contact): Promise<void> {
    if (!contact.id) return;
    try {
      await this.contactService.deleteContact(contact.id);
      this.selectedContact = null;
    } catch (error) {
      console.error('Contact could not be deleted.', error);
    }
  }

  /** Closes the FAB menu and opens the edit dialog for the selected contact. */
  openEdit(): void {
    this.showFabMenu = false;
    this.showEditDialog = true;
  }

  /** Closes the FAB menu and deletes the currently selected contact. */
  deleteSelected(): void {
    this.showFabMenu = false;
    if (this.selectedContact) this.deleteContact(this.selectedContact);
  }

  /** Returns the initials (up to two characters) derived from a full name. */
  getInitials(name: string): string {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}