import { apiClient } from './client';

export interface ApiScope {
  id: string;
  name: string;
  label: string;
  description?: string;
  category?: string;
  platform?: string;
  is_active: boolean;
  is_system: boolean;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface ApiScopeListResponse {
  items: ApiScope[];
  total: number;
  page: number;
  page_size: number;
}

export interface ApiScopeCreate {
  name: string;
  label: string;
  description?: string;
  category?: string;
  platform?: string;
  is_active?: boolean;
  is_system?: boolean;
}

export interface ApiScopeUpdate {
  label?: string;
  description?: string;
  category?: string;
  is_active?: boolean;
}

export const apiScopesApi = {
  /**
   * List all API scopes for the organization
   */
  list: async (params?: { platform?: string; category?: string; is_active?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.platform) queryParams.append('platform', params.platform);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.is_active !== undefined) queryParams.append('is_active', String(params.is_active));
    
    const url = `/api-scopes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<ApiScopeListResponse>(url);
    return response.data;
  },

  /**
   * Get a single API scope by ID
   */
  get: async (id: string) => {
    const response = await apiClient.get<ApiScope>(`/api-scopes/${id}`);
    return response.data;
  },

  /**
   * Create a new API scope
   */
  create: async (data: ApiScopeCreate) => {
    const response = await apiClient.post<ApiScope>('/api-scopes', data);
    return response.data;
  },

  /**
   * Update an existing API scope
   */
  update: async (id: string, data: ApiScopeUpdate) => {
    const response = await apiClient.patch<ApiScope>(`/api-scopes/${id}`, data);
    return response.data;
  },

  /**
   * Delete an API scope
   */
  delete: async (id: string) => {
    await apiClient.delete(`/api-scopes/${id}`);
  },

  /**
   * Seed standard boutique platform scopes
   */
  seedBoutique: async () => {
    const response = await apiClient.post<ApiScopeListResponse>('/api-scopes/seed-boutique');
    return response.data;
  },

  /**
   * Get scopes formatted for use in UI dropdowns (value/label pairs)
   */
  getForDropdown: async (params?: { platform?: string; category?: string }) => {
    const response = await apiScopesApi.list({ ...params, is_active: true });
    return response.items.map(scope => ({
      value: scope.name,
      label: scope.label,
      description: scope.description,
      category: scope.category,
      platform: scope.platform,
    }));
  },
};
