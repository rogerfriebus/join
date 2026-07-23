import { AuthService } from './auth.service';

/**
 * Tests for the AuthService (Sprint 3: login fix).
 *
 * The auth logic is demo-local: accounts live in a localStorage registry
 * (`join.auth.users`), and the password is only stored as a demo hash (never in
 * plain text). This covers registration, password verification on login, the
 * preservation of the sign-up name, as well as the session fallback and logout.
 */
describe('AuthService', () => {
  let service: AuthService;

  const USERS_KEY = 'join.auth.users';
  const SESSION_KEY = 'join.auth.user';

  beforeEach(() => {
    localStorage.clear();
    service = new AuthService();
  });

  describe('Initial state', () => {
    it('is not authenticated initially', () => {
      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(service.isGuest()).toBe(false);
      expect(service.displayName()).toBe('');
    });
  });

  describe('signUp', () => {
    it('sets the user, isAuthenticated and the entered name', async () => {
      const user = await service.signUp('Anna Schulz', 'anna@example.com', 'secret');

      expect(user.name).toBe('Anna Schulz');
      expect(user.email).toBe('anna@example.com');
      expect(user.isGuest).toBe(false);
      expect(service.isAuthenticated()).toBe(true);
      expect(service.displayName()).toBe('Anna Schulz');
    });

    it('creates a registry entry in localStorage', async () => {
      await service.signUp('Anna Schulz', 'anna@example.com', 'secret');

      const registry = JSON.parse(localStorage.getItem(USERS_KEY) ?? '{}');
      expect(registry['anna@example.com']).toBeDefined();
      expect(registry['anna@example.com'].name).toBe('Anna Schulz');
      expect(registry['anna@example.com'].email).toBe('anna@example.com');
    });

    it('does not store the password in plain text', async () => {
      await service.signUp('Anna Schulz', 'anna@example.com', 'secret');

      const raw = localStorage.getItem(USERS_KEY) ?? '';
      expect(raw).not.toContain('secret');
      const registry = JSON.parse(raw);
      expect(registry['anna@example.com'].passwordHash).toBeTruthy();
      expect(registry['anna@example.com'].passwordHash).not.toBe('secret');
      expect(registry['anna@example.com'].password).toBeUndefined();
    });

    it('throws when the email is already registered', async () => {
      await service.signUp('Anna Schulz', 'anna@example.com', 'secret');

      await expect(
        service.signUp('Anna Zweite', 'ANNA@example.com', 'other'),
      ).rejects.toThrow('This email is already registered.');
    });

    it('throws when the name is missing', async () => {
      await expect(service.signUp('', 'anna@example.com', 'secret')).rejects.toThrow(
        'Name, email and password are required.',
      );
      expect(service.isAuthenticated()).toBe(false);
    });

    it('throws when the email is missing', async () => {
      await expect(service.signUp('Anna Schulz', '', 'secret')).rejects.toThrow(
        'Name, email and password are required.',
      );
    });

    it('throws when the password is missing', async () => {
      await expect(service.signUp('Anna Schulz', 'anna@example.com', '')).rejects.toThrow(
        'Name, email and password are required.',
      );
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await service.signUp('Anna Schulz', 'anna@example.com', 'secret');
      service.logout();
    });

    it('logs in with the correct password and sets the state', async () => {
      const user = await service.login('anna@example.com', 'secret');

      expect(user.isGuest).toBe(false);
      expect(user.email).toBe('anna@example.com');
      expect(service.user()).toEqual(user);
      expect(service.isAuthenticated()).toBe(true);
      expect(service.isGuest()).toBe(false);
    });

    it('uses the sign-up name, not the email prefix', async () => {
      await service.login('anna@example.com', 'secret');
      expect(service.displayName()).toBe('Anna Schulz');
    });

    it('is case-insensitive with respect to the email', async () => {
      await service.login('ANNA@example.com', 'secret');
      expect(service.isAuthenticated()).toBe(true);
      expect(service.displayName()).toBe('Anna Schulz');
    });

    it('throws on a wrong password and stays logged out', async () => {
      await expect(service.login('anna@example.com', 'wrong')).rejects.toThrow(
        'Email or password is incorrect.',
      );
      expect(service.isAuthenticated()).toBe(false);
    });

    it('throws for an unknown email', async () => {
      await expect(service.login('unknown@example.com', 'secret')).rejects.toThrow(
        'Email or password is incorrect.',
      );
      expect(service.isAuthenticated()).toBe(false);
    });

    it('does NOT create a new account for an unknown email', async () => {
      await expect(service.login('ghost@example.com', 'whatever')).rejects.toThrow();

      const registry = JSON.parse(localStorage.getItem(USERS_KEY) ?? '{}');
      expect(registry['ghost@example.com']).toBeUndefined();
    });

    it('throws when the email is missing', async () => {
      await expect(service.login('', 'secret')).rejects.toThrow(
        'Email and password are required.',
      );
      expect(service.isAuthenticated()).toBe(false);
    });

    it('throws when the password is missing', async () => {
      await expect(service.login('anna@example.com', '')).rejects.toThrow(
        'Email and password are required.',
      );
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('loginAsGuest', () => {
    it('sets a guest user and isGuest', async () => {
      const guest = await service.loginAsGuest();

      expect(guest.isGuest).toBe(true);
      expect(service.isAuthenticated()).toBe(true);
      expect(service.isGuest()).toBe(true);
      expect(service.displayName()).toBe('Guest');
    });

    it('does not create a registry entry', async () => {
      await service.loginAsGuest();
      expect(localStorage.getItem(USERS_KEY)).toBeNull();
    });
  });

  describe('logout', () => {
    it('resets the auth state but keeps the registry', async () => {
      await service.signUp('Anna Schulz', 'anna@example.com', 'secret');
      expect(service.isAuthenticated()).toBe(true);

      service.logout();

      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(service.isGuest()).toBe(false);
      expect(service.displayName()).toBe('');
      expect(localStorage.getItem(SESSION_KEY)).toBeNull();
      // Registry is preserved -> logging in again is still possible.
      expect(localStorage.getItem(USERS_KEY)).not.toBeNull();
      await expect(service.login('anna@example.com', 'secret')).resolves.toBeTruthy();
    });
  });

  describe('getState / getUser', () => {
    it('returns a consistent snapshot', async () => {
      expect(service.getState()).toEqual({ user: null, isAuthenticated: false });
      expect(service.getUser()).toBeNull();

      const user = await service.signUp('Anna Schulz', 'anna@example.com', 'secret');

      expect(service.getUser()).toEqual(user);
      expect(service.getState()).toEqual({ user, isAuthenticated: true });
    });
  });

  describe('Session fallback (localStorage)', () => {
    it('restores a logged-in user after a restart', async () => {
      await service.signUp('Anna Schulz', 'anna@example.com', 'secret');

      const restored = new AuthService();

      expect(restored.isAuthenticated()).toBe(true);
      expect(restored.user()?.email).toBe('anna@example.com');
      expect(restored.displayName()).toBe('Anna Schulz');
    });

    it('no longer restores a user after logout', async () => {
      await service.signUp('Anna Schulz', 'anna@example.com', 'secret');
      service.logout();

      const restored = new AuthService();

      expect(restored.isAuthenticated()).toBe(false);
      expect(restored.user()).toBeNull();
    });

    it('stays unauthenticated when the localStorage entry is corrupt', () => {
      localStorage.setItem(SESSION_KEY, '{ not valid json');

      const restored = new AuthService();

      expect(restored.isAuthenticated()).toBe(false);
      expect(restored.user()).toBeNull();
    });
  });
});
