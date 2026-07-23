import { Injectable, Signal, computed, signal } from '@angular/core';

/**
 * An authenticated user (logged in or guest).
 *
 * Deliberately kept lean: in this sprint slice (Turquoise 1) only the fields
 * that login/guards/summary will need later are modelled. There is NO real
 * password/token management – the demo auth is local.
 */
export interface AuthUser {
  /** Unique id of the user (guest: `guest`). */
  id: string;
  /** Display name of the user. */
  name: string;
  /** Email address, optional (guests have none). */
  email?: string;
  /** Marks a guest login. */
  isGuest: boolean;
}

/**
 * Snapshot of the auth state.
 *
 * `isAuthenticated` is redundant with `user !== null`, but is carried along
 * deliberately so that consumers (guards/UI) get a stable state contract.
 */
export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
}

/** localStorage key for the optional session fallback. */
const STORAGE_KEY = 'join.auth.user';

/** localStorage key for the local user registry (sign-up accounts). */
const USERS_STORAGE_KEY = 'join.auth.users';

/** Fixed guest user (no persistent record needed). */
const GUEST_USER: AuthUser = { id: 'guest', name: 'Guest', isGuest: true };

/**
 * An account stored in the local registry (sign-up record).
 *
 * Deliberately contains ONLY the fields required for the demo login. The
 * password is stored exclusively as a (demo) hash – never in plaintext.
 */
interface StoredCredential {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

/**
 * Demo hash for passwords.
 *
 * NOTE: This is DELIBERATELY NOT a cryptographically secure hash. Its only
 * purpose is to avoid writing the password to localStorage in plaintext in
 * this school project. For production a real auth backend (e.g. Supabase Auth)
 * is required. The algorithm is an FNV-1a variant (32-bit) and returns a
 * synchronous, deterministic hex string – easy to test, without a library.
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
 * Central auth service (Sprint 3: Turquoise 1 – foundation).
 *
 * Exposes the login status, the current user and the domain methods
 * (login/signUp/loginAsGuest/logout) as a clear interface. UI and later guards
 * consume exclusively this facade.
 *
 * Demo setup (Developer Akademie):
 *  - The auth logic is DELIBERATELY local/demo-grade: no tokens, no Supabase
 *    auth integration. Accounts are held in a local registry (localStorage);
 *    the password is stored only as a demo hash, never in plaintext – this is
 *    NOT production-safe.
 *  - login() checks email + password against this registry (no more
 *    auto-creation of unknown accounts).
 *  - The current state is additionally mirrored to localStorage so that a
 *    reload keeps the session. Access is encapsulated and fault-tolerant.
 *  - Structure and API are chosen so that Pink/Login and Turquoise/Guards can
 *    use them without rework.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  /**
   * Internal auth state. On service start it is restored – if present – from
   * localStorage (session fallback).
   */
  private readonly userSignal = signal<AuthUser | null>(this.restoreUser());

  /** Current user (read-only), or null when nobody is logged in. */
  readonly user: Signal<AuthUser | null> = this.userSignal.asReadonly();

  /** True as soon as a user (including guest) is logged in. */
  readonly isAuthenticated: Signal<boolean> = computed(() => this.userSignal() !== null);

  /** True when the current user is a guest. */
  readonly isGuest: Signal<boolean> = computed(() => this.userSignal()?.isGuest ?? false);

  /**
   * Display name for the UI:
   *  - the user name, if set,
   *  - "Guest" for guests,
   *  - empty string when nobody is logged in.
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

  /** Returns a snapshot of the current auth state. */
  getState(): AuthState {
    const user = this.userSignal();
    return { user, isAuthenticated: user !== null };
  }

  /** Returns the current user (snapshot) or null. */
  getUser(): AuthUser | null {
    return this.userSignal();
  }

