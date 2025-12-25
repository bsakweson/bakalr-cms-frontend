/**
 * JWT Token Utilities
 *
 * Shared utilities for parsing and extracting data from JWT tokens.
 * Used across the application for authentication and multi-tenancy.
 */

export interface JwtPayload {
  sub?: string; // User ID
  org_id?: string; // Organization/Tenant ID
  email?: string;
  roles?: string[];
  permissions?: string[];
  api_scopes?: string[];
  exp?: number; // Expiration timestamp (seconds)
  iat?: number; // Issued at timestamp (seconds)
  iss?: string; // Issuer
  type?: string; // Token type (access/refresh)
  name?: string;
  given_name?: string;
  family_name?: string;
  is_organization_owner?: boolean;
}

/**
 * Parse a JWT token and return its payload.
 * Returns null if the token is invalid or cannot be parsed.
 *
 * @param token - The JWT token string
 * @returns The decoded payload or null
 */
export function parseJwtToken(token: string): JwtPayload | null {
  if (!token || typeof token !== 'string') {
    return null;
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));
    return payload as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Check if a JWT token is expired.
 *
 * @param token - The JWT token string
 * @param bufferMs - Optional buffer time in milliseconds before actual expiration (default: 0)
 * @returns true if expired or invalid, false otherwise
 */
export function isTokenExpired(token: string, bufferMs: number = 0): boolean {
  const payload = parseJwtToken(token);
  if (!payload || !payload.exp) {
    return true;
  }

  const expirationMs = payload.exp * 1000;
  return Date.now() >= expirationMs - bufferMs;
}

/**
 * Get the expiration time of a JWT token in milliseconds.
 *
 * @param token - The JWT token string
 * @returns Expiration time in milliseconds, or null if invalid
 */
export function getTokenExpiration(token: string): number | null {
  const payload = parseJwtToken(token);
  if (!payload || !payload.exp) {
    return null;
  }

  return payload.exp * 1000;
}

/**
 * Extract the organization/tenant ID from a JWT token.
 *
 * @param token - The JWT token string
 * @returns The organization ID or null if not found
 */
export function getOrganizationIdFromToken(token: string): string | null {
  const payload = parseJwtToken(token);
  return payload?.org_id || null;
}

/**
 * Extract the user ID from a JWT token.
 *
 * @param token - The JWT token string
 * @returns The user ID or null if not found
 */
export function getUserIdFromToken(token: string): string | null {
  const payload = parseJwtToken(token);
  return payload?.sub || null;
}

/**
 * Get the organization/tenant ID from the access token stored in localStorage.
 * This is a convenience function for client-side code.
 *
 * @returns The organization ID or empty string if not available
 */
export function getTenantIdFromStoredToken(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  const token = localStorage.getItem('access_token');
  if (!token) {
    return '';
  }

  return getOrganizationIdFromToken(token) || '';
}

/**
 * Get the access token from localStorage.
 * Returns null on server-side or if not found.
 *
 * @returns The access token or null
 */
export function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem('access_token');
}
