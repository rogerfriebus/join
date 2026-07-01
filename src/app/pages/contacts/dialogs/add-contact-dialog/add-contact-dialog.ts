import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Contact } from '../../../../core/models/contact.model';

@Component({
  selector: 'app-add-contact-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-contact-dialog.html',
  styleUrl: './add-contact-dialog.scss',
})
export class AddContactDialog {
  @Output() closed = new EventEmitter<void>();
  @Output() contactCreated = new EventEmitter<Omit<Contact, 'id'>>();

  form = {
    name: '',
    email: '',
    phone: '',
  };

  cancel(): void {
    this.resetForm();
    this.closed.emit();
  }

  isEmailValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }
  
  isPhoneValid(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-()]{7,20}$/;
    return phoneRegex.test(phone.trim());
  }

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

  private resetForm(): void {
    this.form = { name: '', email: '', phone: '' };
  }

  private readonly avatarColors = [
    '#FF7A00', '#9327FF', '#6E52FF', '#FC71FF', '#FFBB2B',
    '#1FD7C1', '#462F8A', '#FF4646', '#00BEE8', '#FFA35E',
    '#FF5EB3', '#20D300',
  ];

  private generateColor(): string {
    return this.avatarColors[
      Math.floor(Math.random() * this.avatarColors.length)
    ];
  }

  private generateInitials(name: string): string {
    return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  }
}
