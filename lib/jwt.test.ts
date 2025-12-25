import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  parseJwtToken,
  isTokenExpired,
  getTokenExpiration,
  getOrganizationIdFromToken,
  getUserIdFromToken,
  getTenantIdFromStoredToken,
  getStoredAccessToken,
  JwtPayload,
} from './jwt';

// Helper to create a valid JWT token
function createMockJwt(payload: JwtPayload): string {
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const signature = 'mock-signature';
  return `${header}.${body}.${signature}`;
}

describe('JWT Utilities', () => {
  describe('parseJwtToken', () => {
    it('should parse a valid JWT token', () => {
      const payload: JwtPayload = {
        sub: 'user-123',
        org_id: 'org-456',
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const token = createMockJwt(payload);

      const result = parseJwtToken(token);

      expect(result).toEqual(payload);
    });

    it('should return null for empty string', () => {
      expect(parseJwtToken('')).toBeNull();
    });

    it('should return null for null/undefined', () => {
      expect(parseJwtToken(null as unknown as string)).toBeNull();
      expect(parseJwtToken(undefined as unknown as string)).toBeNull();
    });

    it('should return null for invalid token format (not 3 parts)', () => {
      expect(parseJwtToken('invalid')).toBeNull();
      expect(parseJwtToken('invalid.token')).toBeNull();
      expect(parseJwtToken('a.b.c.d')).toBeNull();
    });

    it('should return null for malformed base64 payload', () => {
      expect(parseJwtToken('valid.!!!invalid-base64!!!.sig')).toBeNull();
    });

    it('should return null for non-JSON payload', () => {
      const invalidToken = `header.${btoa('not-json')}.signature`;
      expect(parseJwtToken(invalidToken)).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for non-expired token', () => {
      const payload: JwtPayload = {
        sub: 'user-123',
        exp: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
      };
      const token = createMockJwt(payload);

      expect(isTokenExpired(token)).toBe(false);
    });

    it('should return true for expired token', () => {
      const payload: JwtPayload = {
        sub: 'user-123',
        exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
      };
      const token = createMockJwt(payload);

      expect(isTokenExpired(token)).toBe(true);
    });

    it('should return true for token without exp claim', () => {
      const payload: JwtPayload = {
        sub: 'user-123',
      };
      const token = createMockJwt(payload);

      expect(isTokenExpired(token)).toBe(true);
    });

    it('should return true for invalid token', () => {
      expect(isTokenExpired('invalid-token')).toBe(true);
      expect(isTokenExpired('')).toBe(true);
    });

    it('should respect buffer time', () => {
      // Token expires in 2 minutes
      const payload: JwtPayload = {
        sub: 'user-123',
        exp: Math.floor(Date.now() / 1000) + 120, // 2 minutes
      };
      const token = createMockJwt(payload);

      // Without buffer - not expired
      expect(isTokenExpired(token, 0)).toBe(false);

      // With 5 minute buffer - considered expired
      expect(isTokenExpired(token, 5 * 60 * 1000)).toBe(true);
    });
  });

  describe('getTokenExpiration', () => {
    it('should return expiration time in milliseconds', () => {
      const expSeconds = Math.floor(Date.now() / 1000) + 3600;
      const payload: JwtPayload = {
        sub: 'user-123',
        exp: expSeconds,
      };
      const token = createMockJwt(payload);

      expect(getTokenExpiration(token)).toBe(expSeconds * 1000);
    });

    it('should return null for token without exp', () => {
      const payload: JwtPayload = {
        sub: 'user-123',
      };
      const token = createMockJwt(payload);

      expect(getTokenExpiration(token)).toBeNull();
    });

    it('should return null for invalid token', () => {
      expect(getTokenExpiration('invalid')).toBeNull();
    });
  });

  describe('getOrganizationIdFromToken', () => {
    it('should extract org_id from token', () => {
      const payload: JwtPayload = {
        sub: 'user-123',
        org_id: 'org-456',
      };
      const token = createMockJwt(payload);

      expect(getOrganizationIdFromToken(token)).toBe('org-456');
    });

    it('should return null if org_id not present', () => {
      const payload: JwtPayload = {
        sub: 'user-123',
      };
      const token = createMockJwt(payload);

      expect(getOrganizationIdFromToken(token)).toBeNull();
    });

    it('should return null for invalid token', () => {
      expect(getOrganizationIdFromToken('invalid')).toBeNull();
    });
  });

  describe('getUserIdFromToken', () => {
    it('should extract user ID (sub) from token', () => {
      const payload: JwtPayload = {
        sub: 'user-123',
        org_id: 'org-456',
      };
      const token = createMockJwt(payload);

      expect(getUserIdFromToken(token)).toBe('user-123');
    });

    it('should return null if sub not present', () => {
      const payload: JwtPayload = {
        org_id: 'org-456',
      };
      const token = createMockJwt(payload);

      expect(getUserIdFromToken(token)).toBeNull();
    });
  });

  describe('getTenantIdFromStoredToken', () => {
    beforeEach(() => {
      // Clear localStorage before each test
      localStorage.clear();
    });

    it('should return org_id from stored token', () => {
      const payload: JwtPayload = {
        sub: 'user-123',
        org_id: 'org-456',
      };
      const token = createMockJwt(payload);
      localStorage.setItem('access_token', token);

      expect(getTenantIdFromStoredToken()).toBe('org-456');
    });

    it('should return empty string if no token stored', () => {
      // localStorage is already clear from beforeEach
      expect(getTenantIdFromStoredToken()).toBe('');
    });

    it('should return empty string if token has no org_id', () => {
      const payload: JwtPayload = {
        sub: 'user-123',
      };
      const token = createMockJwt(payload);
      localStorage.setItem('access_token', token);

      expect(getTenantIdFromStoredToken()).toBe('');
    });

    it('should return empty string on server-side (no window)', () => {
      const originalWindow = global.window;
      // @ts-ignore - Testing server-side behavior
      delete global.window;

      expect(getTenantIdFromStoredToken()).toBe('');

      // Restore window
      global.window = originalWindow;
    });
  });

  describe('getStoredAccessToken', () => {
    beforeEach(() => {
      // Clear localStorage before each test
      localStorage.clear();
    });

    it('should return stored access token', () => {
      localStorage.setItem('access_token', 'stored-token');

      expect(getStoredAccessToken()).toBe('stored-token');
    });

    it('should return null if no token stored', () => {
      // localStorage is already clear from beforeEach
      expect(getStoredAccessToken()).toBeNull();
    });

    it('should return null on server-side', () => {
      const originalWindow = global.window;
      // @ts-ignore - Testing server-side behavior
      delete global.window;

      expect(getStoredAccessToken()).toBeNull();

      // Restore window
      global.window = originalWindow;
    });
  });
});
