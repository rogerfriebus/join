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

  save(): void {
    // Logik folgt später
  }

  delete(): void {
    // Logik folgt später
  }

  getInitials(name: string): string {
    return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  }
}