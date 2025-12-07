import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  CONTEXT_PATH: '/api/v1',
};

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_CONFIG.BASE_URL}${API_CONFIG.CONTEXT_PATH}`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
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
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.CONTEXT_PATH}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token } = response.data;
        
        // Update tokens
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Export both default and named export for compatibility
export { apiClient };
export default apiClient;

// GraphQL client
export const graphqlClient = async (query: string, variables?: Record<string, any>) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.CONTEXT_PATH}/graphql`, {
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
  
  // If it's a relative URL starting with /, prepend the base URL
  if (url.startsWith('/')) {
    return `${API_CONFIG.BASE_URL}${url}`;
  }
  
  // Already an absolute URL
  return url;
};
