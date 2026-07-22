import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Contact } from '../../../../core/models/contact.model';


/**
 * Dialog component for creating a new contact.
 *
 * Emits the newly created contact (without an `id`) via
 * `contactCreated` after successful submission. The `closed`
 * event signals that the dialog should be closed.
 */
@Component({
  selector: 'app-add-contact-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-contact-dialog.html',
  styleUrl: './add-contact-dialog.scss',
})
export class AddContactDialog {
  /** Emitted when the dialog should be closed. */
  @Output() closed = new EventEmitter<void>();

  /** Emitted with the newly created contact (without an id) after successful submission. */
  @Output() contactCreated = new EventEmitter<Omit<Contact, 'id'>>();

  /** Current form state. */
  form = {
    name: '',
    email: '',
    phone: '',
  };

  /** Cancels the input, resets the form, and closes the dialog. */
  cancel(): void {
    this.resetForm();
    this.closed.emit();
  }

  /** Checks whether the entered email address matches the expected format. */
  isEmailValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
  }

  /** Checks whether the entered phone number matches the expected format. */
  isPhoneValid(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-()]{7,20}$/;
    return phoneRegex.test(phone.trim());
  }

  /**
   * Validates the form and emits the new contact if successful.
   * Aborts if required fields are missing or the email address is invalid.
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

  /** Resets the form to its initial state. */
  private resetForm(): void {
    this.form = { name: '', email: '', phone: '' };
  }

  /** Predefined avatar colors used for randomly assigning contact avatars. */
  private readonly avatarColors = [
    '#FF7A00', '#9327FF', '#6E52FF', '#FC71FF', '#FFBB2B',
    '#1FD7C1', '#462F8A', '#FF4646', '#00BEE8', '#FFA35E',
    '#FF5EB3', '#20D300',
  ];

  /** Returns a random color from the avatar color palette. */
  private generateColor(): string {
    return this.avatarColors[
      Math.floor(Math.random() * this.avatarColors.length)
    ];
  }

  /** Returns the initials (up to two characters) derived from a full name. */
  private generateInitials(name: string): string {
    return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  }
}