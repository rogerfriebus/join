import { Injectable } from '@angular/core';
import { ParamMap } from '@angular/router';

/** Query-Param-Name, unter dem der authGuard die Ursprungs-URL ablegt. */
export const REDIRECT_PARAM = 'redirectUrl';

/** Standard-Startseite nach Login/Sign-Up/Gast-Login. */
export const DEFAULT_REDIRECT_URL = '/summary';

/**
 * Interne Routen, die als Redirect-Ziel nach dem Login erlaubt sind.
 *
 * Bewusst eine Allowlist der geschützten App-Seiten (siehe authGuard). Nur
 * diese werden vom Guard überhaupt als redirectUrl gesetzt. Öffentliche Seiten
 * (login, sign-up, legal-notice, privacy-policy) sind KEINE sinnvollen
 * Post-Login-Ziele und fallen daher auf die Startseite zurück.
 */
const ALLOWED_REDIRECT_ROUTES: readonly string[] = [
  '/summary',
  '/board',
  '/add-task',
  '/contacts',
];

/**
 * Zentrale Redirect-Entscheidung nach erfolgreicher Authentifizierung
 * (Sprint 3: Türkis 3).
 *
 * Kapselt an EINER Stelle, wohin nach Login/Sign-Up/Gast-Login navigiert wird:
 *  - bevorzugt zur ursprünglich angefragten geschützten Seite (redirectUrl),
 *  - sonst zur Standard-Startseite `/summary`.
 *
 * Sicherheit: Es werden ausschließlich bekannte, interne Routen zugelassen
 * (Allowlist). Externe URLs (`https://…`), protokoll-relative URLs (`//…`),
 * Backslash-Tricks und öffentliche/Auth-Routen (`/login`, `/privacy-policy`, …)
 * werden verworfen und führen zur Startseite. Damit kann ein manipulierter
 * redirectUrl-Query-Param keine Open-Redirect-Weiterleitung auslösen.
 */
@Injectable({ providedIn: 'root' })
export class AuthRedirectService {
  /**
   * Bestimmt aus einem rohen redirectUrl-Wert (z. B. aus dem Query-Param) das
   * sichere Navigationsziel.
   *
   * Regeln:
   *  - null/leer/nur Whitespace → `/summary`
   *  - kein root-relativer Pfad (`/…`) oder protokoll-relativ (`//…`) → `/summary`
   *  - enthält Schema (`://`) oder Backslash → `/summary`
   *  - Pfad nicht in der Allowlist der geschützten Routen → `/summary`
   *  - andernfalls: der Wert selbst (inkl. evtl. Query-String) bleibt erhalten
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
   * Liest den redirectUrl-Query-Param aus einer ParamMap (z. B.
   * `route.snapshot.queryParamMap`) und bestimmt daraus das sichere Ziel.
   * Fehlt die Map, wird die Startseite geliefert.
   */
  getRedirectUrlFromParams(params: ParamMap | null | undefined): string {
    return this.getRedirectUrl(params?.get(REDIRECT_PARAM) ?? null);
  }
}
