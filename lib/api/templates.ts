import { apiClient } from './client';

export interface ContentTemplate {
  id: string;
  organization_id: string;
  content_type_id: string;
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
    id: string;
    name: string;
    slug: string;
  };
}

export interface ContentTemplateCreate {
  content_type_id: string;
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
    content_type_id?: string;
    published_only?: boolean;
    category?: string;
  }): Promise<ContentTemplateListResponse> {
    const response = await apiClient.get('/templates', { params });
    return response.data;
  },

  async getTemplate(id: number): Promise<ContentTemplate> {
    const response = await apiClient.get(`/templates/${id}`);
    return response.data;
  },

  async createTemplate(data: ContentTemplateCreate): Promise<ContentTemplate> {
    const response = await apiClient.post('/templates', data);
    return response.data;
  },

  async updateTemplate(id: string, data: ContentTemplateUpdate): Promise<ContentTemplate> {
    const response = await apiClient.put(`/templates/${id}`, data);
    return response.data;
  },

  async deleteTemplate(id: string): Promise<void> {
    await apiClient.delete(`/templates/${id}`);
  },

  async getCategories(): Promise<string[]> {
    const response = await apiClient.get('/templates/categories');
    return response.data.categories;
  },
};
