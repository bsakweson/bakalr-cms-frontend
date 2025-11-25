import apiClient from './client';
import { Media, PaginatedResponse } from '@/types';

export const mediaApi = {
  async getMedia(params?: {
    page?: number;
    per_page?: number;
    file_type?: string;
    search?: string;
  }): Promise<PaginatedResponse<Media>> {
    const response = await apiClient.get<PaginatedResponse<Media>>('/api/v1/media', {
      params,
    });
    return response.data;
  },

  async getMediaItem(id: number): Promise<Media> {
    const response = await apiClient.get<Media>(`/api/v1/media/${id}`);
    return response.data;
  },

  async uploadMedia(formData: FormData): Promise<Media> {
    const response = await apiClient.post<Media>('/api/v1/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async updateMedia(id: number, data: Partial<Media>): Promise<Media> {
    const response = await apiClient.put<Media>(`/api/v1/media/${id}`, data);
    return response.data;
  },

  async deleteMedia(id: number): Promise<void> {
    await apiClient.delete(`/api/v1/media/${id}`);
  },
};
