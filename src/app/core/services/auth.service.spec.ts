import { AuthService } from './auth.service';

/**
 * Tests für den AuthService (Sprint 3: Türkis 1 – Grundlage).
 *
 * Die Auth-Logik ist demo-tauglich (keine echte Passwortprüfung). Getestet
 * werden der Zustandsübergang der Signale (user/isAuthenticated/isGuest/
 * displayName), die Pflichtwert-Validierung sowie der optionale
 * localStorage-Session-Fallback.
 */
describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    service = new AuthService();
  });

  describe('Initialzustand', () => {
    it('ist initial nicht authentifiziert', () => {
      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(service.isGuest()).toBe(false);
      expect(service.displayName()).toBe('');
    });
  });

  describe('login', () => {
    it('setzt User und isAuthenticated', async () => {
      const user = await service.login('anna@example.com', 'secret');

      expect(user.isGuest).toBe(false);
      expect(user.email).toBe('anna@example.com');
      expect(service.user()).toEqual(user);
      expect(service.isAuthenticated()).toBe(true);
      expect(service.isGuest()).toBe(false);
    });

    it('leitet einen Anzeigenamen aus der E-Mail ab', async () => {
      await service.login('anna@example.com', 'secret');
      expect(service.displayName()).toBe('anna');
    });

    it('wirft bei fehlender E-Mail', async () => {
      await expect(service.login('', 'secret')).rejects.toThrow(
        'E-Mail und Passwort sind erforderlich.',
      );
      expect(service.isAuthenticated()).toBe(false);
    });

    it('wirft bei fehlendem Passwort', async () => {
      await expect(service.login('anna@example.com', '')).rejects.toThrow(
        'E-Mail und Passwort sind erforderlich.',
      );
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('signUp', () => {
    it('setzt User und isAuthenticated', async () => {
      const user = await service.signUp('Anna Schulz', 'anna@example.com', 'secret');

      expect(user.name).toBe('Anna Schulz');
      expect(user.email).toBe('anna@example.com');
      expect(user.isGuest).toBe(false);
      expect(service.isAuthenticated()).toBe(true);
      expect(service.displayName()).toBe('Anna Schulz');
    });

    it('wirft bei fehlendem Namen', async () => {
      await expect(service.signUp('', 'anna@example.com', 'secret')).rejects.toThrow(
        'Name, E-Mail und Passwort sind erforderlich.',
      );
      expect(service.isAuthenticated()).toBe(false);
    });

    it('wirft bei fehlender E-Mail', async () => {
      await expect(service.signUp('Anna Schulz', '', 'secret')).rejects.toThrow(
        'Name, E-Mail und Passwort sind erforderlich.',
      );
    });

    it('wirft bei fehlendem Passwort', async () => {
      await expect(service.signUp('Anna Schulz', 'anna@example.com', '')).rejects.toThrow(
        'Name, E-Mail und Passwort sind erforderlich.',
      );
    });
  });

  describe('loginAsGuest', () => {
    it('setzt einen Gast-User und isGuest', async () => {
      const guest = await service.loginAsGuest();

      expect(guest.isGuest).toBe(true);
      expect(service.isAuthenticated()).toBe(true);
      expect(service.isGuest()).toBe(true);
      expect(service.displayName()).toBe('Guest');
    });
  });

  describe('logout', () => {
    it('setzt den AuthState zurück', async () => {
      await service.login('anna@example.com', 'secret');
      expect(service.isAuthenticated()).toBe(true);

      service.logout();

      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(service.isGuest()).toBe(false);
      expect(service.displayName()).toBe('');
    });
  });

  describe('getState / getUser', () => {
    it('liefert einen konsistenten Snapshot', async () => {
      expect(service.getState()).toEqual({ user: null, isAuthenticated: false });
      expect(service.getUser()).toBeNull();

      const user = await service.login('anna@example.com', 'secret');

      expect(service.getUser()).toEqual(user);
      expect(service.getState()).toEqual({ user, isAuthenticated: true });
    });
  });

  describe('Session-Fallback (localStorage)', () => {
    it('stellt einen eingeloggten User nach Neustart wieder her', async () => {
      await service.login('anna@example.com', 'secret');

      const restored = new AuthService();

      expect(restored.isAuthenticated()).toBe(true);
      expect(restored.user()?.email).toBe('anna@example.com');
      expect(restored.displayName()).toBe('anna');
    });

    it('stellt nach logout keinen User mehr her', async () => {
      await service.login('anna@example.com', 'secret');
      service.logout();

      const restored = new AuthService();

      expect(restored.isAuthenticated()).toBe(false);
      expect(restored.user()).toBeNull();
    });

    it('bleibt bei kaputtem localStorage-Eintrag nicht authentifiziert', () => {
      localStorage.setItem('join.auth.user', '{ not valid json');

      const restored = new AuthService();

      expect(restored.isAuthenticated()).toBe(false);
      expect(restored.user()).toBeNull();
    });
  });
});
