import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';

import { Header } from './header';
import { AuthService } from '../../core/services/auth.service';

/**
 * Tests for the header, including the user menu and logout flow.
 *
 * AuthService is stubbed with controllable signals for isAuthenticated and
 * displayName. The router uses provideRouter with a spy on navigate().
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

  function menuItems(selector = '.header__menu-item'): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll(selector));
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

  it('zeigt "G" für einen Gast', () => {
    displayName.set('Guest');
    fixture.detectChanges();

    expect(query('.header__avatar')?.textContent?.trim()).toBe('G');
  });

  it('zeigt im Desktop-Submenu nur die Legal-Links und Logout', () => {
    query('.header__avatar')!.click();
    fixture.detectChanges();

    expect(menuItems('.header__menu-item:not(.header__menu-item--mobile-only)').map((item) => item.textContent?.trim())).toEqual([
      'Legal Notice',
      'Privacy Policy',
      'Log out',
    ]);
  });

  it('hält Help als mobilen Submenu-Eintrag vor', () => {
    query('.header__avatar')!.click();
    fixture.detectChanges();

    expect(query('.header__menu-item--mobile-only')?.textContent?.trim()).toBe('Help');
  });

  it('navigiert über den Help-Button zur Help-Seite', async () => {
    query('.header__help')!.click();
    await fixture.whenStable();

    expect(navigateSpy).toHaveBeenCalledWith(['/help']);
  });

  it('navigiert aus dem mobilen Submenu zur Help-Seite', async () => {
    query('.header__avatar')!.click();
    fixture.detectChanges();

    query('.header__menu-item--mobile-only')!.click();
    await fixture.whenStable();

    expect(component.menuOpen()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/help']);
  });

  it('navigiert aus dem Submenu zur Legal-Notice-Seite', async () => {
    query('.header__avatar')!.click();
    fixture.detectChanges();

    menuItems('.header__menu-item:not(.header__menu-item--mobile-only)')[0].click();
    await fixture.whenStable();

    expect(component.menuOpen()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/legal-notice']);
  });

  it('navigiert aus dem Submenu zur Privacy-Policy-Seite', async () => {
    query('.header__avatar')!.click();
    fixture.detectChanges();

    menuItems('.header__menu-item:not(.header__menu-item--mobile-only)')[1].click();
    await fixture.whenStable();

    expect(component.menuOpen()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/privacy-policy']);
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

    menuItems('.header__menu-item:not(.header__menu-item--mobile-only)')[2].click();
    await fixture.whenStable();

    expect(logoutSpy).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('schließt das Menü nach dem Logout', async () => {
    query('.header__avatar')!.click();
    fixture.detectChanges();
    expect(component.menuOpen()).toBe(true);

    menuItems('.header__menu-item:not(.header__menu-item--mobile-only)')[2].click();
    await fixture.whenStable();

    expect(component.menuOpen()).toBe(false);
  });
});
