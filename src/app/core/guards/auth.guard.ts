import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Route guard for protected pages (Sprint 3: Turquoise 2).
 *
 * Allows access only when a user is logged in via the {@link AuthService}
 * (including guest – `loginAsGuest()` sets `isAuthenticated`). Otherwise it
 * redirects to `/login`; the originally requested URL is passed along as the
 * `redirectUrl` query param so that Login (Pink) can later navigate back there.
 *
 * Deliberately implemented as a functional guard (Angular Standalone/
 * `loadComponent`). The auth logic itself lives exclusively in the AuthService
 * – here it is only consumed.
 */
export const authGuard: CanActivateFn = (route, state): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { redirectUrl: state.url },
  });
};
