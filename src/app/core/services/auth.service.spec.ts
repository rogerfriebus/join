import { AuthService } from './auth.service';

/**
 * Tests für den AuthService (Sprint 3: Login-Fix).
 *
 * Die Auth-Logik ist demo-lokal: Konten liegen in einer localStorage-Registry
 * (`join.auth.users`), das Passwort wird nur als Demo-Hash gespeichert (nie im
 * Klartext). Getestet werden Registrierung, Passwortprüfung beim Login, der
 * Erhalt des Sign-up-Namens sowie der Session-Fallback und logout.
 */
describe('AuthService', () => {
  let service: AuthService;

  const USERS_KEY = 'join.auth.users';
  const SESSION_KEY = 'join.auth.user';

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

  describe('signUp', () => {
    it('setzt User, isAuthenticated und den eingegebenen Namen', async () => {
      const user = await service.signUp('Anna Schulz', 'anna@example.com', 'secret');

      expect(user.name).toBe('Anna Schulz');
      expect(user.email).toBe('anna@example.com');
      expect(user.isGuest).toBe(false);
      expect(service.isAuthenticated()).toBe(true);
      expect(service.displayName()).toBe('Anna Schulz');
    });

    it('legt einen Registry-Eintrag im localStorage an', async () => {
      await service.signUp('Anna Schulz', 'anna@example.com', 'secret');

      const registry = JSON.parse(localStorage.getItem(USERS_KEY) ?? '{}');
      expect(registry['anna@example.com']).toBeDefined();
      expect(registry['anna@example.com'].name).toBe('Anna Schulz');
      expect(registry['anna@example.com'].email).toBe('anna@example.com');
    });

    it('speichert das Passwort nicht im Klartext', async () => {
      await service.signUp('Anna Schulz', 'anna@example.com', 'secret');

      const raw = localStorage.getItem(USERS_KEY) ?? '';
      expect(raw).not.toContain('secret');
      const registry = JSON.parse(raw);
      expect(registry['anna@example.com'].passwordHash).toBeTruthy();
      expect(registry['anna@example.com'].passwordHash).not.toBe('secret');
      expect(registry['anna@example.com'].password).toBeUndefined();
    });

    it('wirft, wenn die E-Mail bereits registriert ist', async () => {
      await service.signUp('Anna Schulz', 'anna@example.com', 'secret');

      await expect(
        service.signUp('Anna Zweite', 'ANNA@example.com', 'other'),
      ).rejects.toThrow('Diese E-Mail ist bereits registriert.');
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

  describe('login', () => {
    beforeEach(async () => {
      await service.signUp('Anna Schulz', 'anna@example.com', 'secret');
      service.logout();
    });

    it('meldet mit korrektem Passwort an und setzt den Zustand', async () => {
      const user = await service.login('anna@example.com', 'secret');

      expect(user.isGuest).toBe(false);
      expect(user.email).toBe('anna@example.com');
      expect(service.user()).toEqual(user);
      expect(service.isAuthenticated()).toBe(true);
      expect(service.isGuest()).toBe(false);
    });

    it('verwendet den Sign-up-Namen, nicht den E-Mail-Präfix', async () => {
      await service.login('anna@example.com', 'secret');
      expect(service.displayName()).toBe('Anna Schulz');
    });

    it('ist unabhängig von der Groß-/Kleinschreibung der E-Mail', async () => {
      await service.login('ANNA@example.com', 'secret');
      expect(service.isAuthenticated()).toBe(true);
      expect(service.displayName()).toBe('Anna Schulz');
    });

    it('wirft bei falschem Passwort und bleibt abgemeldet', async () => {
      await expect(service.login('anna@example.com', 'wrong')).rejects.toThrow(
        'E-Mail oder Passwort ist falsch.',
      );
      expect(service.isAuthenticated()).toBe(false);
    });

    it('wirft bei unbekannter E-Mail', async () => {
      await expect(service.login('unknown@example.com', 'secret')).rejects.toThrow(
        'E-Mail oder Passwort ist falsch.',
      );
      expect(service.isAuthenticated()).toBe(false);
    });

    it('erzeugt für eine unbekannte E-Mail KEIN neues Konto', async () => {
      await expect(service.login('ghost@example.com', 'whatever')).rejects.toThrow();

      const registry = JSON.parse(localStorage.getItem(USERS_KEY) ?? '{}');
      expect(registry['ghost@example.com']).toBeUndefined();
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

  describe('loginAsGuest', () => {
    it('setzt einen Gast-User und isGuest', async () => {
      const guest = await service.loginAsGuest();

      expect(guest.isGuest).toBe(true);
      expect(service.isAuthenticated()).toBe(true);
      expect(service.isGuest()).toBe(true);
      expect(service.displayName()).toBe('Guest');
    });

    it('legt keinen Registry-Eintrag an', async () => {
      await service.loginAsGuest();
      expect(localStorage.getItem(USERS_KEY)).toBeNull();
    });
  });

  describe('logout', () => {
    it('setzt den AuthState zurück, behält aber die Registry', async () => {
      await service.signUp('Anna Schulz', 'anna@example.com', 'secret');
      expect(service.isAuthenticated()).toBe(true);

      service.logout();

      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(service.isGuest()).toBe(false);
      expect(service.displayName()).toBe('');
      expect(localStorage.getItem(SESSION_KEY)).toBeNull();
      // Registry bleibt erhalten -> erneuter Login weiterhin möglich.
      expect(localStorage.getItem(USERS_KEY)).not.toBeNull();
      await expect(service.login('anna@example.com', 'secret')).resolves.toBeTruthy();
    });
  });

  describe('getState / getUser', () => {
    it('liefert einen konsistenten Snapshot', async () => {
      expect(service.getState()).toEqual({ user: null, isAuthenticated: false });
      expect(service.getUser()).toBeNull();

      const user = await service.signUp('Anna Schulz', 'anna@example.com', 'secret');

      expect(service.getUser()).toEqual(user);
      expect(service.getState()).toEqual({ user, isAuthenticated: true });
    });
  });

  describe('Session-Fallback (localStorage)', () => {
    it('stellt einen eingeloggten User nach Neustart wieder her', async () => {
      await service.signUp('Anna Schulz', 'anna@example.com', 'secret');

      const restored = new AuthService();

      expect(restored.isAuthenticated()).toBe(true);
      expect(restored.user()?.email).toBe('anna@example.com');
      expect(restored.displayName()).toBe('Anna Schulz');
    });

    it('stellt nach logout keinen User mehr her', async () => {
      await service.signUp('Anna Schulz', 'anna@example.com', 'secret');
      service.logout();

      const restored = new AuthService();

      expect(restored.isAuthenticated()).toBe(false);
      expect(restored.user()).toBeNull();
    });

    it('bleibt bei kaputtem localStorage-Eintrag nicht authentifiziert', () => {
      localStorage.setItem(SESSION_KEY, '{ not valid json');

      const restored = new AuthService();

      expect(restored.isAuthenticated()).toBe(false);
      expect(restored.user()).toBeNull();
    });
  });
});
