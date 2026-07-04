import { Injectable, Signal, computed, signal } from '@angular/core';

/**
 * Ein authentifizierter Benutzer (eingeloggt oder Gast).
 *
 * Bewusst schlank gehalten: In diesem Sprint-Slice (Türkis 1) werden nur die
 * Felder abgebildet, die Login/Guards/Summary später benötigen. Es gibt KEINE
 * echte Passwort-/Token-Verwaltung – die Demo-Auth ist lokal.
 */
export interface AuthUser {
  /** Eindeutige id des Benutzers (Gast: `guest`). */
  id: string;
  /** Anzeigename des Benutzers. */
  name: string;
  /** E-Mail-Adresse, optional (Gäste haben keine). */
  email?: string;
  /** Kennzeichnet einen Gast-Login. */
  isGuest: boolean;
}

/**
 * Momentaufnahme des Auth-Zustands (Snapshot).
 *
 * `isAuthenticated` ist redundant zu `user !== null`, wird aber bewusst
 * mitgeführt, damit Konsumenten (Guards/UI) einen stabilen Zustands-Contract
 * bekommen.
 */
export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
}

/** localStorage-Schlüssel für den optionalen Session-Fallback. */
const STORAGE_KEY = 'join.auth.user';

/** Fester Gast-Benutzer (kein persistenter Datensatz nötig). */
const GUEST_USER: AuthUser = { id: 'guest', name: 'Guest', isGuest: true };

