import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditContactDialog } from './edit-contact-dialog';
import { Contact } from '../../../../core/models/contact.model';

describe('EditContactDialog', () => {
  let component: EditContactDialog;
  let fixture: ComponentFixture<EditContactDialog>;

  // EditContactDialog hat einen required @Input `contact`, der in ngOnInit
  // gelesen wird. Im Test muss dieser vor der ersten Change Detection gesetzt
  // werden, sonst läuft ngOnInit auf undefined.
  const contact: Contact = {
    id: '1',
    name: 'Anja Schulz',
    email: 'anja.schulz@example.com',
    phone: '+49 151 1234567',
    initials: 'AS',
    color: '#FF7A00',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditContactDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(EditContactDialog);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('contact', contact);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
