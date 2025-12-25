import apiClient from './client';
import { Media, PaginatedResponse } from '@/types';
import { PageRequest, DEFAULT_PAGE_SIZE } from '@/lib/pagination';

export interface MediaListParams extends PageRequest {
  file_type?: string;
  search?: string;
}

export const mediaApi = {
  /**
   * Get paginated list of media files.
   *
   * @param params - Pagination and filter parameters
   * @returns Paginated response with media items
   */
  async getMedia(params?: MediaListParams): Promise<PaginatedResponse<Media>> {
    // Convert to backend expected format (backend uses 'size' not 'page_size')
    const apiParams: Record<string, any> = {
      page: params?.page ?? 1,
      size: params?.page_size ?? DEFAULT_PAGE_SIZE,
    };

    if (params?.file_type) {
      apiParams.file_type = params.file_type;
    }
    if (params?.search) {
      apiParams.search = params.search;
    }

    const response = await apiClient.get<PaginatedResponse<Media>>('/media', {
      params: apiParams,
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
