import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiKeysApi, APIKey, APIKeyWithSecret, APIKeyListResponse } from './api-keys';

// Mock the apiClient
vi.mock('./client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import apiClient from './client';

describe('apiKeysApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockApiKey: APIKey = {
    id: 'key-123',
    name: 'Test API Key',
    key_prefix: 'bak_test_',
    scopes: ['read:content', 'write:content'],
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    expires_at: '2026-01-01T00:00:00Z',
    last_used_at: null,
    organization_id: 'org-123',
  };

  const mockApiKeyWithSecret: APIKeyWithSecret = {
    ...mockApiKey,
    key: 'bak_test_abc123xyz789',
  };

  describe('listAPIKeys', () => {
    it('should list API keys with default pagination', async () => {
      const mockResponse: APIKeyListResponse = {
        items: [mockApiKey],
        total: 1,
        page: 1,
        page_size: 10,
      };
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockResponse });

      const result = await apiKeysApi.listAPIKeys();

      expect(apiClient.get).toHaveBeenCalledWith('/api-keys', {
        params: { page: 1, page_size: 10 },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should list API keys with custom pagination', async () => {
      const mockResponse: APIKeyListResponse = {
        items: [mockApiKey],
        total: 50,
        page: 3,
        page_size: 20,
      };
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockResponse });

      const result = await apiKeysApi.listAPIKeys(3, 20);

      expect(apiClient.get).toHaveBeenCalledWith('/api-keys', {
        params: { page: 3, page_size: 20 },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should filter by isActive status', async () => {
      const mockResponse: APIKeyListResponse = {
        items: [mockApiKey],
        total: 1,
        page: 1,
        page_size: 10,
      };
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockResponse });

      await apiKeysApi.listAPIKeys(1, 10, true);

      expect(apiClient.get).toHaveBeenCalledWith('/api-keys', {
        params: { page: 1, page_size: 10, is_active: true },
      });
    });

    it('should filter by inactive status', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: { items: [], total: 0, page: 1, page_size: 10 } });

      await apiKeysApi.listAPIKeys(1, 10, false);

      expect(apiClient.get).toHaveBeenCalledWith('/api-keys', {
        params: { page: 1, page_size: 10, is_active: false },
      });
    });
  });

  describe('getAPIKey', () => {
    it('should get a specific API key by ID', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockApiKey });

      const result = await apiKeysApi.getAPIKey('key-123');

      expect(apiClient.get).toHaveBeenCalledWith('/api-keys/key-123');
      expect(result).toEqual(mockApiKey);
    });
  });

  describe('createAPIKey', () => {
    it('should create a new API key and return with secret', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: mockApiKeyWithSecret });

      const result = await apiKeysApi.createAPIKey({
        name: 'Test API Key',
        scopes: ['read:content', 'write:content'],
        expires_at: '2026-01-01T00:00:00Z',
      });

      expect(apiClient.post).toHaveBeenCalledWith('/api-keys', {
        name: 'Test API Key',
        scopes: ['read:content', 'write:content'],
        expires_at: '2026-01-01T00:00:00Z',
      });
      expect(result).toEqual(mockApiKeyWithSecret);
      expect(result.key).toBe('bak_test_abc123xyz789');
    });

    it('should create API key without expiration', async () => {
      const keyWithNoExpiry = { ...mockApiKeyWithSecret, expires_at: null };
      vi.mocked(apiClient.post).mockResolvedValue({ data: keyWithNoExpiry });

      const result = await apiKeysApi.createAPIKey({
        name: 'Permanent Key',
        scopes: ['read:content'],
      });

      expect(apiClient.post).toHaveBeenCalledWith('/api-keys', {
        name: 'Permanent Key',
        scopes: ['read:content'],
      });
      expect(result.expires_at).toBeNull();
    });
  });

  describe('updateAPIKey', () => {
    it('should update API key name', async () => {
      const updatedKey = { ...mockApiKey, name: 'Updated Name' };
      vi.mocked(apiClient.patch).mockResolvedValue({ data: updatedKey });

      const result = await apiKeysApi.updateAPIKey('key-123', { name: 'Updated Name' });

      expect(apiClient.patch).toHaveBeenCalledWith('/api-keys/key-123', { name: 'Updated Name' });
      expect(result.name).toBe('Updated Name');
    });

    it('should update API key scopes', async () => {
      const updatedKey = { ...mockApiKey, scopes: ['read:content'] };
      vi.mocked(apiClient.patch).mockResolvedValue({ data: updatedKey });

      const result = await apiKeysApi.updateAPIKey('key-123', { scopes: ['read:content'] });

      expect(apiClient.patch).toHaveBeenCalledWith('/api-keys/key-123', { scopes: ['read:content'] });
      expect(result.scopes).toEqual(['read:content']);
    });

    it('should deactivate API key', async () => {
      const deactivatedKey = { ...mockApiKey, is_active: false };
      vi.mocked(apiClient.patch).mockResolvedValue({ data: deactivatedKey });

      const result = await apiKeysApi.updateAPIKey('key-123', { is_active: false });

      expect(apiClient.patch).toHaveBeenCalledWith('/api-keys/key-123', { is_active: false });
      expect(result.is_active).toBe(false);
    });
  });

  describe('deleteAPIKey', () => {
    it('should delete an API key', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({ data: undefined });

      await apiKeysApi.deleteAPIKey('key-123');

      expect(apiClient.delete).toHaveBeenCalledWith('/api-keys/key-123');
    });
  });

  describe('API path consistency', () => {
    it('should use /api-keys base path for all endpoints', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: { items: [], total: 0, page: 1, page_size: 10 } });
      vi.mocked(apiClient.post).mockResolvedValue({ data: mockApiKeyWithSecret });
      vi.mocked(apiClient.patch).mockResolvedValue({ data: mockApiKey });
      vi.mocked(apiClient.delete).mockResolvedValue({ data: undefined });

      await apiKeysApi.listAPIKeys();
      await apiKeysApi.getAPIKey('key-123');
      await apiKeysApi.createAPIKey({ name: 'Test', scopes: [] });
      await apiKeysApi.updateAPIKey('key-123', { name: 'Updated' });
      await apiKeysApi.deleteAPIKey('key-123');

      // All paths should be relative (baseURL handles /api/v1)
      expect(vi.mocked(apiClient.get).mock.calls[0][0]).toBe('/api-keys');
      expect(vi.mocked(apiClient.get).mock.calls[1][0]).toBe('/api-keys/key-123');
      expect(vi.mocked(apiClient.post).mock.calls[0][0]).toBe('/api-keys');
      expect(vi.mocked(apiClient.patch).mock.calls[0][0]).toBe('/api-keys/key-123');
      expect(vi.mocked(apiClient.delete).mock.calls[0][0]).toBe('/api-keys/key-123');
    });
  });
});
