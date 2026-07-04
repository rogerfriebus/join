import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';

import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

/**
 * Tests für den authGuard (Sprint 3: Türkis 2).
 *
 * Der Guard wird als funktionaler Guard über einen Injection-Context
 * ausgeführt. Der AuthService wird über ein isAuthenticated-Signal gestubbt;
 * der Router ist real (provideRouter), damit createUrlTree einen echten
 * UrlTree für die Redirect-Prüfung liefert.
 */
describe('authGuard', () => {
  const isAuthenticated = signal(false);

  /** Führt den Guard im Injection-Context aus. */
  function runGuard(url = '/board'): boolean | UrlTree {
    const route = {} as ActivatedRouteSnapshot;
    const state = { url } as RouterStateSnapshot;
    return TestBed.runInInjectionContext(() => authGuard(route, state)) as
      | boolean
      | UrlTree;
  }

  beforeEach(() => {
    isAuthenticated.set(false);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { isAuthenticated: isAuthenticated.asReadonly() },
        },
      ],
    });
  });

  it('erlaubt den Zugriff, wenn isAuthenticated true ist', () => {
    isAuthenticated.set(true);

    expect(runGuard()).toBe(true);
  });

  it('verweigert den Zugriff, wenn isAuthenticated false ist', () => {
    const result = runGuard();

    expect(result).not.toBe(true);
    expect(result).toBeInstanceOf(UrlTree);
  });

  it('leitet nicht authentifizierte Zugriffe auf /login um', () => {
    const router = TestBed.inject(Router);
    const result = runGuard('/board') as UrlTree;

    expect(result.toString()).toBe(
      router
        .createUrlTree(['/login'], { queryParams: { redirectUrl: '/board' } })
        .toString(),
    );
  });

  it('merkt sich die ursprüngliche URL als redirectUrl', () => {
    const result = runGuard('/contacts') as UrlTree;

    expect(result.toString()).toContain('/login');
    expect(result.toString()).toContain('redirectUrl=%2Fcontacts');
  });

  it('behandelt einen Gast (isAuthenticated true) als authentifiziert', () => {
    // loginAsGuest() setzt im AuthService isAuthenticated → true.
    isAuthenticated.set(true);

    expect(runGuard()).toBe(true);
  });
});
