import { convertToParamMap } from '@angular/router';

import { AuthRedirectService, DEFAULT_REDIRECT_URL } from './auth-redirect.service';

/**
 * Tests for the AuthRedirectService (Sprint 3: Turquoise 3).
 *
 * Verifies the safe derivation of the post-login target from a raw redirectUrl
 * value: an allowlist of internal routes, a fallback to /summary, as well as the
 * defense against open-redirect patterns (external/protocol-relative URLs, auth
 * and public routes).
 */
describe('AuthRedirectService', () => {
  let service: AuthRedirectService;

  beforeEach(() => {
    service = new AuthRedirectService();
  });

  describe('getRedirectUrl - fallback to /summary', () => {
    it('returns /summary for null', () => {
      expect(service.getRedirectUrl(null)).toBe('/summary');
    });

    it('returns /summary for undefined', () => {
      expect(service.getRedirectUrl(undefined)).toBe('/summary');
    });

    it('returns /summary for an empty string', () => {
      expect(service.getRedirectUrl('')).toBe('/summary');
    });

    it('returns /summary for pure whitespace', () => {
      expect(service.getRedirectUrl('   ')).toBe('/summary');
    });

    it('DEFAULT_REDIRECT_URL is /summary', () => {
      expect(DEFAULT_REDIRECT_URL).toBe('/summary');
    });
  });

  describe('getRedirectUrl - allowed internal routes', () => {
    it('keeps /board', () => {
      expect(service.getRedirectUrl('/board')).toBe('/board');
    });

    it('keeps /contacts', () => {
      expect(service.getRedirectUrl('/contacts')).toBe('/contacts');
    });

    it('keeps /add-task', () => {
      expect(service.getRedirectUrl('/add-task')).toBe('/add-task');
    });

    it('keeps /summary', () => {
      expect(service.getRedirectUrl('/summary')).toBe('/summary');
    });

    it('keeps a query string on an allowed route', () => {
      expect(service.getRedirectUrl('/board?x=1')).toBe('/board?x=1');
    });
  });

  describe('getRedirectUrl - rejected / unsafe values', () => {
    it('rejects an external URL', () => {
      expect(service.getRedirectUrl('https://evil.example')).toBe('/summary');
    });

    it('rejects a protocol-relative URL (//evil)', () => {
      expect(service.getRedirectUrl('//evil.example')).toBe('/summary');
    });

    it('rejects a URL with a scheme elsewhere', () => {
      expect(service.getRedirectUrl('/board://evil')).toBe('/summary');
    });

    it('rejects backslash tricks', () => {
      expect(service.getRedirectUrl('/\\evil.example')).toBe('/summary');
    });

    it('rejects /login (auth route, no infinite loop)', () => {
      expect(service.getRedirectUrl('/login')).toBe('/summary');
    });

    it('rejects public routes such as /privacy-policy', () => {
      expect(service.getRedirectUrl('/privacy-policy')).toBe('/summary');
    });

    it('rejects an unknown internal route', () => {
      expect(service.getRedirectUrl('/does-not-exist')).toBe('/summary');
    });

    it('rejects path traversal that does not match exactly', () => {
      expect(service.getRedirectUrl('/board/../login')).toBe('/summary');
    });

    it('rejects a relative path without a leading slash', () => {
      expect(service.getRedirectUrl('board')).toBe('/summary');
    });
  });

  describe('getRedirectUrlFromParams', () => {
    it('reads the redirectUrl param and returns the allowed route', () => {
      const params = convertToParamMap({ redirectUrl: '/contacts' });
      expect(service.getRedirectUrlFromParams(params)).toBe('/contacts');
    });

    it('returns /summary when the param is missing', () => {
      const params = convertToParamMap({});
      expect(service.getRedirectUrlFromParams(params)).toBe('/summary');
    });

    it('returns /summary when the ParamMap is missing', () => {
      expect(service.getRedirectUrlFromParams(null)).toBe('/summary');
    });

    it('rejects an unsafe param value', () => {
      const params = convertToParamMap({ redirectUrl: 'https://evil.example' });
      expect(service.getRedirectUrlFromParams(params)).toBe('/summary');
    });
  });
});
