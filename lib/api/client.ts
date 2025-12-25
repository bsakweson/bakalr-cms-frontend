import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getRuntimeConfig } from '@/lib/runtime-config';
import { isTokenExpired } from '@/lib/jwt';

// API Configuration - uses runtime config for flexibility
export const getApiConfig = () => {
  const config = getRuntimeConfig();
  return {
    BASE_URL: config.cmsApiUrl,
    CONTEXT_PATH: '/api/v1',
  };
};

// Legacy export for backward compatibility (uses build-time values as fallback)
export const API_CONFIG = {
  get BASE_URL() { return getApiConfig().BASE_URL; },
  CONTEXT_PATH: '/api/v1',
};

/**
 * Constructs the full media URL from a stored media reference.
 * Handles relative paths, media IDs, and full URLs.
 *
 * @param mediaRef - Can be a full URL, relative path (/api/v1/...), or just media ID/filename
 * @returns Full URL to the media resource, or undefined if no reference provided
 */
export function getMediaUrl(mediaRef: string | undefined | null): string | undefined {
  if (!mediaRef) return undefined;

  const config = getApiConfig();

  // Already a full URL (http/https) - return as-is
  if (mediaRef.startsWith('http://') || mediaRef.startsWith('https://')) {
    return mediaRef;
  }

  // Already has API path prefix - just prepend base URL
  if (mediaRef.startsWith('/api/')) {
    return `${config.BASE_URL}${mediaRef}`;
  }

  // Just the media ID/filename - construct full path
  return `${config.BASE_URL}${config.CONTEXT_PATH}/media/proxy/${mediaRef}`;
}

// Lazy-initialized axios instance
let _apiClient: AxiosInstance | null = null;

function createApiClient(): AxiosInstance {
  const config = getApiConfig();

  const client = axios.create({
    baseURL: `${config.BASE_URL}${config.CONTEXT_PATH}`,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  // Request interceptor to add auth token
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem('access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle token refresh
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      const apiConfig = getApiConfig();

      // Skip token refresh for auth endpoints (login, register, refresh, etc.)
      const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') ||
                             originalRequest?.url?.includes('/auth/register') ||
                             originalRequest?.url?.includes('/auth/refresh') ||
                             originalRequest?.url?.includes('/auth/social');

      // If 401 and not already retried and not an auth endpoint, try to refresh token
      if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
        originalRequest._retry = true;

        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await axios.post(`${apiConfig.BASE_URL}${apiConfig.CONTEXT_PATH}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token, refresh_token } = response.data;

          // Update tokens
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', refresh_token);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return client(originalRequest);
        } catch (refreshError) {
          // Before redirecting, check if we actually have valid tokens
          // This prevents redirect loops when old requests fail after a new login
          const currentToken = localStorage.getItem('access_token');
          const hasValidToken = currentToken && !isTokenExpired(currentToken);

          if (!hasValidToken) {
            // Only clear and redirect if we don't have valid tokens
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            // Only redirect if not already on login page
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
              window.location.href = '/login';
            }
          }
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
}

/**
 * Get the API client instance (lazy-initialized)
 */
function getApiClient(): AxiosInstance {
  if (!_apiClient) {
    _apiClient = createApiClient();
  }
  return _apiClient;
}

// Create a proxy object that delegates to the lazy-initialized client
const apiClient = new Proxy({} as AxiosInstance, {
  get(_, prop: keyof AxiosInstance) {
    const client = getApiClient();
    const value = client[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

// Export both default and named export for compatibility
export { apiClient };
export default apiClient;

// GraphQL client
export const graphqlClient = async (query: string, variables?: Record<string, any>) => {
  const token = localStorage.getItem('access_token');
  const config = getApiConfig();

  const response = await fetch(`${config.BASE_URL}${config.CONTEXT_PATH}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.statusText}`);
  }

  const { data, errors } = await response.json();

  if (errors) {
    throw new Error(errors[0].message);
  }

  return data;
};

/**
 * Resolve a media URL to an absolute URL.
 * Handles relative URLs (like /api/v1/media/proxy/...) by prepending the API base URL.
 *
 * @param url - The URL to resolve (can be relative or absolute)
 * @returns The resolved absolute URL
 */
export const resolveMediaUrl = (url: string | null | undefined): string => {
  if (!url) return '';

  const config = getApiConfig();

  // If it's a relative URL starting with /, prepend the base URL
  if (url.startsWith('/')) {
    return `${config.BASE_URL}${url}`;
  }

  // Already an absolute URL
  return url;
};
