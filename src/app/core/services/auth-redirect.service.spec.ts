import { convertToParamMap } from '@angular/router';

import { AuthRedirectService, DEFAULT_REDIRECT_URL } from './auth-redirect.service';

/**
 * Tests für den AuthRedirectService (Sprint 3: Türkis 3).
 *
 * Geprüft wird die sichere Ableitung des Post-Login-Ziels aus einem rohen
 * redirectUrl-Wert: Allowlist interner Routen, Fallback auf /summary sowie die
 * Abwehr von Open-Redirect-Mustern (externe/protokoll-relative URLs, Auth-/
 * öffentliche Routen).
 */
describe('AuthRedirectService', () => {
  let service: AuthRedirectService;

  beforeEach(() => {
    service = new AuthRedirectService();
  });

  describe('getRedirectUrl – Fallback auf /summary', () => {
    it('liefert /summary bei null', () => {
      expect(service.getRedirectUrl(null)).toBe('/summary');
    });

    it('liefert /summary bei undefined', () => {
      expect(service.getRedirectUrl(undefined)).toBe('/summary');
    });

    it('liefert /summary bei leerem String', () => {
      expect(service.getRedirectUrl('')).toBe('/summary');
    });

    it('liefert /summary bei reinem Whitespace', () => {
      expect(service.getRedirectUrl('   ')).toBe('/summary');
    });

    it('DEFAULT_REDIRECT_URL ist /summary', () => {
      expect(DEFAULT_REDIRECT_URL).toBe('/summary');
    });
  });

  describe('getRedirectUrl – erlaubte interne Routen', () => {
    it('behält /board', () => {
      expect(service.getRedirectUrl('/board')).toBe('/board');
    });

    it('behält /contacts', () => {
      expect(service.getRedirectUrl('/contacts')).toBe('/contacts');
    });

    it('behält /add-task', () => {
      expect(service.getRedirectUrl('/add-task')).toBe('/add-task');
    });

    it('behält /summary', () => {
      expect(service.getRedirectUrl('/summary')).toBe('/summary');
    });

    it('behält einen Query-String an einer erlaubten Route', () => {
      expect(service.getRedirectUrl('/board?x=1')).toBe('/board?x=1');
    });
  });

  describe('getRedirectUrl – verworfene / unsichere Werte', () => {
    it('verwirft eine externe URL', () => {
      expect(service.getRedirectUrl('https://evil.example')).toBe('/summary');
    });

    it('verwirft eine protokoll-relative URL (//evil)', () => {
      expect(service.getRedirectUrl('//evil.example')).toBe('/summary');
    });

    it('verwirft eine URL mit Schema an anderer Stelle', () => {
      expect(service.getRedirectUrl('/board://evil')).toBe('/summary');
    });

    it('verwirft Backslash-Tricks', () => {
      expect(service.getRedirectUrl('/\\evil.example')).toBe('/summary');
    });

    it('verwirft /login (Auth-Route, keine Endlosschleife)', () => {
      expect(service.getRedirectUrl('/login')).toBe('/summary');
    });

    it('verwirft öffentliche Routen wie /privacy-policy', () => {
      expect(service.getRedirectUrl('/privacy-policy')).toBe('/summary');
    });

    it('verwirft eine unbekannte interne Route', () => {
      expect(service.getRedirectUrl('/does-not-exist')).toBe('/summary');
    });

    it('verwirft Pfad-Traversal, das nicht exakt matcht', () => {
      expect(service.getRedirectUrl('/board/../login')).toBe('/summary');
    });

    it('verwirft einen relativen Pfad ohne führenden Slash', () => {
      expect(service.getRedirectUrl('board')).toBe('/summary');
    });
  });

  describe('getRedirectUrlFromParams', () => {
    it('liest den redirectUrl-Param und liefert die erlaubte Route', () => {
      const params = convertToParamMap({ redirectUrl: '/contacts' });
      expect(service.getRedirectUrlFromParams(params)).toBe('/contacts');
    });

    it('liefert /summary, wenn der Param fehlt', () => {
      const params = convertToParamMap({});
      expect(service.getRedirectUrlFromParams(params)).toBe('/summary');
    });

    it('liefert /summary bei fehlender ParamMap', () => {
      expect(service.getRedirectUrlFromParams(null)).toBe('/summary');
    });

    it('verwirft einen unsicheren Param-Wert', () => {
      const params = convertToParamMap({ redirectUrl: 'https://evil.example' });
      expect(service.getRedirectUrlFromParams(params)).toBe('/summary');
    });
  });
});
