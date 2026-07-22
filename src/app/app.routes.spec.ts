import { Route } from '@angular/router';

import { routes } from './app.routes';
import { authGuard } from './core/guards/auth.guard';

/**
 * Tests for the routing configuration (Sprint 3: Turquoise 6).
 *
 * Ensures that protected areas use the authGuard while public pages
 * (login, help, legal-notice, privacy-policy) remain accessible without it.
 */
describe('app.routes', () => {
  /** Finds a route by path, including nested child routes. */
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
  const PUBLIC = ['login', 'help', 'legal-notice', 'privacy-policy'];

  it.each(PROTECTED)('schützt die Route /%s mit dem authGuard', (path) => {
    expect(findRoute(path)).toBeDefined();
    expect(isGuarded(path)).toBe(true);
  });

  it.each(PUBLIC)('lässt die Route /%s öffentlich (ohne authGuard)', (path) => {
    expect(findRoute(path)).toBeDefined();
    expect(isGuarded(path)).toBe(false);
  });
});
