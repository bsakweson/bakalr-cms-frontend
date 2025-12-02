import { apiClient } from './client';
import type {
  OrganizationProfile,
  OrganizationProfileUpdate,
  LocaleListResponse,
  CreateLocaleRequest,
  UpdateLocaleRequest,
  Locale,
} from '@/types';

export const organizationApi = {
  async getProfile(): Promise<OrganizationProfile> {
    const response = await apiClient.get('/organization/profile');
    return response.data;
  },

  async updateProfile(data: OrganizationProfileUpdate): Promise<OrganizationProfile> {
    const response = await apiClient.put('/organization/profile', data);
    return response.data;
  },

  async listLocales(): Promise<LocaleListResponse> {
    const response = await apiClient.get('/organization/locales');
    return response.data;
  },

  async createLocale(data: CreateLocaleRequest): Promise<Locale> {
    const response = await apiClient.post('/organization/locales', data);
    return response.data;
  },

  async updateLocale(localeId: string, data: UpdateLocaleRequest): Promise<Locale> {
    const response = await apiClient.put(`/organization/locales/${localeId}`, data);
    return response.data;
  },

  async deleteLocale(localeId: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/organization/locales/${localeId}`);
    return response.data;
  },
};
