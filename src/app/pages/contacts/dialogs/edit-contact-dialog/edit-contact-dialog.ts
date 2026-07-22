import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Contact } from '../../../../core/models/contact.model';


/**
 * Dialog component for editing an existing contact.
 *
 * Receives the contact to edit via the `contact` input and emits
 * the updated contact via `saved`, the original contact via
 * `deleted` for deletion, or signals that the dialog should be
 * closed via `closed`.
 */
@Component({
  selector: 'app-edit-contact-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-contact-dialog.html',
  styleUrls: ['./edit-contact-dialog.scss'],
})
export class EditContactDialog implements OnInit {
  /** The contact to edit (required input). */
  @Input({ required: true }) contact!: Contact;

  /** Emitted when the dialog should be closed. */
  @Output() closed = new EventEmitter<void>();

  /** Emitted with the updated contact after it has been saved successfully. */
  @Output() saved = new EventEmitter<Contact>();

  /** Emitted when the contact should be deleted. */
  @Output() deleted = new EventEmitter<Contact>();

  /** Current form state, prefilled with the provided contact data. */
  form = {
    name: '',
    email: '',
    phone: '',
  };

  /** Populates the form with the current contact data when the dialog is opened. */
  ngOnInit(): void {
    this.form = {
      name: this.contact.name,
      email: this.contact.email,
      phone: this.contact.phone,
    };
  }

  /** Closes the dialog without saving any changes. */
  cancel(): void {
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
   * Validates the form and emits the updated contact if successful.
   * Aborts if required fields are missing or the email address or phone number is invalid.
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
   * Emits the current contact for deletion and closes the dialog.
   * Aborts if the contact has no id.
   */
  delete(): void {
    if (!this.contact.id) return;
    this.deleted.emit(this.contact);
    this.closed.emit();
  }

  /** Returns the initials (up to two characters) derived from a full name. */
  getInitials(name: string): string {
    return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  }
}