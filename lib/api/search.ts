import apiClient from './client';

// Backend response interfaces (what the API actually returns)
export interface SearchHit {
  id: string;
  title: string;
  slug: string;
  content_data: string | null;
  status: string;
  content_type_id: string;
  content_type_name: string;
  content_type_slug: string;
  author_id: string;
  author_name: string;
  created_at: string | null;
  updated_at: string | null;
  published_at: string | null;
  _formatted?: Record<string, any>;
}

interface BackendSearchResponse {
  hits: SearchHit[];
  query: string;
  total_hits: number;
  limit: number;
  offset: number;
  processing_time_ms: number;
  facet_distribution?: Record<string, Record<string, number>>;
}

// Frontend-friendly interfaces (what components expect)
export interface SearchResult {
  id: string;
  content_type_id: string;
  slug: string;
  status: string;
  content_data: Record<string, any>;
  title?: string;
  content_type_name?: string;
  created_at?: string;
  updated_at?: string;
  score?: number;
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
    // Map 'q' to 'query' which is what the backend expects for GET requests
    const backendParams: Record<string, any> = {
      query: params.q,
      limit: params.limit,
      offset: params.offset,
    };
    
    if (params.content_type_id) {
      backendParams.content_type_id = params.content_type_id;
    }
    if (params.status) {
      backendParams.status = params.status;
    }

    const response = await apiClient.get<BackendSearchResponse>('/search', {
      params: backendParams,
    });
    
    // Transform backend response to frontend-friendly format
    const backendData = response.data;
    return {
      results: backendData.hits.map(hit => {
        // content_data from Meilisearch is a flattened string, not JSON
        // We'll just pass it as-is or as an empty object
        let contentData: Record<string, any> = {};
        if (hit.content_data) {
          // Try to parse if it looks like JSON, otherwise use title as fallback
          if (typeof hit.content_data === 'string' && hit.content_data.startsWith('{')) {
            try {
              contentData = JSON.parse(hit.content_data);
            } catch {
              // Not valid JSON, use title/name from the hit
              contentData = { title: hit.title, name: hit.title };
            }
          } else if (typeof hit.content_data === 'object') {
            contentData = hit.content_data;
          } else {
            // Flattened string from Meilisearch - use title
            contentData = { title: hit.title, name: hit.title };
          }
        }
        
        return {
          id: hit.id,
          content_type_id: hit.content_type_id,
          slug: hit.slug,
          status: hit.status,
          content_data: contentData,
          title: hit.title,
          content_type_name: hit.content_type_name,
          created_at: hit.created_at || undefined,
          updated_at: hit.updated_at || undefined,
          highlights: hit._formatted ? { title: [hit._formatted.title] } : undefined,
        };
      }),
      total: backendData.total_hits,
      query: backendData.query,
      processing_time_ms: backendData.processing_time_ms,
    };
  },
};