  /**
   * Logs a user in. Checks email + password against the local registry
   * (demo auth): an account created via sign-up must exist and the password
   * hash must match. The display name comes from the registry.
   *
   * Throws an Error when required values are missing, no account exists or the
   * password is wrong.
   */
  async login(email: string, password: string): Promise<AuthUser> {
    const mail = (email ?? '').trim();
    if (!mail || !password) {
      throw new Error('Email and password are required.');
    }
    const record = this.loadRegistry()[this.normalizeEmail(mail)];
    if (!record || record.passwordHash !== this.hashPassword(password)) {
      throw new Error('Email or password is incorrect.');
    }
    const user: AuthUser = {
      id: record.id,
      // Name from the registry; nameFromEmail only as a fallback for legacy data.
      name: record.name?.trim() || this.nameFromEmail(record.email || mail),
      email: record.email || mail,
      isGuest: false,
    };
    this.setUser(user);
    return user;
  }

  /**
   * Registers a user and logs them in directly. Creates a registry entry with
   * name, email and password hash (password NOT in plaintext). The current
   * AuthUser takes on the entered name.
   *
   * Throws an Error when required values are missing or the email is already
   * registered.
   */
  async signUp(name: string, email: string, password: string): Promise<AuthUser> {
    const displayName = (name ?? '').trim();
    const mail = (email ?? '').trim();
    if (!displayName || !mail || !password) {
      throw new Error('Name, email and password are required.');
    }
    const key = this.normalizeEmail(mail);
    const registry = this.loadRegistry();
    if (registry[key]) {
      throw new Error('This email is already registered.');
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

  /** Logs a guest in (without email/password). */
  async loginAsGuest(): Promise<AuthUser> {
    const guest: AuthUser = { ...GUEST_USER };
    this.setUser(guest);
    return guest;
  }

  /** Logs the current user out and discards the session fallback. */
  logout(): void {
    this.userSignal.set(null);
    this.clearStoredUser();
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  /** Sets the user in the signal and mirrors it into the session fallback. */
  private setUser(user: AuthUser): void {
    this.userSignal.set(user);
    this.persistUser(user);
  }

  /** Builds a stable, demo-grade id from the email. */
  private createUserId(email: string): string {
    return `user-${email.toLowerCase()}`;
  }

  /** Derives a simple display name from an email (the part before the @). */
  private nameFromEmail(email: string): string {
    const localPart = email.split('@')[0]?.trim();
    return localPart || email;
  }

  /** Normalizes an email into a stable registry key (trim + lowercase). */
  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  /**
   * Builds the (demo) password hash. A fixed prefix makes clear that this is a
   * derived hash and not a plain encoding.
   */
  private hashPassword(password: string): string {
    return demoHash(`join::${password}`);
  }

  /**
   * Loads the local user registry from localStorage (fault-tolerant).
   * Returns an empty object when the entry is missing/corrupt or localStorage
   * is unavailable.
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

  /** Mirrors the user registry into localStorage (fault-tolerant). */
  private saveRegistry(registry: Record<string, StoredCredential>): void {
    try {
      this.getStorage()?.setItem(USERS_STORAGE_KEY, JSON.stringify(registry));
    } catch {
      // Registry persistence is demo-local – errors must not break sign-up.
    }
  }

  /**
   * Restores the user from localStorage (session fallback).
   * Fault-tolerant: returns null when the entry is missing/corrupt or
   * localStorage is unavailable.
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

  /** Mirrors the user into localStorage (fault-tolerant). */
  private persistUser(user: AuthUser): void {
    try {
      this.getStorage()?.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {
      // Session fallback is optional – errors must not break the login.
    }
  }

  /** Removes the user from localStorage (fault-tolerant). */
  private clearStoredUser(): void {
    try {
      this.getStorage()?.removeItem(STORAGE_KEY);
    } catch {
      // deliberately ignored (see persistUser)
    }
  }

  /** Reads the raw entry from localStorage (fault-tolerant). */
  private safeStorageGet(): string | null {
    try {
      return this.getStorage()?.getItem(STORAGE_KEY) ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Returns localStorage if available in the current environment
   * (e.g. not in pure server/non-browser contexts).
   */
  private getStorage(): Storage | null {
    try {
      return typeof localStorage !== 'undefined' ? localStorage : null;
    } catch {
      return null;
    }
  }
}
