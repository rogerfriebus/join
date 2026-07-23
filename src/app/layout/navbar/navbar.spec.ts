import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';

import { Navbar } from './navbar';
import { AuthService } from '../../core/services/auth.service';

/**
 * Tests for the navbar (Sprint 3: Turquoise 6).
 *
 * Verifies that protected links are visible only to authenticated users and
 * that logged-out users can access login, Help, and the legal links on mobile.
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

  it('shows the protected links for authenticated users', async () => {
    isAuthenticated.set(true);
    await setup();

    expect(query('.navbar__links')).not.toBeNull();
    const hrefs = queryAll('.navbar__link').map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/summary', '/add-task', '/board', '/contacts']);
  });

  it('shows the public links for unauthenticated users', async () => {
    isAuthenticated.set(false);
    await setup();

    const hrefs = queryAll('.navbar__link').map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/login', '/help', '/privacy-policy', '/legal-notice']);
    expect(queryAll('.navbar__text').map((element) => element.textContent?.trim())).toEqual([
      'Log In',
      'Help',
      'Privacy Policy',
      'Legal Notice',
    ]);
  });

  it('points the brand logo to /login for logged-out users', async () => {
    isAuthenticated.set(false);
    await setup();

    expect(query('.navbar__brand')?.getAttribute('href')).toBe('/login');
  });

  it('points the brand logo to /summary for logged-in users', async () => {
    isAuthenticated.set(true);
    await setup();

    expect(query('.navbar__brand')?.getAttribute('href')).toBe('/summary');
  });
});
