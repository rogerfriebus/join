import { Injectable } from '@angular/core';
import { ParamMap } from '@angular/router';

/** Query param name under which the authGuard stores the origin URL. */
export const REDIRECT_PARAM = 'redirectUrl';

/** Default landing page after login/sign-up/guest login. */
export const DEFAULT_REDIRECT_URL = '/summary';

/**
 * Internal routes that are allowed as a redirect target after login.
 *
 * Deliberately an allowlist of the protected app pages (see authGuard). Only
 * these are ever set by the guard as redirectUrl. Public pages (login, sign-up,
 * legal-notice, privacy-policy) are NOT sensible post-login targets and
 * therefore fall back to the landing page.
 */
const ALLOWED_REDIRECT_ROUTES: readonly string[] = [
  '/summary',
  '/board',
  '/add-task',
  '/contacts',
];

/**
 * Central redirect decision after successful authentication
 * (Sprint 3: Turquoise 3).
 *
 * Encapsulates in ONE place where navigation goes after login/sign-up/guest
 * login:
 *  - preferably to the originally requested protected page (redirectUrl),
 *  - otherwise to the default landing page `/summary`.
 *
 * Security: only known, internal routes are allowed (allowlist). External URLs
 * (`https://…`), protocol-relative URLs (`//…`), backslash tricks and
 * public/auth routes (`/login`, `/privacy-policy`, …) are discarded and lead to
 * the landing page. This prevents a manipulated redirectUrl query param from
 * triggering an open-redirect.
 */
@Injectable({ providedIn: 'root' })
export class AuthRedirectService {
  /**
   * Determines the safe navigation target from a raw redirectUrl value (e.g.
   * from the query param).
   *
   * Rules:
   *  - null/empty/whitespace only → `/summary`
   *  - not a root-relative path (`/…`) or protocol-relative (`//…`) → `/summary`
   *  - contains a scheme (`://`) or backslash → `/summary`
   *  - path not in the allowlist of protected routes → `/summary`
   *  - otherwise: the value itself (including any query string) is kept
   */
  getRedirectUrl(queryParamValue: string | null | undefined): string {
    const value = (queryParamValue ?? '').trim();
    if (!value) {
      return DEFAULT_REDIRECT_URL;
    }
    if (!value.startsWith('/') || value.startsWith('//')) {
      return DEFAULT_REDIRECT_URL;
    }
    if (value.includes('://') || value.includes('\\')) {
      return DEFAULT_REDIRECT_URL;
    }
    const path = value.split(/[?#]/)[0];
    if (!ALLOWED_REDIRECT_ROUTES.includes(path)) {
      return DEFAULT_REDIRECT_URL;
    }
    return value;
  }

  /**
   * Reads the redirectUrl query param from a ParamMap (e.g.
   * `route.snapshot.queryParamMap`) and determines the safe target from it.
   * If the map is missing, the landing page is returned.
   */
  getRedirectUrlFromParams(params: ParamMap | null | undefined): string {
    return this.getRedirectUrl(params?.get(REDIRECT_PARAM) ?? null);
  }
}
