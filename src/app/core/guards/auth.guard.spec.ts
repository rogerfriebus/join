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
 * Tests for the authGuard (Sprint 3: Turquoise 2).
 *
 * The guard runs as a functional guard within an injection context. The
 * AuthService is stubbed via an isAuthenticated signal; the router is real
 * (provideRouter), so that createUrlTree returns a real UrlTree for the redirect
 * check.
 */
describe('authGuard', () => {
  const isAuthenticated = signal(false);

  /** Runs the guard within the injection context. */
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

  it('allows access when isAuthenticated is true', () => {
    isAuthenticated.set(true);

    expect(runGuard()).toBe(true);
  });

  it('denies access when isAuthenticated is false', () => {
    const result = runGuard();

    expect(result).not.toBe(true);
    expect(result).toBeInstanceOf(UrlTree);
  });

  it('redirects unauthenticated access to /login', () => {
    const router = TestBed.inject(Router);
    const result = runGuard('/board') as UrlTree;

    expect(result.toString()).toBe(
      router
        .createUrlTree(['/login'], { queryParams: { redirectUrl: '/board' } })
        .toString(),
    );
  });

  it('remembers the original URL as redirectUrl', () => {
    const result = runGuard('/contacts') as UrlTree;

    expect(result.toString()).toContain('/login');
    expect(result.toString()).toContain('redirectUrl=%2Fcontacts');
  });

  it('treats a guest (isAuthenticated true) as authenticated', () => {
    // loginAsGuest() sets isAuthenticated to true in the AuthService.
    isAuthenticated.set(true);

    expect(runGuard()).toBe(true);
  });
});
