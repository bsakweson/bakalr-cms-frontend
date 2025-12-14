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
});
