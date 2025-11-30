import { describe, it, expect, beforeEach, vi } from 'vitest';
import { templateApi, type ContentTemplate, type ContentTemplateCreate, type ContentTemplateUpdate, type ContentTemplateListResponse } from './templates';
import { apiClient } from './client';

vi.mock('./client');

describe('templateApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listTemplates', () => {
    it('should fetch templates with default parameters', async () => {
      const mockResponse: ContentTemplateListResponse = {
        templates: [
          {
            id: 1,
            organization_id: 1,
            content_type_id: 1,
            name: 'Blog Post Template',
            description: 'Standard blog post',
            is_system_template: false,
            is_published: true,
            usage_count: 15,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        page_size: 10,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await templateApi.listTemplates();

      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith('/templates', { params: undefined });
    });

    it('should fetch templates with pagination', async () => {
      const mockResponse: ContentTemplateListResponse = {
        templates: [],
        total: 50,
        page: 3,
        page_size: 20,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await templateApi.listTemplates({ page: 3, page_size: 20 });

      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith('/templates', {
        params: { page: 3, page_size: 20 },
      });
    });

    it('should fetch templates filtered by content_type_id', async () => {
      const mockResponse: ContentTemplateListResponse = {
        templates: [
          {
            id: 2,
            organization_id: 1,
            content_type_id: 2,
            name: 'Product Template',
            is_system_template: false,
            is_published: true,
            usage_count: 8,
            created_at: '2025-01-05T00:00:00Z',
            updated_at: '2025-01-05T00:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        page_size: 10,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await templateApi.listTemplates({ content_type_id: 2 });

      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith('/templates', {
        params: { content_type_id: 2 },
      });
    });

    it('should fetch only published templates', async () => {
      const mockResponse: ContentTemplateListResponse = {
        templates: [],
        total: 10,
        page: 1,
        page_size: 10,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await templateApi.listTemplates({ published_only: true });

      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith('/templates', {
        params: { published_only: true },
      });
    });

    it('should fetch templates by category', async () => {
      const mockResponse: ContentTemplateListResponse = {
        templates: [],
        total: 5,
        page: 1,
        page_size: 10,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await templateApi.listTemplates({ category: 'marketing' });

      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith('/templates', {
        params: { category: 'marketing' },
      });
    });

    it('should handle error when fetching templates', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Network error'));

      await expect(templateApi.listTemplates()).rejects.toThrow('Network error');
    });
  });

  describe('getTemplate', () => {
    it('should fetch template by id successfully', async () => {
      const mockTemplate: ContentTemplate = {
        id: 1,
        organization_id: 1,
        content_type_id: 1,
        name: 'Blog Post Template',
        description: 'Standard blog post with hero image',
        icon: '📝',
        thumbnail_url: 'https://example.com/thumb.jpg',
        is_system_template: false,
        is_published: true,
        field_defaults: { title: '', body: '' },
        field_config: { title: { required: true } },
        category: 'content',
        tags: ['blog', 'article'],
        usage_count: 15,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        content_type: {
          id: 1,
          name: 'Blog Post',
          slug: 'blog-post',
        },
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockTemplate } as any);

      const result = await templateApi.getTemplate(1);

      expect(result).toEqual(mockTemplate);
      expect(apiClient.get).toHaveBeenCalledWith('/templates/1');
    });

    it('should handle not found error', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Template not found'));

      await expect(templateApi.getTemplate(999)).rejects.toThrow('Template not found');
    });
  });

  describe('createTemplate', () => {
    it('should create template successfully', async () => {
      const createData: ContentTemplateCreate = {
        content_type_id: 1,
        name: 'New Template',
        description: 'A new template',
        is_published: false,
        field_defaults: { title: 'Default Title' },
      };

      const mockCreatedTemplate: ContentTemplate = {
        id: 5,
        organization_id: 1,
        content_type_id: 1,
        name: 'New Template',
        description: 'A new template',
        is_system_template: false,
        is_published: false,
        field_defaults: { title: 'Default Title' },
        usage_count: 0,
        created_at: '2025-01-10T00:00:00Z',
        updated_at: '2025-01-10T00:00:00Z',
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockCreatedTemplate } as any);

      const result = await templateApi.createTemplate(createData);

      expect(result).toEqual(mockCreatedTemplate);
      expect(apiClient.post).toHaveBeenCalledWith('/templates', createData);
    });

    it('should handle duplicate template name error', async () => {
      const createData: ContentTemplateCreate = {
        content_type_id: 1,
        name: 'Existing Template',
      };

      vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Template name already exists'));

      await expect(templateApi.createTemplate(createData)).rejects.toThrow('Template name already exists');
    });

    it('should handle invalid content_type_id error', async () => {
      const createData: ContentTemplateCreate = {
        content_type_id: 999,
        name: 'Bad Template',
      };

      vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Content type not found'));

      await expect(templateApi.createTemplate(createData)).rejects.toThrow('Content type not found');
    });
  });

  describe('updateTemplate', () => {
    it('should update template successfully', async () => {
      const updateData: ContentTemplateUpdate = {
        name: 'Updated Template Name',
        description: 'Updated description',
        is_published: true,
      };

      const mockUpdatedTemplate: ContentTemplate = {
        id: 5,
        organization_id: 1,
        content_type_id: 1,
        name: 'Updated Template Name',
        description: 'Updated description',
        is_system_template: false,
        is_published: true,
        usage_count: 0,
        created_at: '2025-01-10T00:00:00Z',
        updated_at: '2025-01-11T00:00:00Z',
      };

      vi.mocked(apiClient.put).mockResolvedValueOnce({ data: mockUpdatedTemplate } as any);

      const result = await templateApi.updateTemplate(5, updateData);

      expect(result).toEqual(mockUpdatedTemplate);
      expect(apiClient.put).toHaveBeenCalledWith('/templates/5', updateData);
    });

    it('should handle system template modification error', async () => {
      const updateData: ContentTemplateUpdate = {
        name: 'Cannot Update',
      };

      vi.mocked(apiClient.put).mockRejectedValueOnce(new Error('Cannot modify system template'));

      await expect(templateApi.updateTemplate(1, updateData)).rejects.toThrow('Cannot modify system template');
    });
  });

  describe('deleteTemplate', () => {
    it('should delete template successfully', async () => {
      vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: undefined } as any);

      await templateApi.deleteTemplate(5);

      expect(apiClient.delete).toHaveBeenCalledWith('/templates/5');
    });

    it('should handle system template deletion error', async () => {
      vi.mocked(apiClient.delete).mockRejectedValueOnce(new Error('Cannot delete system template'));

      await expect(templateApi.deleteTemplate(1)).rejects.toThrow('Cannot delete system template');
    });

    it('should handle template in use error', async () => {
      vi.mocked(apiClient.delete).mockRejectedValueOnce(new Error('Template is in use'));

      await expect(templateApi.deleteTemplate(2)).rejects.toThrow('Template is in use');
    });
  });

  describe('getCategories', () => {
    it('should fetch template categories successfully', async () => {
      const mockResponse = {
        categories: ['content', 'marketing', 'product', 'documentation'],
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await templateApi.getCategories();

      expect(result).toEqual(mockResponse.categories);
      expect(apiClient.get).toHaveBeenCalledWith('/templates/categories');
    });

    it('should handle empty categories', async () => {
      const mockResponse = {
        categories: [],
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await templateApi.getCategories();

      expect(result).toEqual([]);
    });

    it('should handle error when fetching categories', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Network error'));

      await expect(templateApi.getCategories()).rejects.toThrow('Network error');
    });
  });
});
