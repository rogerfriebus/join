import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditContactDialog } from './edit-contact-dialog';
import { Contact } from '../../../../core/models/contact.model';

describe('EditContactDialog', () => {
  let component: EditContactDialog;
  let fixture: ComponentFixture<EditContactDialog>;

  // EditContactDialog has a required @Input `contact` that is read in ngOnInit.
  // In the test it must be set before the first change detection run, otherwise
  // ngOnInit runs against undefined.
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
