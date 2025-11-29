import { describe, it, expect, beforeEach, vi } from 'vitest';
import { searchApi, type SearchResponse } from './search';
import apiClient from './client';

vi.mock('./client');

describe('searchApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('search', () => {
    it('should search with query only', async () => {
      const mockResponse: SearchResponse = {
        results: [
          {
            id: 1,
            content_type_id: 1,
            slug: 'test-article',
            status: 'published',
            content_data: { title: 'Test Article', body: 'Content here' },
            score: 0.95,
          },
        ],
        total: 1,
        query: 'test',
        processing_time_ms: 15,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await searchApi.search({ q: 'test' });

      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/search', {
        params: { q: 'test' },
      });
    });

    it('should search with content type filter', async () => {
      const mockResponse: SearchResponse = {
        results: [],
        total: 0,
        query: 'article',
        processing_time_ms: 8,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await searchApi.search({
        q: 'article',
        content_type_id: 2,
      });

      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/search', {
        params: { q: 'article', content_type_id: 2 },
      });
    });

    it('should search with status filter', async () => {
      const mockResponse: SearchResponse = {
        results: [
          {
            id: 5,
            content_type_id: 1,
            slug: 'draft-post',
            status: 'draft',
            content_data: { title: 'Draft Post' },
            score: 0.88,
          },
        ],
        total: 1,
        query: 'draft',
        processing_time_ms: 12,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await searchApi.search({
        q: 'draft',
        status: 'draft',
      });

      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/search', {
        params: { q: 'draft', status: 'draft' },
      });
    });

    it('should search with pagination parameters', async () => {
      const mockResponse: SearchResponse = {
        results: [],
        total: 100,
        query: 'content',
        processing_time_ms: 20,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await searchApi.search({
        q: 'content',
        limit: 20,
        offset: 40,
      });

      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/search', {
        params: { q: 'content', limit: 20, offset: 40 },
      });
    });

    it('should search with all filters combined', async () => {
      const mockResponse: SearchResponse = {
        results: [
          {
            id: 10,
            content_type_id: 3,
            slug: 'published-guide',
            status: 'published',
            content_data: { title: 'Complete Guide' },
            score: 0.92,
            highlights: {
              title: ['Complete <em>Guide</em>'],
            },
          },
        ],
        total: 1,
        query: 'guide',
        processing_time_ms: 25,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await searchApi.search({
        q: 'guide',
        content_type_id: 3,
        status: 'published',
        limit: 10,
        offset: 0,
      });

      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/search', {
        params: {
          q: 'guide',
          content_type_id: 3,
          status: 'published',
          limit: 10,
          offset: 0,
        },
      });
    });

    it('should handle search with highlights', async () => {
      const mockResponse: SearchResponse = {
        results: [
          {
            id: 15,
            content_type_id: 1,
            slug: 'highlighted-article',
            status: 'published',
            content_data: { title: 'Article Title', body: 'Full content body' },
            score: 0.98,
            highlights: {
              title: ['<em>Article</em> Title'],
              body: ['Full <em>content</em> body'],
            },
          },
        ],
        total: 1,
        query: 'article content',
        processing_time_ms: 18,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await searchApi.search({ q: 'article content' });

      expect(result).toEqual(mockResponse);
      expect(result.results[0].highlights).toBeDefined();
      expect(result.results[0].highlights?.title).toContain('<em>Article</em> Title');
    });

    it('should handle empty search results', async () => {
      const mockResponse: SearchResponse = {
        results: [],
        total: 0,
        query: 'nonexistent',
        processing_time_ms: 5,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await searchApi.search({ q: 'nonexistent' });

      expect(result).toEqual(mockResponse);
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
