import { contentApi } from './content';
import apiClient from './client';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client');

describe('Content API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Content Types', () => {
    describe('getContentTypes', () => {
      it('should fetch all content types', async () => {
        const mockTypes = [
          { id: 1, name: 'Blog Post', slug: 'blog-post' },
          { id: 2, name: 'Page', slug: 'page' },
        ];

        vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockTypes } as any);

        const result = await contentApi.getContentTypes();

        expect(result).toEqual(mockTypes);
        expect(apiClient.get).toHaveBeenCalledWith('/content/types');
      });
    });

    describe('getContentType', () => {
      it('should fetch single content type by id', async () => {
        const mockType = { id: 1, name: 'Blog Post', slug: 'blog-post' };

        vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockType } as any);

        const result = await contentApi.getContentType(1);

        expect(result).toEqual(mockType);
        expect(apiClient.get).toHaveBeenCalledWith('/content/types/1');
      });
    });

    describe('createContentType', () => {
      it('should create new content type', async () => {
        const newType = { name: 'Product', slug: 'product', schema: {} };
        const mockResponse = { id: 3, ...newType };

        vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockResponse } as any);

        const result = await contentApi.createContentType(newType);

        expect(result).toEqual(mockResponse);
        expect(apiClient.post).toHaveBeenCalledWith('/content/types', newType);
      });
    });

    describe('updateContentType', () => {
      it('should update existing content type', async () => {
        const updateData = { name: 'Updated Name' };
        const mockResponse = { id: 1, name: 'Updated Name', slug: 'blog-post' };

        vi.mocked(apiClient.put).mockResolvedValueOnce({ data: mockResponse } as any);

        const result = await contentApi.updateContentType(1, updateData);

        expect(result).toEqual(mockResponse);
        expect(apiClient.put).toHaveBeenCalledWith('/content/types/1', updateData);
      });
    });

    describe('deleteContentType', () => {
      it('should delete content type', async () => {
        vi.mocked(apiClient.delete).mockResolvedValueOnce({} as any);

        await contentApi.deleteContentType(1);

        expect(apiClient.delete).toHaveBeenCalledWith('/content/types/1');
      });
    });
  });

  describe('Content Entries', () => {
    describe('getContentEntries', () => {
      it('should fetch content entries with default params', async () => {
        const mockResponse = {
          items: [
            { id: 1, title: 'Post 1' },
            { id: 2, title: 'Post 2' },
          ],
          total: 2,
          page: 1,
          per_page: 20,
        };

        vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

        const result = await contentApi.getContentEntries();

        expect(result).toEqual(mockResponse);
        expect(apiClient.get).toHaveBeenCalledWith('/content/entries', {
          params: undefined,
        });
      });

      it('should fetch content entries with filters', async () => {
        const mockResponse = {
          items: [{ id: 1, title: 'Post 1' }],
          total: 1,
        };

        vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

        const params = {
          page: 2,
          per_page: 10,
          content_type_id: 1,
          status: 'published',
        };

        const result = await contentApi.getContentEntries(params);

        expect(result).toEqual(mockResponse);
        expect(apiClient.get).toHaveBeenCalledWith('/content/entries', {
          params,
        });
      });
    });

    describe('getContentEntry', () => {
      it('should fetch single content entry', async () => {
        const mockEntry = { id: 1, title: 'Test Post', content: 'Content here' };

        vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockEntry } as any);

        const result = await contentApi.getContentEntry(1);

        expect(result).toEqual(mockEntry);
        expect(apiClient.get).toHaveBeenCalledWith('/content/entries/1');
      });
    });

    describe('createContentEntry', () => {
      it('should create new content entry', async () => {
        const newEntry = {
          title: 'New Post',
          content_type_id: 1,
          fields: { body: 'Content' },
        };
        const mockResponse = { id: 10, ...newEntry };

        vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockResponse } as any);

        const result = await contentApi.createContentEntry(newEntry);

        expect(result).toEqual(mockResponse);
        expect(apiClient.post).toHaveBeenCalledWith('/content/entries', newEntry);
      });
    });

    describe('updateContentEntry', () => {
      it('should update content entry', async () => {
        const updateData = { status: 'published' as const };
        const mockResponse = { id: 1, status: 'published' } as any;

        vi.mocked(apiClient.put).mockResolvedValueOnce({ data: mockResponse } as any);

        const result = await contentApi.updateContentEntry(1, updateData);

        expect(result).toEqual(mockResponse);
        expect(apiClient.put).toHaveBeenCalledWith('/content/entries/1', updateData);
      });
    });

    describe('deleteContentEntry', () => {
      it('should delete content entry', async () => {
        vi.mocked(apiClient.delete).mockResolvedValueOnce({} as any);

        await contentApi.deleteContentEntry(1);

        expect(apiClient.delete).toHaveBeenCalledWith('/content/entries/1');
      });
    });

    describe('publishContentEntry', () => {
      it('should publish content entry', async () => {
        const mockResponse = { id: 1, status: 'published' };

        vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockResponse } as any);

        const result = await contentApi.publishContentEntry(1);

        expect(result).toEqual(mockResponse);
        expect(apiClient.post).toHaveBeenCalledWith('/content/entries/1/publish');
      });
    });

    describe('unpublishContentEntry', () => {
      it('should unpublish content entry', async () => {
        const mockResponse = { id: 1, status: 'draft' };

        vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockResponse } as any);

        const result = await contentApi.unpublishContentEntry(1);

        expect(result).toEqual(mockResponse);
        expect(apiClient.post).toHaveBeenCalledWith('/content/entries/1/unpublish');
      });
    });
  });
});
