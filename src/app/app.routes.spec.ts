import { Route } from '@angular/router';

import { routes } from './app.routes';
import { authGuard } from './core/guards/auth.guard';

/**
 * Tests für die Routing-Konfiguration (Sprint 3: Türkis 6).
 *
 * Stellt sicher, dass die geschützten Bereiche den authGuard tragen und die
 * öffentlichen Seiten (login, legal-notice, privacy-policy) frei erreichbar
 * bleiben – so entsteht über das Routing keine Hintertür in geschützte Bereiche.
 */
describe('app.routes', () => {
  /** Sucht eine Route anhand ihres Pfads (auch in children) im Routing-Baum. */
  function findRoute(path: string, tree: readonly Route[] = routes): Route | undefined {
    for (const route of tree) {
      if (route.path === path && route.loadComponent) {
        return route;
      }
      if (route.children) {
        const found = findRoute(path, route.children);
        if (found) {
          return found;
        }
      }
    }
    return undefined;
  }

  function isGuarded(path: string): boolean {
    return findRoute(path)?.canActivate?.includes(authGuard) ?? false;
  }

  const PROTECTED = ['summary', 'board', 'add-task', 'contacts'];
  const PUBLIC = ['login', 'legal-notice', 'privacy-policy'];

  it.each(PROTECTED)('schützt die Route /%s mit dem authGuard', (path) => {
    expect(findRoute(path)).toBeDefined();
    expect(isGuarded(path)).toBe(true);
  });

  it.each(PUBLIC)('lässt die Route /%s öffentlich (ohne authGuard)', (path) => {
    expect(findRoute(path)).toBeDefined();
    expect(isGuarded(path)).toBe(false);
  });
});
