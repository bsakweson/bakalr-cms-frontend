import { describe, it, expect, beforeEach, vi } from 'vitest';
import { organizationApi } from './organization';
import type {
  OrganizationProfile,
  OrganizationProfileUpdate,
  LocaleListResponse,
  CreateLocaleRequest,
  UpdateLocaleRequest,
  Locale,
} from '@/types';

// Mock the apiClient
vi.mock('./client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from './client';

describe('organizationApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should fetch organization profile successfully', async () => {
      const mockProfile: OrganizationProfile = {
        id: '1',
        name: 'Test Org',
        slug: 'test-org',
        email: 'contact@test.com',
        website: 'https://test.com',
        logo_url: 'https://example.com/logo.png',
        description: 'Test organization',
        is_active: true,
        plan_type: 'professional',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockProfile } as any);

      const result = await organizationApi.getProfile();

      expect(result).toEqual(mockProfile);
      expect(apiClient.get).toHaveBeenCalledWith('/organization/profile');
    });

    it('should handle error when fetching profile', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Network error'));

      await expect(organizationApi.getProfile()).rejects.toThrow('Network error');
    });
  });

  describe('updateProfile', () => {
    it('should update organization profile successfully', async () => {
      const updateData: OrganizationProfileUpdate = {
        name: 'Updated Org',
        description: 'Updated description',
      };

      const mockUpdatedProfile: OrganizationProfile = {
        id: '1',
        name: 'Updated Org',
        slug: 'test-org',
        email: 'contact@test.com',
        website: 'https://test.com',
        logo_url: 'https://example.com/logo.png',
        description: 'Updated description',
        is_active: true,
        plan_type: 'professional',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
      };

      vi.mocked(apiClient.put).mockResolvedValueOnce({ data: mockUpdatedProfile } as any);

      const result = await organizationApi.updateProfile(updateData);

      expect(result).toEqual(mockUpdatedProfile);
      expect(apiClient.put).toHaveBeenCalledWith('/organization/profile', updateData);
    });

    it('should handle validation error when updating profile', async () => {
      const updateData: OrganizationProfileUpdate = {
        name: '',
      };

      vi.mocked(apiClient.put).mockRejectedValueOnce(new Error('Validation error'));

      await expect(organizationApi.updateProfile(updateData)).rejects.toThrow('Validation error');
    });
  });

  describe('listLocales', () => {
    it('should fetch locales list successfully', async () => {
      const mockResponse: LocaleListResponse = {
        locales: [
          {
            id: '1',
            code: 'en',
            name: 'English',
            native_name: 'English',
            is_default: true,
            is_enabled: true,
            is_active: true,
            auto_translate: false,
            organization_id: "1",
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
          },
          {
            id: '2',
            code: 'es',
            name: 'Spanish',
            native_name: 'Español',
            is_default: false,
            is_enabled: true,
            is_active: true,
            auto_translate: true,
            organization_id: "1",
            created_at: '2025-01-02T00:00:00Z',
            updated_at: '2025-01-02T00:00:00Z',
          },
        ],
        total: 2,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await organizationApi.listLocales();

      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith('/organization/locales');
    });

    it('should handle error when fetching locales', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Network error'));

      await expect(organizationApi.listLocales()).rejects.toThrow('Network error');
    });
  });

  describe('createLocale', () => {
    it('should create locale successfully', async () => {
      const createData: CreateLocaleRequest = {
        code: 'fr',
        name: 'French',
        is_active: true,
      };

      const mockCreatedLocale: Locale = {
        id: '3',
        code: 'fr',
        name: 'French',
        native_name: 'Français',
        is_default: false,
        is_enabled: true,
        is_active: true,
        auto_translate: false,
        organization_id: "1",
        created_at: '2025-01-03T00:00:00Z',
        updated_at: '2025-01-03T00:00:00Z',
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockCreatedLocale } as any);

      const result = await organizationApi.createLocale(createData);

      expect(result).toEqual(mockCreatedLocale);
      expect(apiClient.post).toHaveBeenCalledWith('/organization/locales', createData);
    });

    it('should handle duplicate locale error', async () => {
      const createData: CreateLocaleRequest = {
        code: 'en',
        name: 'English',
      };

      vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Locale already exists'));

      await expect(organizationApi.createLocale(createData)).rejects.toThrow('Locale already exists');
    });
  });

  describe('updateLocale', () => {
    it('should update locale successfully', async () => {
      const updateData: UpdateLocaleRequest = {
        name: 'French (France)',
        is_active: false,
      };

      const mockUpdatedLocale: Locale = {
        id: '3',
        code: 'fr',
        name: 'French (France)',
        native_name: 'Français',
        is_default: false,
        is_enabled: false,
        is_active: false,
        auto_translate: false,
        organization_id: "1",
        created_at: '2025-01-03T00:00:00Z',
        updated_at: '2025-01-04T00:00:00Z',
      };

      vi.mocked(apiClient.put).mockResolvedValueOnce({ data: mockUpdatedLocale } as any);

      const result = await organizationApi.updateLocale("3", updateData);

      expect(result).toEqual(mockUpdatedLocale);
      expect(apiClient.put).toHaveBeenCalledWith('/organization/locales/3', updateData);
    });

    it('should handle not found error when updating locale', async () => {
      const updateData: UpdateLocaleRequest = {
        name: 'Updated',
      };

      vi.mocked(apiClient.put).mockRejectedValueOnce(new Error('Locale not found'));

      await expect(organizationApi.updateLocale("999", updateData)).rejects.toThrow('Locale not found');
    });
  });

  describe('deleteLocale', () => {
    it('should delete locale successfully', async () => {
      const mockResponse = { message: 'Locale deleted successfully' };

      vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await organizationApi.deleteLocale("3");

      expect(result).toEqual(mockResponse);
      expect(apiClient.delete).toHaveBeenCalledWith('/organization/locales/3');
    });

    it('should handle error when deleting default locale', async () => {
      vi.mocked(apiClient.delete).mockRejectedValueOnce(new Error('Cannot delete default locale'));

      await expect(organizationApi.deleteLocale("1")).rejects.toThrow('Cannot delete default locale');
    });

    it('should handle not found error when deleting locale', async () => {
      vi.mocked(apiClient.delete).mockRejectedValueOnce(new Error('Locale not found'));

      await expect(organizationApi.deleteLocale("999")).rejects.toThrow('Locale not found');
    });
  });
});
