import { apiClient } from './client';

export interface ContentTemplate {
  id: number;
  organization_id: number;
  content_type_id: number;
  name: string;
  description?: string;
  icon?: string;
  thumbnail_url?: string;
  is_system_template: boolean;
  is_published: boolean;
  field_defaults?: Record<string, any>;
  field_config?: Record<string, any>;
  content_structure?: Record<string, any>;
  category?: string;
  tags?: string[];
  usage_count: number;
  created_at: string;
  updated_at: string;
  content_type?: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface ContentTemplateCreate {
  content_type_id: number;
  name: string;
  description?: string;
  icon?: string;
  thumbnail_url?: string;
  is_published?: boolean;
  field_defaults?: Record<string, any>;
  field_config?: Record<string, any>;
  content_structure?: Record<string, any>;
  category?: string;
  tags?: string[];
}

export interface ContentTemplateUpdate {
  name?: string;
  description?: string;
  icon?: string;
  thumbnail_url?: string;
  is_published?: boolean;
  field_defaults?: Record<string, any>;
  field_config?: Record<string, any>;
  content_structure?: Record<string, any>;
  category?: string;
  tags?: string[];
}

export interface ContentTemplateListResponse {
  templates: ContentTemplate[];
  total: number;
  page: number;
  page_size: number;
}

export const templateApi = {
  async listTemplates(params?: {
    page?: number;
    page_size?: number;
    content_type_id?: number;
    published_only?: boolean;
    category?: string;
  }): Promise<ContentTemplateListResponse> {
    const response = await apiClient.get('/api/v1/templates', { params });
    return response.data;
  },

  async getTemplate(id: number): Promise<ContentTemplate> {
    const response = await apiClient.get(`/api/v1/templates/${id}`);
    return response.data;
  },

  async createTemplate(data: ContentTemplateCreate): Promise<ContentTemplate> {
    const response = await apiClient.post('/api/v1/templates', data);
    return response.data;
  },

  async updateTemplate(id: number, data: ContentTemplateUpdate): Promise<ContentTemplate> {
    const response = await apiClient.put(`/api/v1/templates/${id}`, data);
    return response.data;
  },

  async deleteTemplate(id: number): Promise<void> {
    await apiClient.delete(`/api/v1/templates/${id}`);
  },

  async getCategories(): Promise<string[]> {
    const response = await apiClient.get('/api/v1/templates/categories');
    return response.data.categories;
  },
};
