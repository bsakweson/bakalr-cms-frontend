import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiScopesApi, ApiScope, ApiScopeListResponse } from './api-scopes';

// Mock the apiClient
vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from './client';

describe('apiScopesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockScope: ApiScope = {
    id: 'scope-123',
    name: 'read:content',
    label: 'Read Content',
    description: 'Allows reading content entries',
    category: 'content',
    platform: 'cms',
    is_active: true,
    is_system: false,
    organization_id: 'org-123',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };

  const mockListResponse: ApiScopeListResponse = {
    items: [mockScope],
    total: 1,
    page: 1,
    page_size: 10,
  };

  describe('list', () => {
    it('should list all API scopes without filters', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockListResponse });

      const result = await apiScopesApi.list();

      expect(apiClient.get).toHaveBeenCalledWith('/api-scopes');
      expect(result).toEqual(mockListResponse);
    });

    it('should list scopes filtered by platform', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockListResponse });

      await apiScopesApi.list({ platform: 'boutique' });

      expect(apiClient.get).toHaveBeenCalledWith('/api-scopes?platform=boutique');
    });

    it('should list scopes filtered by category', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockListResponse });

      await apiScopesApi.list({ category: 'inventory' });

      expect(apiClient.get).toHaveBeenCalledWith('/api-scopes?category=inventory');
    });

    it('should list scopes filtered by is_active', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockListResponse });

      await apiScopesApi.list({ is_active: true });

      expect(apiClient.get).toHaveBeenCalledWith('/api-scopes?is_active=true');
    });

    it('should list scopes with multiple filters', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockListResponse });

      await apiScopesApi.list({ platform: 'cms', category: 'content', is_active: true });

      expect(apiClient.get).toHaveBeenCalledWith('/api-scopes?platform=cms&category=content&is_active=true');
    });
  });

  describe('get', () => {
    it('should get a single scope by ID', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockScope });

      const result = await apiScopesApi.get('scope-123');

      expect(apiClient.get).toHaveBeenCalledWith('/api-scopes/scope-123');
      expect(result).toEqual(mockScope);
    });
  });

  describe('create', () => {
    it('should create a new API scope', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: mockScope });

      const result = await apiScopesApi.create({
        name: 'read:content',
        label: 'Read Content',
        description: 'Allows reading content entries',
        category: 'content',
        platform: 'cms',
      });

      expect(apiClient.post).toHaveBeenCalledWith('/api-scopes', {
        name: 'read:content',
        label: 'Read Content',
        description: 'Allows reading content entries',
        category: 'content',
        platform: 'cms',
      });
      expect(result).toEqual(mockScope);
    });

    it('should create scope with minimal required fields', async () => {
      const minimalScope = { ...mockScope, description: undefined, category: undefined, platform: undefined };
      vi.mocked(apiClient.post).mockResolvedValue({ data: minimalScope });

      await apiScopesApi.create({
        name: 'custom:scope',
        label: 'Custom Scope',
      });

      expect(apiClient.post).toHaveBeenCalledWith('/api-scopes', {
        name: 'custom:scope',
        label: 'Custom Scope',
      });
    });
  });

  describe('update', () => {
    it('should update an existing scope', async () => {
      const updatedScope = { ...mockScope, label: 'Updated Label' };
      vi.mocked(apiClient.patch).mockResolvedValue({ data: updatedScope });

      const result = await apiScopesApi.update('scope-123', { label: 'Updated Label' });

      expect(apiClient.patch).toHaveBeenCalledWith('/api-scopes/scope-123', { label: 'Updated Label' });
      expect(result.label).toBe('Updated Label');
    });

    it('should update scope description', async () => {
      const updatedScope = { ...mockScope, description: 'New description' };
      vi.mocked(apiClient.patch).mockResolvedValue({ data: updatedScope });

      await apiScopesApi.update('scope-123', { description: 'New description' });

      expect(apiClient.patch).toHaveBeenCalledWith('/api-scopes/scope-123', { description: 'New description' });
    });

    it('should deactivate a scope', async () => {
      const deactivatedScope = { ...mockScope, is_active: false };
      vi.mocked(apiClient.patch).mockResolvedValue({ data: deactivatedScope });

      const result = await apiScopesApi.update('scope-123', { is_active: false });

      expect(result.is_active).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete an API scope', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({ data: undefined });

      await apiScopesApi.delete('scope-123');

      expect(apiClient.delete).toHaveBeenCalledWith('/api-scopes/scope-123');
    });
  });

  describe('seedBoutique', () => {
    it('should seed standard boutique platform scopes', async () => {
      const seededScopes: ApiScopeListResponse = {
        items: [mockScope, { ...mockScope, id: 'scope-456', name: 'write:content' }],
        total: 2,
        page: 1,
        page_size: 10,
      };
      vi.mocked(apiClient.post).mockResolvedValue({ data: seededScopes });

      const result = await apiScopesApi.seedBoutique();

      expect(apiClient.post).toHaveBeenCalledWith('/api-scopes/seed-boutique');
      expect(result.items.length).toBe(2);
    });
  });

  describe('getForDropdown', () => {
    it('should return scopes formatted for dropdown', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockListResponse });

      const result = await apiScopesApi.getForDropdown();

      expect(result).toEqual([
        {
          value: 'read:content',
          label: 'Read Content',
          description: 'Allows reading content entries',
          category: 'content',
          platform: 'cms',
        },
      ]);
    });

    it('should filter dropdown scopes by platform', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockListResponse });

      await apiScopesApi.getForDropdown({ platform: 'boutique' });

      expect(apiClient.get).toHaveBeenCalledWith('/api-scopes?platform=boutique&is_active=true');
    });

    it('should only return active scopes for dropdown', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockListResponse });

      await apiScopesApi.getForDropdown();

      // Should always include is_active: true for dropdown
      expect(apiClient.get).toHaveBeenCalledWith('/api-scopes?is_active=true');
    });
  });

  describe('API path consistency', () => {
    it('should use /api-scopes base path for all endpoints', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockListResponse });
      vi.mocked(apiClient.post).mockResolvedValue({ data: mockScope });
      vi.mocked(apiClient.patch).mockResolvedValue({ data: mockScope });
      vi.mocked(apiClient.delete).mockResolvedValue({ data: undefined });

      await apiScopesApi.list();
      await apiScopesApi.get('scope-123');
      await apiScopesApi.create({ name: 'test', label: 'Test' });
      await apiScopesApi.update('scope-123', { label: 'Updated' });
      await apiScopesApi.delete('scope-123');
      await apiScopesApi.seedBoutique();

      // All paths should be relative (baseURL handles /api/v1)
      expect(vi.mocked(apiClient.get).mock.calls[0][0]).toBe('/api-scopes');
      expect(vi.mocked(apiClient.get).mock.calls[1][0]).toBe('/api-scopes/scope-123');
      expect(vi.mocked(apiClient.post).mock.calls[0][0]).toBe('/api-scopes');
      expect(vi.mocked(apiClient.patch).mock.calls[0][0]).toBe('/api-scopes/scope-123');
      expect(vi.mocked(apiClient.delete).mock.calls[0][0]).toBe('/api-scopes/scope-123');
      expect(vi.mocked(apiClient.post).mock.calls[1][0]).toBe('/api-scopes/seed-boutique');
    });
  });
});
