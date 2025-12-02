import apiClient from './client';

export interface SearchResult {
  id: string;
  content_type_id: string;
  slug: string;
  status: string;
  content_data: Record<string, any>;
  score: number;
  highlights?: Record<string, string[]>;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  processing_time_ms: number;
}

export const searchApi = {
  async search(params: {
    q: string;
    content_type_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<SearchResponse> {
    const response = await apiClient.get<SearchResponse>('/search', {
      params,
    });
    return response.data;
  },
};
