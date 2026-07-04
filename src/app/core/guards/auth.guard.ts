import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Route-Guard für geschützte Seiten (Sprint 3: Türkis 2).
 *
 * Erlaubt den Zugriff nur, wenn über den {@link AuthService} ein Benutzer
 * eingeloggt ist (inkl. Gast – `loginAsGuest()` setzt `isAuthenticated`).
 * Andernfalls wird auf `/login` umgeleitet; die ursprünglich angefragte URL
 * wird als `redirectUrl`-Query-Param mitgegeben, damit Login (Pink) später
 * dorthin zurückführen kann.
 *
 * Bewusst als funktionaler Guard umgesetzt (Angular Standalone/`loadComponent`).
 * Die Auth-Logik selbst liegt ausschließlich im AuthService – hier wird sie
 * nur konsumiert.
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
