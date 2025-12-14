import { describe, it, expect, beforeEach, vi } from 'vitest';
import { tenantApi } from './tenant';
import { apiClient } from './client';
import type {
  UserOrganizationsResponse,
  SwitchOrganizationRequest,
  SwitchOrganizationResponse,
} from '@/types';

vi.mock('./client');

describe('tenantApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listOrganizations', () => {
    it('should fetch user organizations successfully', async () => {
      const mockResponse: UserOrganizationsResponse = {
        organizations: [
          {
            organization_id: "1",
            organization_name: 'Acme Corp',
            organization_slug: 'acme-corp',
            is_default: true,
            is_active: true,
            roles: ['Admin'],
            joined_at: '2025-01-01T00:00:00Z',
          },
          {
            organization_id: "2",
            organization_name: 'Beta Inc',
            organization_slug: 'beta-inc',
            is_default: false,
            is_active: true,
            roles: ['Editor'],
            joined_at: '2025-01-15T00:00:00Z',
          },
          {
            organization_id: "3",
            organization_name: 'Gamma LLC',
            organization_slug: 'gamma-llc',
            is_default: false,
            is_active: true,
            roles: ['Viewer'],
            joined_at: '2025-02-01T00:00:00Z',
          },
        ],
        current_organization_id: "1",
        total: 3,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await tenantApi.listOrganizations();

      expect(result).toEqual(mockResponse);
      expect(result.organizations).toHaveLength(3);
      expect(result.current_organization_id).toBe(1);
      expect(apiClient.get).toHaveBeenCalledWith('/tenant/organizations');
    });

    it('should handle single organization', async () => {
      const mockResponse: UserOrganizationsResponse = {
        organizations: [
          {
            organization_id: "1",
            organization_name: 'Solo Org',
            organization_slug: 'solo-org',
            is_default: true,
            is_active: true,
            roles: ['Owner'],
            joined_at: '2025-01-01T00:00:00Z',
          },
        ],
        current_organization_id: "1",
        total: 1,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await tenantApi.listOrganizations();

      expect(result).toEqual(mockResponse);
      expect(result.organizations).toHaveLength(1);
    });

    it('should handle empty organizations list', async () => {
      const mockResponse: UserOrganizationsResponse = {
        organizations: [],
        current_organization_id: "0",
        total: 0,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await tenantApi.listOrganizations();

      expect(result).toEqual(mockResponse);
      expect(result.organizations).toHaveLength(0);
    });

    it('should handle error when fetching organizations', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Network error'));

      await expect(tenantApi.listOrganizations()).rejects.toThrow('Network error');
    });
  });

  describe('switchOrganization', () => {
    it('should switch organization successfully', async () => {
      const switchData: SwitchOrganizationRequest = {
        organization_id: "2",
      };

      const mockResponse: SwitchOrganizationResponse = {
        message: 'Organization switched successfully',
        organization_id: "2",
        organization_name: 'Beta Inc',
        access_token: 'new-jwt-token-here',
        refresh_token: 'new-refresh-token-here',
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await tenantApi.switchOrganization(switchData);

      expect(result).toEqual(mockResponse);
      expect(result.organization_id).toBe(2);
      expect(result.access_token).toBeDefined();
      expect(apiClient.post).toHaveBeenCalledWith('/tenant/switch', switchData);
    });

    it('should handle switching to same organization', async () => {
      const switchData: SwitchOrganizationRequest = {
        organization_id: "1",
      };

      const mockResponse: SwitchOrganizationResponse = {
        message: 'Already in this organization',
        organization_id: "1",
        organization_name: 'Acme Corp',
        access_token: 'same-token',
        refresh_token: 'same-refresh-token',
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await tenantApi.switchOrganization(switchData);

      expect(result).toEqual(mockResponse);
      expect(result.organization_id).toBe(1);
    });

    it('should handle unauthorized organization access', async () => {
      const switchData: SwitchOrganizationRequest = {
        organization_id: "999",
      };

      vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Not authorized to access this organization'));

      await expect(tenantApi.switchOrganization(switchData)).rejects.toThrow('Not authorized to access this organization');
    });

    it('should handle non-existent organization', async () => {
      const switchData: SwitchOrganizationRequest = {
        organization_id: "888",
      };

      vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Organization not found'));

      await expect(tenantApi.switchOrganization(switchData)).rejects.toThrow('Organization not found');
    });

    it('should handle network error during switch', async () => {
      const switchData: SwitchOrganizationRequest = {
        organization_id: "2",
      };

      vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Network error'));

      await expect(tenantApi.switchOrganization(switchData)).rejects.toThrow('Network error');
    });
  });
});