/**
 * Zentraler Auth-Service (Sprint 3: Türkis 1 – Grundlage).
 *
 * Stellt den Login-Status, den aktuellen Benutzer und die fachlichen Methoden
 * (login/signUp/loginAsGuest/logout) als klare Schnittstelle bereit. UI und
 * spätere Guards konsumieren ausschließlich diese Fassade.
 *
 * Demo-Setup (Developer-Akademie):
 *  - Die Auth-Logik ist BEWUSST lokal/demo-tauglich: keine echte
 *    Passwortprüfung, keine Tokens, keine Supabase-Auth-Anbindung.
 *  - Der Zustand wird optional in localStorage gespiegelt, damit ein Reload die
 *    Session behält. Der Zugriff ist gekapselt und fehlertolerant.
 *  - Struktur und API sind so gewählt, dass Pink/Login und Türkis/Guards sie
 *    später ohne Umbau verwenden können.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  /**
   * Interner Auth-Bestand. Wird beim Service-Start – falls vorhanden – aus dem
   * localStorage wiederhergestellt (Session-Fallback).
   */
  private readonly userSignal = signal<AuthUser | null>(this.restoreUser());

  /** Aktueller Benutzer (read-only), oder null wenn niemand eingeloggt ist. */
  readonly user: Signal<AuthUser | null> = this.userSignal.asReadonly();

  /** True, sobald ein Benutzer (inkl. Gast) eingeloggt ist. */
  readonly isAuthenticated: Signal<boolean> = computed(() => this.userSignal() !== null);

  /** True, wenn der aktuelle Benutzer ein Gast ist. */
  readonly isGuest: Signal<boolean> = computed(() => this.userSignal()?.isGuest ?? false);

  /**
   * Anzeigename für die UI:
   *  - der Benutzer-Name, wenn gesetzt,
   *  - "Guest" für Gäste,
   *  - leerer String, wenn niemand eingeloggt ist.
   */
  readonly displayName: Signal<string> = computed(() => {
    const user = this.userSignal();
    if (!user) {
      return '';
    }
    if (user.isGuest) {
      return 'Guest';
    }
    return user.name || 'Guest';
  });

  /** Liefert einen Snapshot des aktuellen Auth-Zustands. */
  getState(): AuthState {
    const user = this.userSignal();
    return { user, isAuthenticated: user !== null };
  }

  /** Liefert den aktuellen Benutzer (Snapshot) oder null. */
  getUser(): AuthUser | null {
    return this.userSignal();
  }

  /**
   * Meldet einen Benutzer an. Demo-tauglich: Es wird lediglich geprüft, dass
   * E-Mail und Passwort übergeben wurden – keine echte Passwortprüfung.
   * Wirft einen Error, wenn Pflichtwerte fehlen.
   */
  async login(email: string, password: string): Promise<AuthUser> {
    const mail = (email ?? '').trim();
    if (!mail || !password) {
      throw new Error('E-Mail und Passwort sind erforderlich.');
    }
    const user: AuthUser = {
      id: this.createUserId(mail),
      name: this.nameFromEmail(mail),
      email: mail,
      isGuest: false,
    };
    this.setUser(user);
    return user;
  }

  /**
   * Registriert einen Benutzer und meldet ihn direkt an. Demo-tauglich: Es wird
   * nur geprüft, dass Name, E-Mail und Passwort übergeben wurden – es werden
   * keine Zugangsdaten gespeichert. Wirft einen Error, wenn Pflichtwerte fehlen.
   */
  async signUp(name: string, email: string, password: string): Promise<AuthUser> {
    const displayName = (name ?? '').trim();
    const mail = (email ?? '').trim();
    if (!displayName || !mail || !password) {
      throw new Error('Name, E-Mail und Passwort sind erforderlich.');
    }
    const user: AuthUser = {
      id: this.createUserId(mail),
      name: displayName,
      email: mail,
      isGuest: false,
    };
    this.setUser(user);
    return user;
  }

  /** Meldet einen Gast an (ohne E-Mail/Passwort). */
  async loginAsGuest(): Promise<AuthUser> {
    const guest: AuthUser = { ...GUEST_USER };
    this.setUser(guest);
    return guest;
  }

  /** Meldet den aktuellen Benutzer ab und verwirft den Session-Fallback. */
  logout(): void {
    this.userSignal.set(null);
    this.clearStoredUser();
  }

  // ---------------------------------------------------------------------------
  // Interne Hilfen
  // ---------------------------------------------------------------------------

  /** Setzt den Benutzer im Signal und spiegelt ihn in den Session-Fallback. */
  private setUser(user: AuthUser): void {
    this.userSignal.set(user);
    this.persistUser(user);
  }

  /** Baut eine stabile, demo-taugliche id aus der E-Mail. */
  private createUserId(email: string): string {
    return `user-${email.toLowerCase()}`;
  }

  /** Leitet aus einer E-Mail einen einfachen Anzeigenamen ab (Teil vor dem @). */
  private nameFromEmail(email: string): string {
    const localPart = email.split('@')[0]?.trim();
    return localPart || email;
  }

  /**
   * Stellt den Benutzer aus dem localStorage wieder her (Session-Fallback).
   * Fehlertolerant: Bei fehlendem/kaputtem Eintrag oder ohne localStorage wird
   * null zurückgegeben.
   */
  private restoreUser(): AuthUser | null {
    const raw = this.safeStorageGet();
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as Partial<AuthUser> | null;
      if (!parsed || typeof parsed.id !== 'string' || typeof parsed.name !== 'string') {
        return null;
      }
      return {
        id: parsed.id,
        name: parsed.name,
        email: typeof parsed.email === 'string' ? parsed.email : undefined,
        isGuest: parsed.isGuest === true,
      };
    } catch {
      return null;
    }
  }

  /** Spiegelt den Benutzer in den localStorage (fehlertolerant). */
  private persistUser(user: AuthUser): void {
    try {
      this.getStorage()?.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {
      // Session-Fallback ist optional – Fehler dürfen den Login nicht brechen.
    }
  }

  /** Entfernt den Benutzer aus dem localStorage (fehlertolerant). */
  private clearStoredUser(): void {
    try {
      this.getStorage()?.removeItem(STORAGE_KEY);
    } catch {
      // bewusst ignoriert (siehe persistUser)
    }
  }

  /** Liest den Roh-Eintrag aus dem localStorage (fehlertolerant). */
  private safeStorageGet(): string | null {
    try {
      return this.getStorage()?.getItem(STORAGE_KEY) ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Liefert den localStorage, falls in der aktuellen Umgebung verfügbar
   * (z. B. nicht in reinen Server-/Nicht-Browser-Kontexten).
   */
  private getStorage(): Storage | null {
    try {
      return typeof localStorage !== 'undefined' ? localStorage : null;
    } catch {
      return null;
    }
  }
}
