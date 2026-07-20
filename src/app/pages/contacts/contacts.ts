import { Component, HostListener, inject, computed, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactService } from '../../core/services/contact.service';
import { AuthService } from '../../core/services/auth.service';
import { Contact, ContactGroup } from '../../core/models/contact.model';
import { AddContactDialog } from './dialogs/add-contact-dialog/add-contact-dialog';
import { EditContactDialog } from './dialogs/edit-contact-dialog/edit-contact-dialog';

/**
 * Seite zur Verwaltung von Kontakten.
 *
 * Zeigt alle Kontakte alphabetisch gruppiert in einer Liste an und erlaubt
 * das Auswählen, Hinzufügen, Bearbeiten und Löschen von Kontakten. Auf
 * mobilen Geräten wird zwischen Listen- und Detailansicht umgeschaltet.
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

  /** Alle Kontakte inklusive des eingeloggten Benutzers als Kontakteintrag. */
  readonly contacts = computed(() =>
    this.contactService.getContactsWithCurrentUser(this.authService.user()),
  );

  /** ID des Kontakteintrags des aktuell eingeloggten Benutzers. */
  readonly currentUserContactId = computed(() =>
    this.contactService.currentUserContactId(this.authService.user()),
  );

  /** Aktuell ausgewählter Kontakt für die Detailansicht, oder null. */
  selectedContact: Contact | null = null;

  /** Sichtbarkeit des Dialogs zum Hinzufügen eines neuen Kontakts. */
  showAddDialog = false;

  /** Sichtbarkeit des Dialogs zum Bearbeiten des ausgewählten Kontakts. */
  showEditDialog = false;

  /** Sichtbarkeit des mobilen FAB-Menüs. */
  showFabMenu = false;

  /** Aktive Ansicht auf mobilen Geräten: Liste oder Detailansicht. */
  mobileView: 'list' | 'detail' = 'list';

  /** Gibt an, ob das Gerät als mobil eingestuft wird (Breite < 792px). */
  isMobile = window.innerWidth < 792;

  /** Aktualisiert den mobilen Breakpoint bei Größenänderung des Fensters. */
  @HostListener('window:resize')
  onResize(): void {
    this.isMobile = window.innerWidth < 792;
  }

  /** Wechselt auf mobilen Geräten zurück zur Listenansicht und hebt die Auswahl auf. */
  backToList(): void {
    this.mobileView = 'list';
    this.selectedContact = null;
  }

  /** Öffnet oder schließt das mobile FAB-Menü und registriert ggf. einen Outside-Click-Handler. */
  toggleFabMenu(): void {
    this.showFabMenu = !this.showFabMenu;
    if (this.showFabMenu) {
      setTimeout(() => {
        document.addEventListener('click', this.closeFabMenuHandler);
      }, 0);
    }
  }

  /** Schließt das FAB-Menü bei einem Klick außerhalb und entfernt den Event-Listener. */
  closeFabMenuHandler = (): void => {
    this.showFabMenu = false;
    document.removeEventListener('click', this.closeFabMenuHandler);
  };

  /** Schließt das FAB-Menü programmatisch und entfernt den Event-Listener. */
  closeFabMenu(): void {
    this.showFabMenu = false;
    document.removeEventListener('click', this.closeFabMenuHandler);
  }

  /** Alle Kontakte alphabetisch sortiert und nach Anfangsbuchstaben gruppiert. */
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

  /** Lädt alle Kontakte beim Initialisieren der Seite. */
  async ngOnInit(): Promise<void> {
    await this.contactService.loadContacts();
  }

  /**
   * Wählt einen Kontakt aus und zeigt seine Detailansicht an.
   * Setzt den Kontakt kurz auf null, um eine Animations-Neuinitialisierung auszulösen.
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

  /** Speichert einen neuen Kontakt über den ContactService. */
  async addContact(contact: Contact): Promise<void> {
    try {
      await this.contactService.addContact(contact);
    } catch (error) {
      console.error('Kontakt konnte nicht gespeichert werden.', error);
    }
  }

  /**
   * Aktualisiert einen bestehenden Kontakt.
   * Handhabt den Sonderfall, dass der aktuelle Benutzer seinen eigenen
   * Kontakteintrag bearbeitet (wird als neuer Kontakt angelegt statt aktualisiert).
   */
  async saveContact(updated: Contact): Promise<void> {
    try {
      const result = this.contactService.isCurrentUserContactId(updated.id)
        ? await this.contactService.addContact({ ...updated, id: undefined })
        : await this.contactService.updateContact(updated);
      this.selectedContact = result ?? updated;
    } catch (error) {
      console.error('Kontakt konnte nicht aktualisiert werden.', error);
    }
  }

  /** Löscht einen Kontakt und hebt die aktuelle Auswahl auf. */
  async deleteContact(contact: Contact): Promise<void> {
    if (!contact.id) return;
    try {
      await this.contactService.deleteContact(contact.id);
      this.selectedContact = null;
    } catch (error) {
      console.error('Kontakt konnte nicht gelöscht werden.', error);
    }
  }

  /** Schließt das FAB-Menü und öffnet den Edit-Dialog für den ausgewählten Kontakt. */
  openEdit(): void {
    this.showFabMenu = false;
    this.showEditDialog = true;
  }

  /** Schließt das FAB-Menü und löscht den aktuell ausgewählten Kontakt. */
  deleteSelected(): void {
    this.showFabMenu = false;
    if (this.selectedContact) this.deleteContact(this.selectedContact);
  }

  /** Leitet Initialen (max. 2 Zeichen) aus einem vollständigen Namen ab. */
  getInitials(name: string): string {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}