import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';

import { Header } from './header';
import { AuthService } from '../../core/services/auth.service';

/**
 * Tests für den Header inkl. User-Menü / Logout (Sprint 3: Türkis 3).
 *
 * Der AuthService wird über steuerbare Signale gestubbt (isAuthenticated,
 * displayName); der Router ist real (provideRouter) mit gespyter navigate().
 */
describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;
  let logoutSpy: ReturnType<typeof vi.fn>;
  let navigateSpy: ReturnType<typeof vi.spyOn>;

  const isAuthenticated = signal(true);
  const displayName = signal('Anna Schulz');

  function query(selector: string): HTMLElement | null {
    return fixture.nativeElement.querySelector(selector);
  }

  beforeEach(async () => {
    isAuthenticated.set(true);
    displayName.set('Anna Schulz');
    logoutSpy = vi.fn();

    const authStub = {
      isAuthenticated: isAuthenticated.asReadonly(),
      displayName: displayName.asReadonly(),
      logout: logoutSpy,
    };

    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([]), { provide: AuthService, useValue: authStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;

    navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('zeigt die Initialen des displayName im Avatar', () => {
    expect(query('.header__avatar')?.textContent?.trim()).toBe('AS');
  });

  it('zeigt den displayName im geöffneten Menü', () => {
    query('.header__avatar')!.click();
    fixture.detectChanges();

    expect(query('.header__menu-name')?.textContent?.trim()).toBe('Anna Schulz');
  });

  it('zeigt "G" und "Guest" für einen Gast', () => {
    displayName.set('Guest');
    fixture.detectChanges();

    expect(query('.header__avatar')?.textContent?.trim()).toBe('G');

    query('.header__avatar')!.click();
    fixture.detectChanges();

    expect(query('.header__menu-name')?.textContent?.trim()).toBe('Guest');
  });

  it('rendert kein User-Menü, wenn niemand eingeloggt ist', () => {
    isAuthenticated.set(false);
    fixture.detectChanges();

    expect(query('.header__avatar')).toBeNull();
    expect(query('.header__menu')).toBeNull();
  });

  it('ruft beim Logout AuthService.logout() und navigiert zu /login', async () => {
    query('.header__avatar')!.click();
    fixture.detectChanges();

    query('.header__menu-item')!.click();
    await fixture.whenStable();

    expect(logoutSpy).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('schließt das Menü nach dem Logout', async () => {
    query('.header__avatar')!.click();
    fixture.detectChanges();
    expect(component.menuOpen()).toBe(true);

    query('.header__menu-item')!.click();
    await fixture.whenStable();

    expect(component.menuOpen()).toBe(false);
  });
});
