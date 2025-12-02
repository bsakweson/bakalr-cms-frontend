import apiClient from './client';
import { Translation, Locale } from '@/types';

export interface LocaleCreate {
  code: string;
  name: string;
  native_name?: string;
  is_default?: boolean;
  is_enabled?: boolean;
  auto_translate?: boolean;
}

export interface LocaleUpdate {
  name?: string;
  native_name?: string;
  is_default?: boolean;
  is_enabled?: boolean;
  auto_translate?: boolean;
}

export const translationApi = {
  async getLocales(enabledOnly?: boolean): Promise<Locale[]> {
    const params = enabledOnly ? { enabled_only: true } : {};
    const response = await apiClient.get<Locale[]>('/translation/locales', { params });
    return response.data;
  },

  async createLocale(data: LocaleCreate): Promise<Locale> {
    const response = await apiClient.post<Locale>('/translation/locales', data);
    return response.data;
  },

  async updateLocale(code: string, data: LocaleUpdate): Promise<Locale> {
    const response = await apiClient.put<Locale>(`/translation/locales/${code}`, data);
    return response.data;
  },

  async deleteLocale(code: string): Promise<void> {
    await apiClient.delete(`/translation/locales/${code}`);
  },

  async getContentTranslations(contentId: string): Promise<Translation[]> {
    const response = await apiClient.get<Translation[]>(`/translation/content/${contentId}`);
    return response.data;
  },

  async getTranslation(contentId: string, localeCode: string): Promise<Translation> {
    const response = await apiClient.get<Translation>(
      `/translation/content/${contentId}/${localeCode}`
    );
    return response.data;
  },

  async createOrUpdateTranslation(
    contentId: string,
    localeCode: string,
    data: Record<string, any>
  ): Promise<Translation> {
    const response = await apiClient.put<Translation>(
      `/translation/content/${contentId}/${localeCode}`,
      { translated_data: data }
    );
    return response.data;
  },

  async deleteTranslation(contentId: string, localeCode: string): Promise<void> {
    await apiClient.delete(`/translation/content/${contentId}/${localeCode}`);
  },

  async autoTranslate(contentId: string, targetLocales: string[]): Promise<{ message: string; translations: Translation[] }> {
    const response = await apiClient.post(`/translation/content/${contentId}/auto-translate`, {
      target_locales: targetLocales,
    });
    return response.data;
  },
};
