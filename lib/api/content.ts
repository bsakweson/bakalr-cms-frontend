import apiClient from './client';
import { ContentType, ContentEntry, PaginatedResponse } from '@/types';

export const contentApi = {
  // Content Types
  async getContentTypes(): Promise<ContentType[]> {
    const response = await apiClient.get<ContentType[]>('/content/types');
    return response.data;
  },

  async getContentType(id: number): Promise<ContentType> {
    const response = await apiClient.get<ContentType>(`/content/types/${id}`);
    return response.data;
  },

  async createContentType(data: Partial<ContentType>): Promise<ContentType> {
    const response = await apiClient.post<ContentType>('/content/types', data);
    return response.data;
  },

  async updateContentType(id: number, data: Partial<ContentType>): Promise<ContentType> {
    const response = await apiClient.put<ContentType>(`/content/types/${id}`, data);
    return response.data;
  },

  async deleteContentType(id: number): Promise<void> {
    await apiClient.delete(`/content/types/${id}`);
  },

  // Content Entries
  async getContentEntries(params?: {
    page?: number;
    per_page?: number;
    content_type_id?: number;
    status?: string;
  }): Promise<PaginatedResponse<ContentEntry>> {
    const response = await apiClient.get<PaginatedResponse<ContentEntry>>('/content/entries', {
      params,
    });
    return response.data;
  },

  async getContentEntry(id: number): Promise<ContentEntry> {
    const response = await apiClient.get<ContentEntry>(`/content/entries/${id}`);
    return response.data;
  },

  async createContentEntry(data: Partial<ContentEntry>): Promise<ContentEntry> {
    const response = await apiClient.post<ContentEntry>('/content/entries', data);
    return response.data;
  },

  async updateContentEntry(id: number, data: Partial<ContentEntry>): Promise<ContentEntry> {
    const response = await apiClient.put<ContentEntry>(`/content/entries/${id}`, data);
    return response.data;
  },

  async deleteContentEntry(id: number): Promise<void> {
    await apiClient.delete(`/content/entries/${id}`);
  },

  async publishContentEntry(id: number): Promise<ContentEntry> {
    const response = await apiClient.post<ContentEntry>(`/content/entries/${id}/publish`);
    return response.data;
  },

  async unpublishContentEntry(id: number): Promise<ContentEntry> {
    const response = await apiClient.post<ContentEntry>(`/content/entries/${id}/unpublish`);
    return response.data;
  },
};
