import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Contact } from '../../../../core/models/contact.model';

/**
 * Dialog-Komponente zum Bearbeiten eines bestehenden Kontakts.
 *
 * Erhält den zu bearbeitenden Kontakt per `contact`-Input und emittiert
 * den aktualisierten Kontakt per `saved`, den ursprünglichen Kontakt zum
 * Löschen per `deleted` oder schließt sich selbst per `closed`.
 */
@Component({
  selector: 'app-edit-contact-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-contact-dialog.html',
  styleUrls: ['./edit-contact-dialog.scss'],
})
export class EditContactDialog implements OnInit {
  /** Der zu bearbeitende Kontakt (Pflicht-Input). */
  @Input({ required: true }) contact!: Contact;

  /** Wird emittiert, wenn der Dialog geschlossen werden soll. */
  @Output() closed = new EventEmitter<void>();

  /** Wird nach erfolgreichem Speichern mit dem aktualisierten Kontakt emittiert. */
  @Output() saved = new EventEmitter<Contact>();

  /** Wird emittiert, wenn der Kontakt gelöscht werden soll. */
  @Output() deleted = new EventEmitter<Contact>();

  /** Aktueller Formularzustand, vorbelegt mit den Daten des übergebenen Kontakts. */
  form = {
    name: '',
    email: '',
    phone: '',
  };

  /** Befüllt das Formular mit den aktuellen Kontaktdaten beim Öffnen des Dialogs. */
  ngOnInit(): void {
    this.form = {
      name: this.contact.name,
      email: this.contact.email,
      phone: this.contact.phone,
    };
  }

  /** Schließt den Dialog ohne Änderungen zu speichern. */
  cancel(): void {
    this.closed.emit();
  }

  /** Prüft, ob die eingegebene E-Mail-Adresse dem erwarteten Format entspricht. */
  isEmailValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
  }

  /** Prüft, ob die eingegebene Telefonnummer dem erwarteten Format entspricht. */
  isPhoneValid(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-()]{7,20}$/;
    return phoneRegex.test(phone.trim());
  }

  /**
   * Validiert das Formular und emittiert bei Erfolg den aktualisierten Kontakt.
   * Bricht ab, wenn Pflichtfelder fehlen, die E-Mail oder Telefonnummer ungültig ist.
   */
  save(): void {
    if (
      !this.form.name ||
      !this.form.email ||
      !this.form.phone ||
      !this.isEmailValid(this.form.email) ||
      !this.isPhoneValid(this.form.phone)
    ) return;

    const updated: Contact = {
      ...this.contact,
      name: this.form.name.trim(),
      email: this.form.email.trim(),
      phone: this.form.phone.trim(),
      initials: this.getInitials(this.form.name.trim()),
    };

    this.saved.emit(updated);
    this.closed.emit();
  }

  /**
   * Emittiert den aktuellen Kontakt zum Löschen und schließt den Dialog.
   * Bricht ab, wenn der Kontakt keine id besitzt.
   */
  delete(): void {
    if (!this.contact.id) return;
    this.deleted.emit(this.contact);
    this.closed.emit();
  }

  /** Leitet Initialen (max. 2 Zeichen) aus einem vollständigen Namen ab. */
  getInitials(name: string): string {
    return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  }
}