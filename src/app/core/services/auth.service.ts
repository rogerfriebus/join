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

/** localStorage-Schlüssel für die lokale User-Registry (Sign-up-Konten). */
const USERS_STORAGE_KEY = 'join.auth.users';

/** Fester Gast-Benutzer (kein persistenter Datensatz nötig). */
const GUEST_USER: AuthUser = { id: 'guest', name: 'Guest', isGuest: true };

/**
 * Ein in der lokalen Registry gespeichertes Konto (Sign-up-Datensatz).
 *
 * Enthält bewusst NUR die für den Demo-Login nötigen Felder. Das Passwort wird
 * ausschließlich als (Demo-)Hash abgelegt – nie im Klartext.
 */
interface StoredCredential {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

/**
 * Demo-Hash für Passwörter.
 *
 * ACHTUNG: Dies ist BEWUSST KEIN kryptographisch sicherer Hash. Er dient nur
 * dazu, das Passwort im Schulprojekt nicht im Klartext in den localStorage zu
 * schreiben. Für Produktion ist ein echtes Auth-Backend (z. B. Supabase Auth)
 * erforderlich. Der Algorithmus ist eine FNV-1a-Variante (32-bit) und liefert
 * einen synchronen, deterministischen Hex-String – gut testbar, ohne Library.
 */
function demoHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Zentraler Auth-Service (Sprint 3: Türkis 1 – Grundlage).
 *
 * Stellt den Login-Status, den aktuellen Benutzer und die fachlichen Methoden
 * (login/signUp/loginAsGuest/logout) als klare Schnittstelle bereit. UI und
 * spätere Guards konsumieren ausschließlich diese Fassade.
 *
 * Demo-Setup (Developer-Akademie):
 *  - Die Auth-Logik ist BEWUSST lokal/demo-tauglich: keine Tokens, keine
 *    Supabase-Auth-Anbindung. Konten werden in einer lokalen Registry
 *    (localStorage) gehalten; das Passwort wird nur als Demo-Hash gespeichert,
 *    nie im Klartext – das ist NICHT produktionssicher.
 *  - login() prüft E-Mail + Passwort gegen diese Registry (kein Auto-Anlegen
 *    unbekannter Konten mehr).
 *  - Der aktuelle Zustand wird zusätzlich in localStorage gespiegelt, damit ein
 *    Reload die Session behält. Der Zugriff ist gekapselt und fehlertolerant.
 *  - Struktur und API sind so gewählt, dass Pink/Login und Türkis/Guards sie
 *    ohne Umbau verwenden können.
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
   * Meldet einen Benutzer an. Prüft E-Mail + Passwort gegen die lokale Registry
   * (Demo-Auth): Es muss ein per Sign-up angelegtes Konto existieren und der
   * Passwort-Hash übereinstimmen. Der Anzeigename kommt aus der Registry.
   *
   * Wirft einen Error, wenn Pflichtwerte fehlen, kein Konto existiert oder das
   * Passwort falsch ist.
   */
  async login(email: string, password: string): Promise<AuthUser> {
    const mail = (email ?? '').trim();
    if (!mail || !password) {
      throw new Error('E-Mail und Passwort sind erforderlich.');
    }
    const record = this.loadRegistry()[this.normalizeEmail(mail)];
    if (!record || record.passwordHash !== this.hashPassword(password)) {
      throw new Error('E-Mail oder Passwort ist falsch.');
    }
    const user: AuthUser = {
      id: record.id,
      // Name aus der Registry; nameFromEmail nur als Fallback für Altbestand.
      name: record.name?.trim() || this.nameFromEmail(record.email || mail),
      email: record.email || mail,
      isGuest: false,
    };
    this.setUser(user);
    return user;
  }

  /**
   * Registriert einen Benutzer und meldet ihn direkt an. Legt einen
   * Registry-Eintrag mit Name, E-Mail und Passwort-Hash an (Passwort NICHT im
   * Klartext). Der aktuelle AuthUser übernimmt den eingegebenen Namen.
   *
   * Wirft einen Error, wenn Pflichtwerte fehlen oder die E-Mail bereits
   * registriert ist.
   */
  async signUp(name: string, email: string, password: string): Promise<AuthUser> {
    const displayName = (name ?? '').trim();
    const mail = (email ?? '').trim();
    if (!displayName || !mail || !password) {
      throw new Error('Name, E-Mail and Password is required.');
    }
    const key = this.normalizeEmail(mail);
    const registry = this.loadRegistry();
    if (registry[key]) {
      throw new Error('This E-Mail is already registered.');
    }
    const record: StoredCredential = {
      id: this.createUserId(mail),
      name: displayName,
      email: mail,
      passwordHash: this.hashPassword(password),
    };
    registry[key] = record;
    this.saveRegistry(registry);

    const user: AuthUser = {
      id: record.id,
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

  /** Normalisiert eine E-Mail als stabilen Registry-Schlüssel (trim + lowercase). */
  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  /**
   * Bildet den (Demo-)Passwort-Hash. Ein fester Präfix macht deutlich, dass es
   * sich um einen abgeleiteten Hash und nicht um eine reine Kodierung handelt.
   */
  private hashPassword(password: string): string {
    return demoHash(`join::${password}`);
  }

  /**
   * Lädt die lokale User-Registry aus dem localStorage (fehlertolerant).
   * Liefert bei fehlendem/kaputtem Eintrag oder ohne localStorage ein leeres
   * Objekt.
   */
  private loadRegistry(): Record<string, StoredCredential> {
    try {
      const raw = this.getStorage()?.getItem(USERS_STORAGE_KEY);
      if (!raw) {
        return {};
      }
      const parsed = JSON.parse(raw) as unknown;
      return parsed && typeof parsed === 'object'
        ? (parsed as Record<string, StoredCredential>)
        : {};
    } catch {
      return {};
    }
  }

  /** Spiegelt die User-Registry in den localStorage (fehlertolerant). */
  private saveRegistry(registry: Record<string, StoredCredential>): void {
    try {
      this.getStorage()?.setItem(USERS_STORAGE_KEY, JSON.stringify(registry));
    } catch {
      // Registry-Persistenz ist demo-lokal – Fehler dürfen Sign-up nicht brechen.
    }
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
