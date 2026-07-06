import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { Contacts } from './contacts';
import { AuthService, AuthUser } from '../../core/services/auth.service';

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

  const user = signal<AuthUser | null>(null);

  async function setup(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [Contacts],
      providers: [{ provide: AuthService, useValue: { user: user.asReadonly() } }],
    }).compileComponents();

    fixture = TestBed.createComponent(Contacts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  }

  it('should create', async () => {
    user.set(null);
    await setup();
    expect(component).toBeTruthy();
  });

  it('zeigt den eingeloggten User als Kontakt in der Liste', async () => {
    user.set({ id: 'u1', name: 'Nina Test', email: 'nina.test@example.com', isGuest: false });
    await setup();

    const own = component.contacts().find((c) => c.id === 'auth-u1');
    expect(own?.name).toBe('Nina Test');
    expect(component.currentUserContactId()).toBe('auth-u1');
  });

  it('erzeugt im ausgeloggten Zustand keinen kaputten Eintrag', async () => {
    user.set(null);
    await setup();

    expect(component.contacts().some((c) => c.id?.startsWith('auth-'))).toBe(false);
    expect(component.currentUserContactId()).toBeUndefined();
  });
});
