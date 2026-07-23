import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { Contacts } from './contacts';
import { AuthService, AuthUser } from '../../core/services/auth.service';

/**
 * Mocked Supabase client: in ngOnInit the Contacts page calls loadContacts()
 * via the ContactService facade. With this mock there is NO real network call;
 * loadContacts() returns an empty data set.
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

  it('shows the logged-in user as a contact in the list', async () => {
    user.set({ id: 'u1', name: 'Nina Test', email: 'nina.test@example.com', isGuest: false });
    await setup();

    const own = component.contacts().find((c) => c.id === 'auth-u1');
    expect(own?.name).toBe('Nina Test');
    expect(component.currentUserContactId()).toBe('auth-u1');
  });

  it('does not create a broken entry when logged out', async () => {
    user.set(null);
    await setup();

    expect(component.contacts().some((c) => c.id?.startsWith('auth-'))).toBe(false);
    expect(component.currentUserContactId()).toBeUndefined();
  });
});
