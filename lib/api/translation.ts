import apiClient from './client';
import { Translation, Locale } from '@/types';

export const translationApi = {
  async getLocales(): Promise<Locale[]> {
    const response = await apiClient.get<Locale[]>('/api/v1/translation/locales');
    return response.data;
  },

  async getContentTranslations(contentId: number): Promise<Translation[]> {
    const response = await apiClient.get<Translation[]>(`/api/v1/translation/content/${contentId}`);
    return response.data;
  },

  async getTranslation(contentId: number, localeCode: string): Promise<Translation> {
    const response = await apiClient.get<Translation>(
      `/api/v1/translation/content/${contentId}/${localeCode}`
    );
    return response.data;
  },

  async createOrUpdateTranslation(
    contentId: number,
    localeCode: string,
    data: Record<string, any>
  ): Promise<Translation> {
    const response = await apiClient.put<Translation>(
      `/api/v1/translation/content/${contentId}/${localeCode}`,
      { translated_data: data }
    );
    return response.data;
  },

  async deleteTranslation(contentId: number, localeCode: string): Promise<void> {
    await apiClient.delete(`/api/v1/translation/content/${contentId}/${localeCode}`);
  },
};
