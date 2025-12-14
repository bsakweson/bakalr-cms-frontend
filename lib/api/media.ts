import apiClient from './client';
import { Media, PaginatedResponse } from '@/types';

export const mediaApi = {
  async getMedia(params?: {
    page?: number;
    per_page?: number;
    file_type?: string;
    search?: string;
  }): Promise<PaginatedResponse<Media>> {
    const response = await apiClient.get<PaginatedResponse<Media>>('/media', {
      params,
    });
    return response.data;
  },

  async getMediaItem(id: string): Promise<Media> {
    const response = await apiClient.get<Media>(`/media/${id}`);
    return response.data;
  },

  async uploadMedia(formData: FormData): Promise<Media> {
    const response = await apiClient.post<Media>('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async updateMedia(id: string, data: Partial<Media>): Promise<Media> {
    const response = await apiClient.put<Media>(`/media/${id}`, data);
    return response.data;
  },

  async deleteMedia(id: string): Promise<void> {
    await apiClient.delete(`/media/${id}`);
  },
};
