import { describe, it, expect, beforeEach, vi } from 'vitest';
import { searchApi, type SearchResponse } from './search';

// Mock the apiClient
vi.mock('./client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import apiClient from './client';

// Backend response format (what the API returns)
interface BackendSearchResponse {
  hits: Array<{
    id: string;
    title: string;
    slug: string;
    content_data: string | null;
    status: string;
    content_type_id: string;
    content_type_name: string;
    content_type_slug: string;
    author_id: string;
    author_name: string;
    created_at: string | null;
    updated_at: string | null;
    published_at: string | null;
    _formatted?: Record<string, any>;
  }>;
  query: string;
  total_hits: number;
  limit: number;
  offset: number;
  processing_time_ms: number;
}

describe('searchApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('search', () => {
    it('should search with query only', async () => {
      // Mock backend response format
      const mockBackendResponse: BackendSearchResponse = {
        hits: [
          {
            id: '1',
            title: 'Test Article',
            slug: 'test-article',
            content_data: '{"title": "Test Article", "body": "Content here"}',
            status: 'published',
            content_type_id: '1',
            content_type_name: 'Article',
            content_type_slug: 'article',
            author_id: '1',
            author_name: 'John Doe',
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
            published_at: '2025-01-01T00:00:00Z',
          },
        ],
        query: 'test',
        total_hits: 1,
        limit: 20,
        offset: 0,
        processing_time_ms: 15,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockBackendResponse } as any);

      const result = await searchApi.search({ q: 'test' });

      expect(result.results).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.query).toBe('test');
      expect(result.results[0].slug).toBe('test-article');
      expect(apiClient.get).toHaveBeenCalledWith('/search', {
        params: { query: 'test', limit: undefined, offset: undefined },
      });
    });

    it('should search with content type filter', async () => {
      const mockBackendResponse: BackendSearchResponse = {
        hits: [],
        query: 'article',
        total_hits: 0,
        limit: 20,
        offset: 0,
        processing_time_ms: 8,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockBackendResponse } as any);

      const result = await searchApi.search({
        q: 'article',
        content_type_id: '2',
      });

      expect(result.results).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(apiClient.get).toHaveBeenCalledWith('/search', {
        params: { query: 'article', content_type_id: '2', limit: undefined, offset: undefined },
      });
    });

    it('should search with status filter', async () => {
      const mockBackendResponse: BackendSearchResponse = {
        hits: [
          {
            id: '5',
            title: 'Draft Post',
            slug: 'draft-post',
            content_data: null,
            status: 'draft',
            content_type_id: '1',
            content_type_name: 'Post',
            content_type_slug: 'post',
            author_id: '1',
            author_name: 'Jane Doe',
            created_at: '2025-01-02T00:00:00Z',
            updated_at: '2025-01-02T00:00:00Z',
            published_at: null,
          },
        ],
        query: 'draft',
        total_hits: 1,
        limit: 20,
        offset: 0,
        processing_time_ms: 12,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockBackendResponse } as any);

      const result = await searchApi.search({
        q: 'draft',
        status: 'draft',
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0].status).toBe('draft');
      expect(apiClient.get).toHaveBeenCalledWith('/search', {
        params: { query: 'draft', status: 'draft', limit: undefined, offset: undefined },
      });
    });

    it('should search with pagination parameters', async () => {
      const mockBackendResponse: BackendSearchResponse = {
        hits: [],
        query: 'content',
        total_hits: 100,
        limit: 20,
        offset: 40,
        processing_time_ms: 20,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockBackendResponse } as any);

      const result = await searchApi.search({
        q: 'content',
        limit: 20,
        offset: 40,
      });

      expect(result.total).toBe(100);
      expect(apiClient.get).toHaveBeenCalledWith('/search', {
        params: { query: 'content', limit: 20, offset: 40 },
      });
    });

    it('should search with all filters combined', async () => {
      const mockBackendResponse: BackendSearchResponse = {
        hits: [
          {
            id: '10',
            title: 'Complete Guide',
            slug: 'published-guide',
            content_data: '{"title": "Complete Guide"}',
            status: 'published',
            content_type_id: '3',
            content_type_name: 'Guide',
            content_type_slug: 'guide',
            author_id: '2',
            author_name: 'Admin',
            created_at: '2025-01-03T00:00:00Z',
            updated_at: '2025-01-03T00:00:00Z',
            published_at: '2025-01-03T00:00:00Z',
          },
        ],
        query: 'guide',
        total_hits: 1,
        limit: 10,
        offset: 0,
        processing_time_ms: 25,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockBackendResponse } as any);

      const result = await searchApi.search({
        q: 'guide',
        content_type_id: '3',
        status: 'published',
        limit: 10,
        offset: 0,
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0].content_type_id).toBe('3');
      expect(apiClient.get).toHaveBeenCalledWith('/search', {
        params: {
          query: 'guide',
          content_type_id: '3',
          status: 'published',
          limit: 10,
          offset: 0,
        },
      });
    });

    it('should handle search with highlights', async () => {
      const mockBackendResponse: BackendSearchResponse = {
        hits: [
          {
            id: '15',
            title: 'Article Title',
            slug: 'highlighted-article',
            content_data: '{"title": "Article Title", "body": "Full content body"}',
            status: 'published',
            content_type_id: '1',
            content_type_name: 'Article',
            content_type_slug: 'article',
            author_id: '1',
            author_name: 'Author',
            created_at: '2025-01-04T00:00:00Z',
            updated_at: '2025-01-04T00:00:00Z',
            published_at: '2025-01-04T00:00:00Z',
            _formatted: {
              title: '<em>Article</em> Title',
              content_data: 'Full <em>content</em> body',
            },
          },
        ],
        query: 'article content',
        total_hits: 1,
        limit: 20,
        offset: 0,
        processing_time_ms: 18,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockBackendResponse } as any);

      const result = await searchApi.search({ q: 'article content' });

      expect(result.results).toHaveLength(1);
      expect(result.results[0].highlights).toBeDefined();
    });

    it('should handle empty search results', async () => {
      const mockBackendResponse: BackendSearchResponse = {
        hits: [],
        query: 'nonexistent',
        total_hits: 0,
        limit: 20,
        offset: 0,
        processing_time_ms: 5,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockBackendResponse } as any);

      const result = await searchApi.search({ q: 'nonexistent' });

      expect(result.results).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle search error', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Search service unavailable'));

      await expect(searchApi.search({ q: 'test' })).rejects.toThrow('Search service unavailable');
    });

    it('should handle invalid query parameter', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Query parameter required'));

      await expect(searchApi.search({ q: '' })).rejects.toThrow('Query parameter required');
    });
  });
});
