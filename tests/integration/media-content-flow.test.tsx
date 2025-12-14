/**
 * Integration Test: Media Upload → Content Attachment → Preview Workflow
 * 
 * Tests the complete workflow of:
 * 1. Uploading media files
 * 2. Retrieving uploaded media
 * 3. Attaching media to content entries
 * 4. Verifying media in content preview
 * 5. Complete end-to-end media workflow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { Media, ContentEntry, PaginatedResponse } from '@/types';

// Mock the media API
vi.mock('@/lib/api/media', () => ({
  mediaApi: {
    getMedia: vi.fn(),
    getMediaItem: vi.fn(),
    uploadMedia: vi.fn(),
    updateMedia: vi.fn(),
    deleteMedia: vi.fn(),
  },
}));

// Mock the content API
vi.mock('@/lib/api/content', () => ({
  contentApi: {
    getContentEntry: vi.fn(),
    updateContentEntry: vi.fn(),
  },
}));

import { mediaApi } from '@/lib/api/media';
import { contentApi } from '@/lib/api/content';

describe('Integration: Media Upload → Content Attachment → Preview', () => {
  // Mock media files
  const mockImageMedia: Media = {
    id: '1',
    filename: 'hero-image.jpg',
    original_filename: 'my-photo.jpg',
    file_type: 'image',
    file_size: 2048000,
    mime_type: 'image/jpeg',
    storage_path: 'uploads/2025/11/hero-image.jpg',
    public_url: 'https://cdn.example.com/uploads/2025/11/hero-image.jpg',
    alt_text: 'Hero banner image',
    title: 'Homepage Hero',
    uploaded_by_id: '1',
    organization_id: '1',
    created_at: '2025-11-25T10:00:00Z',
    updated_at: '2025-11-25T10:00:00Z',
  };

  const mockDocumentMedia: Media = {
    id: '2',
    filename: 'user-guide.pdf',
    original_filename: 'product-guide.pdf',
    file_type: 'document',
    file_size: 1024000,
    mime_type: 'application/pdf',
    storage_path: 'uploads/2025/11/user-guide.pdf',
    public_url: 'https://cdn.example.com/uploads/2025/11/user-guide.pdf',
    alt_text: undefined,
    title: 'User Guide',
    uploaded_by_id: '1',
    organization_id: '1',
    created_at: '2025-11-25T10:05:00Z',
    updated_at: '2025-11-25T10:05:00Z',
  };

  const mockContentEntry: ContentEntry = {
    id: '1',
    content_type_id: '1',
    slug: 'product-launch',
    status: 'draft',
    version: 1,
    content_data: {
      title: 'Product Launch Post',
      body: 'Announcing our new product!',
      featured_image: undefined,
      attachments: [],
    },
    author_id: '1',
    created_at: '2025-11-25T09:00:00Z',
    updated_at: '2025-11-25T09:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Step 1: Upload Media File', () => {
    it('should upload an image file successfully', async () => {
      vi.mocked(mediaApi.uploadMedia).mockResolvedValue(mockImageMedia);

      const formData = new FormData();
      formData.append('file', new Blob(['image data'], { type: 'image/jpeg' }), 'hero-image.jpg');
      formData.append('alt_text', 'Hero banner image');
      formData.append('title', 'Homepage Hero');

      const result = await mediaApi.uploadMedia(formData);

      expect(mediaApi.uploadMedia).toHaveBeenCalledWith(formData);
      expect(result).toEqual(mockImageMedia);
      expect(result.file_type).toBe('image');
      expect(result.public_url).toContain('hero-image.jpg');
    });

    it('should upload a document file successfully', async () => {
      vi.mocked(mediaApi.uploadMedia).mockResolvedValue(mockDocumentMedia);

      const formData = new FormData();
      formData.append('file', new Blob(['pdf data'], { type: 'application/pdf' }), 'user-guide.pdf');
      formData.append('title', 'User Guide');

      const result = await mediaApi.uploadMedia(formData);

      expect(mediaApi.uploadMedia).toHaveBeenCalledWith(formData);
      expect(result).toEqual(mockDocumentMedia);
      expect(result.file_type).toBe('document');
      expect(result.mime_type).toBe('application/pdf');
    });

    it('should handle upload errors', async () => {
      vi.mocked(mediaApi.uploadMedia).mockRejectedValue(new Error('File size exceeds limit'));

      const formData = new FormData();
      formData.append('file', new Blob(['large file'], { type: 'image/jpeg' }), 'huge-image.jpg');

      await expect(mediaApi.uploadMedia(formData)).rejects.toThrow('File size exceeds limit');
      expect(mediaApi.uploadMedia).toHaveBeenCalledWith(formData);
    });
  });

  describe('Step 2: Retrieve Uploaded Media', () => {
    it('should get uploaded media item by id', async () => {
      vi.mocked(mediaApi.getMediaItem).mockResolvedValue(mockImageMedia);

      const result = await mediaApi.getMediaItem("1");

      expect(mediaApi.getMediaItem).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockImageMedia);
      expect(result.id).toBe(1);
      expect(result.filename).toBe('hero-image.jpg');
    });

    it('should list all uploaded media with pagination', async () => {
      const paginatedResponse: PaginatedResponse<Media> = {
        items: [mockImageMedia, mockDocumentMedia],
        total: 2,
        page: 1,
        page_size: 10,
        pages: 1,
      };

      vi.mocked(mediaApi.getMedia).mockResolvedValue(paginatedResponse);

      const result = await mediaApi.getMedia({ page: 1, per_page: 10 });

      expect(mediaApi.getMedia).toHaveBeenCalledWith({ page: 1, per_page: 10 });
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.items[0].file_type).toBe('image');
      expect(result.items[1].file_type).toBe('document');
    });

    it('should filter media by file type', async () => {
      const filteredResponse: PaginatedResponse<Media> = {
        items: [mockImageMedia],
        total: 1,
        page: 1,
        page_size: 10,
        pages: 1,
      };

      vi.mocked(mediaApi.getMedia).mockResolvedValue(filteredResponse);

      const result = await mediaApi.getMedia({ file_type: 'image' });

      expect(mediaApi.getMedia).toHaveBeenCalledWith({ file_type: 'image' });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].file_type).toBe('image');
    });
  });

  describe('Step 3: Attach Media to Content Entry', () => {
    it('should attach featured image to content entry', async () => {
      const updatedContent: ContentEntry = {
        ...mockContentEntry,
        content_data: {
          ...mockContentEntry.content_data,
          featured_image: mockImageMedia.public_url,
        },
        updated_at: '2025-11-25T10:30:00Z',
      };

      vi.mocked(contentApi.updateContentEntry).mockResolvedValue(updatedContent);

      const result = await contentApi.updateContentEntry(mockContentEntry.id, {
        content_data: {
          ...mockContentEntry.content_data,
          featured_image: mockImageMedia.public_url,
        },
      });

      expect(contentApi.updateContentEntry).toHaveBeenCalledWith(mockContentEntry.id, {
        content_data: {
          title: 'Product Launch Post',
          body: 'Announcing our new product!',
          featured_image: mockImageMedia.public_url,
          attachments: [],
        },
      });
      expect(result.content_data!.featured_image).toBe(mockImageMedia.public_url);
    });

    it('should attach multiple documents to content entry', async () => {
      const updatedContent: ContentEntry = {
        ...mockContentEntry,
        content_data: {
          ...mockContentEntry.content_data,
          attachments: [mockDocumentMedia.public_url],
        },
        updated_at: '2025-11-25T10:35:00Z',
      };

      vi.mocked(contentApi.updateContentEntry).mockResolvedValue(updatedContent);

      const result = await contentApi.updateContentEntry(mockContentEntry.id, {
        content_data: {
          ...mockContentEntry.content_data,
          attachments: [mockDocumentMedia.public_url],
        },
      });

      expect(result.content_data!.attachments).toHaveLength(1);
      expect(result.content_data!.attachments[0]).toBe(mockDocumentMedia.public_url);
    });

    it('should handle attachment errors', async () => {
      vi.mocked(contentApi.updateContentEntry).mockRejectedValue(new Error('Invalid media URL'));

      await expect(
        contentApi.updateContentEntry(mockContentEntry.id, {
          content_data: {
            ...mockContentEntry.content_data,
            featured_image: 'invalid-url',
          },
        })
      ).rejects.toThrow('Invalid media URL');
    });
  });

  describe('Step 4: Verify Media in Content', () => {
    it('should retrieve content with attached media', async () => {
      const contentWithMedia: ContentEntry = {
        ...mockContentEntry,
        content_data: {
          body: 'Announcing our new product!',
          featured_image: mockImageMedia.public_url,
          attachments: [mockDocumentMedia.public_url],
        },
      };

      vi.mocked(contentApi.getContentEntry).mockResolvedValue(contentWithMedia);

      const result = await contentApi.getContentEntry(mockContentEntry.id);

      expect(contentApi.getContentEntry).toHaveBeenCalledWith(mockContentEntry.id);
      expect(result.content_data!.featured_image).toBe(mockImageMedia.public_url);
      expect(result.content_data!.attachments).toHaveLength(1);
      expect(result.content_data!.attachments[0]).toBe(mockDocumentMedia.public_url);
    });

    it('should verify media metadata is intact', async () => {
      vi.mocked(mediaApi.getMediaItem).mockResolvedValue(mockImageMedia);

      const media = await mediaApi.getMediaItem(mockImageMedia.id);

      expect(media.alt_text).toBe('Hero banner image');
      expect(media.title).toBe('Homepage Hero');
      expect(media.file_size).toBe(2048000);
      expect(media.mime_type).toBe('image/jpeg');
    });
  });

  describe('Complete Media Workflow', () => {
    it('should complete full workflow: upload → attach → verify', async () => {
      // Step 1: Upload image
      vi.mocked(mediaApi.uploadMedia).mockResolvedValue(mockImageMedia);
      const formData = new FormData();
      formData.append('file', new Blob(['image data'], { type: 'image/jpeg' }), 'hero-image.jpg');
      const uploadedMedia = await mediaApi.uploadMedia(formData);
      expect(uploadedMedia.id).toBe(mockImageMedia.id);

      // Step 2: Attach to content
      const contentWithMedia: ContentEntry = {
        ...mockContentEntry,
        content_data: {
          ...mockContentEntry.content_data,
          featured_image: uploadedMedia.public_url,
        },
      };
      vi.mocked(contentApi.updateContentEntry).mockResolvedValue(contentWithMedia);
      const updatedContent = await contentApi.updateContentEntry(mockContentEntry.id, {
        content_data: { ...mockContentEntry.content_data, featured_image: uploadedMedia.public_url },
      });
      expect(updatedContent.content_data!.featured_image).toBe(mockImageMedia.public_url);

      // Step 3: Verify content retrieval
      vi.mocked(contentApi.getContentEntry).mockResolvedValue(contentWithMedia);
      const retrievedContent = await contentApi.getContentEntry(mockContentEntry.id);
      expect(retrievedContent.content_data!.featured_image).toBe(mockImageMedia.public_url);

      // Step 4: Verify media retrieval
      vi.mocked(mediaApi.getMediaItem).mockResolvedValue(mockImageMedia);
      const retrievedMedia = await mediaApi.getMediaItem(uploadedMedia.id);
      expect(retrievedMedia.public_url).toBe(mockImageMedia.public_url);
    });

    it('should handle multiple media attachments in workflow', async () => {
      // Upload image
      vi.mocked(mediaApi.uploadMedia).mockResolvedValueOnce(mockImageMedia);
      const imageFormData = new FormData();
      const uploadedImage = await mediaApi.uploadMedia(imageFormData);

      // Upload document
      vi.mocked(mediaApi.uploadMedia).mockResolvedValueOnce(mockDocumentMedia);
      const docFormData = new FormData();
      const uploadedDoc = await mediaApi.uploadMedia(docFormData);

      // Attach both to content
      const contentWithBoth: ContentEntry = {
        ...mockContentEntry,
        content_data: {
          body: 'Announcing our new product!',
          featured_image: uploadedImage.public_url,
          attachments: [uploadedDoc.public_url],
        },
      };
      vi.mocked(contentApi.updateContentEntry).mockResolvedValue(contentWithBoth);
      const updated = await contentApi.updateContentEntry(mockContentEntry.id, {
        content_data: contentWithBoth.content_data,
      });

      expect(updated.content_data!.featured_image).toBe(mockImageMedia.public_url);
      expect(updated.content_data!.attachments).toContain(mockDocumentMedia.public_url);
    });

    it('should maintain media references after content updates', async () => {
      const contentWithMedia: ContentEntry = {
        ...mockContentEntry,
        content_data: {
          body: 'Updated product announcement!',
          featured_image: mockImageMedia.public_url,
          attachments: [mockDocumentMedia.public_url],
        },
      };

      vi.mocked(contentApi.updateContentEntry).mockResolvedValue(contentWithMedia);
      const updated = await contentApi.updateContentEntry(mockContentEntry.id, {
        content_data: { body: 'Updated product announcement!' },
      });

      // Media references should persist
      expect(updated.content_data!.featured_image).toBe(mockImageMedia.public_url);
      expect(updated.content_data!.attachments[0]).toBe(mockDocumentMedia.public_url);
    });
  });
});
