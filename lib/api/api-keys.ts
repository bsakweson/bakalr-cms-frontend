import apiClient from './client';

export interface APIKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
  last_used_at: string | null;
  organization_id: string;
}

export interface APIKeyWithSecret extends APIKey {
  key: string;
}

export interface CreateAPIKeyRequest {
  name: string;
  scopes: string[];
  expires_at?: string | null;
}

export interface UpdateAPIKeyRequest {
  name?: string;
  scopes?: string[];
  is_active?: boolean;
}

export interface APIKeyListResponse {
  items: APIKey[];
  total: number;
  page: number;
  page_size: number;
}

export const apiKeysApi = {
  /**
   * List all API keys for the current organization
   */
  async listAPIKeys(page: number = 1, pageSize: number = 10, isActive?: boolean): Promise<APIKeyListResponse> {
    const params: any = { page, page_size: pageSize };
    if (isActive !== undefined) {
      params.is_active = isActive;
    }
    const response = await apiClient.get('/api-keys', { params });
    return response.data;
  },

  /**
   * Get a specific API key by ID
   */
  async getAPIKey(keyId: string): Promise<APIKey> {
    const response = await apiClient.get(`/api-keys/${keyId}`);
    return response.data;
  },

  /**
   * Create a new API key
   */
  async createAPIKey(data: CreateAPIKeyRequest): Promise<APIKeyWithSecret> {
    const response = await apiClient.post('/api-keys', data);
    return response.data;
  },

  /**
   * Update an existing API key
   */
  async updateAPIKey(keyId: string, data: UpdateAPIKeyRequest): Promise<APIKey> {
    const response = await apiClient.patch(`/api-keys/${keyId}`, data);
    return response.data;
  },

  /**
   * Delete an API key (revoke permanently)
   */
  async deleteAPIKey(keyId: string): Promise<void> {
    await apiClient.delete(`/api-keys/${keyId}`);
  },
};
