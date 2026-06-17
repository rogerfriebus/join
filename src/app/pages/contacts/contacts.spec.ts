import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Contacts } from './contacts';

/**
 * Gemockter Supabase-Client: Die Contacts-Seite ruft in ngOnInit über die
 * ContactService-Fassade loadContacts() auf. Mit diesem Mock erfolgt KEIN
 * echter Netzwerkaufruf; loadContacts() liefert einen leeren Datensatz.
 */
vi.mock('@supabase/supabase-js', () => {
  const builder: Record<string, unknown> = {};
  for (const method of ['from', 'select', 'order', 'insert', 'update', 'delete', 'eq', 'single', 'maybeSingle']) {
    builder[method] = () => builder;
  }
  builder['then'] = (resolve: (value: unknown) => unknown) => resolve({ data: [], error: null });
  return { createClient: () => builder };
});

describe('Contacts', () => {
  let component: Contacts;
  let fixture: ComponentFixture<Contacts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Contacts],
    }).compileComponents();

    fixture = TestBed.createComponent(Contacts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
