import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Reset window.location
    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  describe('GraphQL Client', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    it('should make GraphQL request with query', async () => {
      // Dynamic import to avoid module initialization issues
      const { graphqlClient } = await import('./client');
      
      const mockResponse = {
        data: { user: { id: '1', email: 'test@example.com' } },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const query = '{ user { id email } }';
      const result = await graphqlClient(query);

      expect(result).toEqual(mockResponse.data);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/graphql'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ query, variables: undefined }),
        })
      );
    });

    it('should include variables in GraphQL request', async () => {
      const { graphqlClient } = await import('./client');
      
      const mockResponse = { data: { user: { id: 1 } } };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const query = 'query GetUser($id: Int!) { user(id: $id) { id } }';
      const variables = { id: 1 };
      
      await graphqlClient(query, variables);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          body: JSON.stringify({ query, variables }),
        })
      );
    });

    it('should include auth token when available', async () => {
      const { graphqlClient } = await import('./client');
      
      localStorage.setItem('access_token', 'test-token');

      const mockResponse = { data: { user: { id: 1 } } };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await graphqlClient('{ user { id } }');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('should not include auth header when token is missing', async () => {
      const { graphqlClient } = await import('./client');
      
      const mockResponse = { data: { user: { id: 1 } } };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await graphqlClient('{ user { id } }');

      const callArgs = (global.fetch as any).mock.calls[0][1];
      expect(callArgs.headers.Authorization).toBeUndefined();
    });

    it('should handle GraphQL errors', async () => {
      const { graphqlClient } = await import('./client');
      
      const mockResponse = {
        errors: [{ message: 'GraphQL error' }],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await expect(graphqlClient('{ invalid }')).rejects.toThrow('GraphQL error');
    });

    it('should handle network errors', async () => {
      const { graphqlClient } = await import('./client');
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      await expect(graphqlClient('{ user }')).rejects.toThrow(
        'GraphQL request failed: Internal Server Error'
      );
    });

    it('should handle multiple GraphQL errors', async () => {
      const { graphqlClient } = await import('./client');
      
      const mockResponse = {
        errors: [
          { message: 'Error 1' },
          { message: 'Error 2' },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Should throw first error
      await expect(graphqlClient('{ invalid }')).rejects.toThrow('Error 1');
    });
  });

  describe('Runtime Config Integration', () => {
    it('should export getApiConfig function', async () => {
      const { getApiConfig } = await import('./client');
      expect(typeof getApiConfig).toBe('function');
    });

    it('should return config with BASE_URL and CONTEXT_PATH', async () => {
      const { getApiConfig } = await import('./client');
      const config = getApiConfig();
      
      expect(config).toHaveProperty('BASE_URL');
      expect(config).toHaveProperty('CONTEXT_PATH');
      expect(config.CONTEXT_PATH).toBe('/api/v1');
    });

    it('should export API_CONFIG for backward compatibility', async () => {
      const { API_CONFIG } = await import('./client');
      
      expect(API_CONFIG).toBeDefined();
      expect(API_CONFIG.BASE_URL).toBeDefined();
      expect(API_CONFIG.CONTEXT_PATH).toBe('/api/v1');
    });

    it('should export getMediaUrl function', async () => {
      const { getMediaUrl } = await import('./client');
      expect(typeof getMediaUrl).toBe('function');
    });

    it('should export resolveMediaUrl function', async () => {
      const { resolveMediaUrl } = await import('./client');
      expect(typeof resolveMediaUrl).toBe('function');
    });
  });

  describe('getMediaUrl', () => {
    it('should return undefined for null or undefined input', async () => {
      const { getMediaUrl } = await import('./client');
      
      expect(getMediaUrl(null)).toBeUndefined();
      expect(getMediaUrl(undefined)).toBeUndefined();
      expect(getMediaUrl('')).toBeUndefined();
    });

    it('should return absolute URLs unchanged', async () => {
      const { getMediaUrl } = await import('./client');
      
      const httpUrl = 'http://example.com/image.jpg';
      const httpsUrl = 'https://example.com/image.jpg';
      
      expect(getMediaUrl(httpUrl)).toBe(httpUrl);
      expect(getMediaUrl(httpsUrl)).toBe(httpsUrl);
    });

    it('should prepend base URL to relative paths starting with /api/', async () => {
      const { getMediaUrl, getApiConfig } = await import('./client');
      const config = getApiConfig();
      
      const relativePath = '/api/v1/media/file/123';
      const result = getMediaUrl(relativePath);
      
      expect(result).toBe(`${config.BASE_URL}${relativePath}`);
    });

    it('should construct full path for media IDs', async () => {
      const { getMediaUrl, getApiConfig } = await import('./client');
      const config = getApiConfig();
      
      const mediaId = 'abc123';
      const result = getMediaUrl(mediaId);
      
      expect(result).toBe(`${config.BASE_URL}${config.CONTEXT_PATH}/media/proxy/${mediaId}`);
    });
  });

  describe('resolveMediaUrl', () => {
    it('should return empty string for null/undefined input', async () => {
      const { resolveMediaUrl } = await import('./client');
      
      expect(resolveMediaUrl(null)).toBe('');
      expect(resolveMediaUrl(undefined)).toBe('');
    });

    it('should prepend base URL to relative URLs', async () => {
      const { resolveMediaUrl, getApiConfig } = await import('./client');
      const config = getApiConfig();
      
      const relativePath = '/uploads/image.jpg';
      const result = resolveMediaUrl(relativePath);
      
      expect(result).toBe(`${config.BASE_URL}${relativePath}`);
    });

    it('should return absolute URLs unchanged', async () => {
      const { resolveMediaUrl } = await import('./client');
      
      const absoluteUrl = 'https://cdn.example.com/image.jpg';
      expect(resolveMediaUrl(absoluteUrl)).toBe(absoluteUrl);
    });
  });
});
