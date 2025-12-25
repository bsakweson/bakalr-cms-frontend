import { mediaApi } from './media';
import { describe, it, expect, vi, beforeEach } from 'vitest';

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

describe('Media API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMedia', () => {
    it('should fetch media items without params', async () => {
      const mockResponse = {
        items: [
          { id: '1', filename: 'image1.jpg', file_type: 'image/jpeg' },
          { id: '2', filename: 'image2.png', file_type: 'image/png' },
        ],
        total: 2,
        page: 1,
        page_size: 20,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await mediaApi.getMedia();

      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith('/media', {
        params: { page: 1, size: 20 },
      });
    });

    it('should fetch media items with filters', async () => {
      const mockResponse = {
        items: [{ id: '1', filename: 'image1.jpg' }],
        total: 1,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const params = {
        page: 2,
        page_size: 10,
        file_type: 'image',
        search: 'logo',
      };

      const result = await mediaApi.getMedia(params);

      expect(result).toEqual(mockResponse);
      // Note: Implementation converts page_size to size for backend
      expect(apiClient.get).toHaveBeenCalledWith('/media', {
        params: {
          page: 2,
          size: 10,
          file_type: 'image',
          search: 'logo',
        },
      });
    });
  });

  describe('getMediaItem', () => {
    it('should fetch single media item', async () => {
      const mockMedia = {
        id: '1',
        filename: 'test.jpg',
        file_type: 'image/jpeg',
        public_url: 'https://example.com/test.jpg',
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockMedia } as any);

      const result = await mediaApi.getMediaItem("1");

      expect(result).toEqual(mockMedia);
      expect(apiClient.get).toHaveBeenCalledWith('/media/1');
    });
  });

  describe('uploadMedia', () => {
    it('should upload media file with FormData', async () => {
      const mockResponse = {
        id: '3',
        filename: 'uploaded.jpg',
        file_type: 'image/jpeg',
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockResponse } as any);

      const formData = new FormData();
      formData.append('file', new Blob(['content']), 'test.jpg');

      const result = await mediaApi.uploadMedia(formData);

      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith('/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    });

    it('should upload media with metadata', async () => {
      const mockResponse = {
        id: '4',
        filename: 'photo.jpg',
        alt_text: 'A photo',
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockResponse } as any);

      const formData = new FormData();
      formData.append('file', new Blob(['content']), 'photo.jpg');
      formData.append('alt_text', 'A photo');

      const result = await mediaApi.uploadMedia(formData);

      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith(
        '/media/upload',
        formData,
        expect.objectContaining({
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      );
    });
  });

  describe('updateMedia', () => {
    it('should update media metadata', async () => {
      const updateData = { alt_text: 'Updated alt text', caption: 'New caption' };
      const mockResponse = {
        id: '1',
        filename: 'image.jpg',
        alt_text: 'Updated alt text',
        caption: 'New caption',
      };

      vi.mocked(apiClient.put).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await mediaApi.updateMedia("1", updateData);

      expect(result).toEqual(mockResponse);
      expect(apiClient.put).toHaveBeenCalledWith('/media/1', updateData);
    });

    it('should update partial media fields', async () => {
      const mockResponse = { id: '1', alt_text: 'New alt' };

      vi.mocked(apiClient.put).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await mediaApi.updateMedia("1", { alt_text: 'New alt' });

      expect(result).toEqual(mockResponse);
      expect(apiClient.put).toHaveBeenCalledWith('/media/1', { alt_text: 'New alt' });
    });
  });

  describe('deleteMedia', () => {
    it('should delete media item', async () => {
      vi.mocked(apiClient.delete).mockResolvedValueOnce({} as any);

      await mediaApi.deleteMedia("1");

      expect(apiClient.delete).toHaveBeenCalledWith('/media/1');
    });

    it('should handle deletion of multiple items', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({} as any);

      await Promise.all([
        mediaApi.deleteMedia("1"),
        mediaApi.deleteMedia("2"),
        mediaApi.deleteMedia("3"),
      ]);

      expect(apiClient.delete).toHaveBeenCalledTimes(3);
      expect(apiClient.delete).toHaveBeenCalledWith('/media/1');
      expect(apiClient.delete).toHaveBeenCalledWith('/media/2');
      expect(apiClient.delete).toHaveBeenCalledWith('/media/3');
    });
  });
});
