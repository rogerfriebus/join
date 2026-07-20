import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Contact } from '../../../../core/models/contact.model';

/**
 * Dialog-Komponente zum Anlegen eines neuen Kontakts.
 *
 * Gibt nach erfolgreicher Eingabe den neuen Kontakt (ohne `id`) per
 * `contactCreated` aus. Über `closed` signalisiert die Komponente,
 * dass der Dialog geschlossen werden soll.
 */
@Component({
  selector: 'app-add-contact-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-contact-dialog.html',
  styleUrl: './add-contact-dialog.scss',
})
export class AddContactDialog {
  /** Wird emittiert, wenn der Dialog geschlossen werden soll. */
  @Output() closed = new EventEmitter<void>();

  /** Wird nach erfolgreicher Eingabe mit dem neuen Kontakt (ohne id) emittiert. */
  @Output() contactCreated = new EventEmitter<Omit<Contact, 'id'>>();

  /** Aktueller Formularzustand. */
  form = {
    name: '',
    email: '',
    phone: '',
  };

  /** Bricht die Eingabe ab, setzt das Formular zurück und schließt den Dialog. */
  cancel(): void {
    this.resetForm();
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
   * Validiert das Formular und emittiert bei Erfolg den neuen Kontakt.
   * Bricht ab, wenn Pflichtfelder fehlen oder die E-Mail ungültig ist.
   */
  submit(): void {
    if (!this.form.name || !this.form.email || !this.form.phone || !this.isEmailValid(this.form.email)) return;

    const contact: Contact = {
      name: this.form.name.trim(),
      email: this.form.email.trim(),
      phone: this.form.phone.trim(),
      color: this.generateColor(),
      initials: this.generateInitials(this.form.name.trim()),
    };

    this.contactCreated.emit(contact);
    this.resetForm();
    this.closed.emit();
  }

  /** Setzt das Formular auf den Ausgangszustand zurück. */
  private resetForm(): void {
    this.form = { name: '', email: '', phone: '' };
  }

  /** Vordefinierte Avatar-Farben für zufällige Kontakt-Avatare. */
  private readonly avatarColors = [
    '#FF7A00', '#9327FF', '#6E52FF', '#FC71FF', '#FFBB2B',
    '#1FD7C1', '#462F8A', '#FF4646', '#00BEE8', '#FFA35E',
    '#FF5EB3', '#20D300',
  ];

  /** Wählt eine zufällige Farbe aus der Avatar-Farbpalette. */
  private generateColor(): string {
    return this.avatarColors[
      Math.floor(Math.random() * this.avatarColors.length)
    ];
  }

  /** Leitet Initialen (max. 2 Zeichen) aus einem vollständigen Namen ab. */
  private generateInitials(name: string): string {
    return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  }
}