import { Component, EventEmitter, Output } from '@angular/core';
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

  submit(): void {
    // Logik folgt später
  }

  private resetForm(): void {
    this.form = { name: '', email: '', phone: '' };
  }
}
