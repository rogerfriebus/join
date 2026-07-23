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

  it('shows the initials of the displayName in the avatar', () => {
    expect(query('.header__avatar')?.textContent?.trim()).toBe('AS');
  });

  it('shows "G" for a guest', () => {
    displayName.set('Guest');
    fixture.detectChanges();

    expect(query('.header__avatar')?.textContent?.trim()).toBe('G');
  });

  it('shows only the legal links and logout in the desktop submenu', () => {
    query('.header__avatar')!.click();
    fixture.detectChanges();

    expect(menuItems('.header__menu-item:not(.header__menu-item--mobile-only)').map((item) => item.textContent?.trim())).toEqual([
      'Legal Notice',
      'Privacy Policy',
      'Log out',
    ]);
  });

  it('keeps Help available as a mobile submenu item', () => {
    query('.header__avatar')!.click();
    fixture.detectChanges();

    expect(query('.header__menu-item--mobile-only')?.textContent?.trim()).toBe('Help');
  });

  it('navigates to the Help page via the Help button', async () => {
    query('.header__help')!.click();
    await fixture.whenStable();

    expect(navigateSpy).toHaveBeenCalledWith(['/help']);
  });

  it('navigates to the Help page from the mobile submenu', async () => {
    query('.header__avatar')!.click();
    fixture.detectChanges();

    query('.header__menu-item--mobile-only')!.click();
    await fixture.whenStable();

    expect(component.menuOpen()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/help']);
  });

  it('navigates to the Legal Notice page from the submenu', async () => {
    query('.header__avatar')!.click();
    fixture.detectChanges();

    menuItems('.header__menu-item:not(.header__menu-item--mobile-only)')[0].click();
    await fixture.whenStable();

    expect(component.menuOpen()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/legal-notice']);
  });

  it('navigates to the Privacy Policy page from the submenu', async () => {
    query('.header__avatar')!.click();
    fixture.detectChanges();

    menuItems('.header__menu-item:not(.header__menu-item--mobile-only)')[1].click();
    await fixture.whenStable();

    expect(component.menuOpen()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/privacy-policy']);
  });

  it('does not render a user menu when nobody is logged in', () => {
    isAuthenticated.set(false);
    fixture.detectChanges();

    expect(query('.header__avatar')).toBeNull();
    expect(query('.header__menu')).toBeNull();
  });

  it('calls AuthService.logout() on logout and navigates to /login', async () => {
    query('.header__avatar')!.click();
    fixture.detectChanges();

    menuItems('.header__menu-item:not(.header__menu-item--mobile-only)')[2].click();
    await fixture.whenStable();

    expect(logoutSpy).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('closes the menu after logout', async () => {
    query('.header__avatar')!.click();
    fixture.detectChanges();
    expect(component.menuOpen()).toBe(true);

    menuItems('.header__menu-item:not(.header__menu-item--mobile-only)')[2].click();
    await fixture.whenStable();

    expect(component.menuOpen()).toBe(false);
  });
});
