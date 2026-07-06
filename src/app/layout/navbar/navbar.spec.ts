import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';

import { Navbar } from './navbar';
import { AuthService } from '../../core/services/auth.service';

/**
 * Tests für die Navbar (Sprint 3: Türkis 6).
 *
 * Geprüft wird, dass geschützte Links nur für authentifizierte Nutzer sichtbar
 * sind und ausgeloggte Nutzer auf öffentlichen Seiten nur den Login-Einstieg
 * sehen.
 */
describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;

  const isAuthenticated = signal(true);

  function query(selector: string): HTMLElement | null {
    return fixture.nativeElement.querySelector(selector);
  }

  function queryAll(selector: string): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll(selector));
  }

  async function setup(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { isAuthenticated: isAuthenticated.asReadonly() },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('should create', async () => {
    isAuthenticated.set(true);
    await setup();
    expect(component).toBeTruthy();
  });

  it('zeigt die geschützten Links für authentifizierte Nutzer', async () => {
    isAuthenticated.set(true);
    await setup();

    expect(query('.navbar__links')).not.toBeNull();
    const hrefs = queryAll('.navbar__link').map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/summary', '/add-task', '/board', '/contacts']);
  });

  it('zeigt für nicht authentifizierte Nutzer nur den Login-Link', async () => {
    isAuthenticated.set(false);
    await setup();

    const hrefs = queryAll('.navbar__link').map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/login']);
    expect(query('.navbar__text')?.textContent?.trim()).toBe('Log In');
  });

  it('führt das Brand-Logo für Ausgeloggte auf /login', async () => {
    isAuthenticated.set(false);
    await setup();

    expect(query('.navbar__brand')?.getAttribute('href')).toBe('/login');
  });

  it('führt das Brand-Logo für Eingeloggte auf /summary', async () => {
    isAuthenticated.set(true);
    await setup();

    expect(query('.navbar__brand')?.getAttribute('href')).toBe('/summary');
  });
});
