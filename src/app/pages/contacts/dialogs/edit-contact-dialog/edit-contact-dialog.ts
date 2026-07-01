import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Contact } from '../../../../core/models/contact.model';

@Component({
  selector: 'app-edit-contact-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-contact-dialog.html',
  styleUrls: ['./edit-contact-dialog.scss'],
})
export class EditContactDialog implements OnInit {
  @Input({ required: true }) contact!: Contact;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<Contact>();
  @Output() deleted = new EventEmitter<Contact>();

  form = {
    name: '',
    email: '',
    phone: '',
  };

  ngOnInit(): void {
    this.form = {
      name: this.contact.name,
      email: this.contact.email,
      phone: this.contact.phone,
    };
  }

  cancel(): void {
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

  save(): void {
    if (!this.form.name || !this.form.email || !this.form.phone || !this.isEmailValid(this.form.email)|| !this.isPhoneValid(this.form.phone)) return;

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

  delete(): void {
    if (!this.contact.id) return;
    this.deleted.emit(this.contact);
    this.closed.emit();
  }

  getInitials(name: string): string {
    return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  }
}