import { describe, it, expect, beforeEach, vi } from 'vitest';
import { translationApi, type LocaleCreate, type LocaleUpdate } from './translation';
import apiClient from './client';
import { Translation, Locale } from '@/types';

vi.mock('./client');

describe('translationApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLocales', () => {
    it('should fetch all locales', async () => {
      const mockLocales: Locale[] = [
        {
          id: 1,
          code: 'en',
          name: 'English',
          native_name: 'English',
          is_default: true,
          is_enabled: true,
          is_active: true,
          auto_translate: false,
          organization_id: 1,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
        {
          id: 2,
          code: 'es',
          name: 'Spanish',
          native_name: 'Español',
          is_default: false,
          is_enabled: true,
          is_active: true,
          auto_translate: true,
          organization_id: 1,
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockLocales } as any);

      const result = await translationApi.getLocales();

      expect(result).toEqual(mockLocales);
      expect(apiClient.get).toHaveBeenCalledWith('/translation/locales', { params: {} });
    });

    it('should fetch only enabled locales', async () => {
      const mockLocales: Locale[] = [
        {
          id: 1,
          code: 'en',
          name: 'English',
          is_default: true,
          is_enabled: true,
          is_active: true,
          auto_translate: false,
          organization_id: 1,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockLocales } as any);

      const result = await translationApi.getLocales(true);

      expect(result).toEqual(mockLocales);
      expect(apiClient.get).toHaveBeenCalledWith('/translation/locales', {
        params: { enabled_only: true },
      });
    });

    it('should handle error when fetching locales', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Network error'));

      await expect(translationApi.getLocales()).rejects.toThrow('Network error');
    });
  });

  describe('createLocale', () => {
    it('should create locale successfully', async () => {
      const createData: LocaleCreate = {
        code: 'fr',
        name: 'French',
        native_name: 'Français',
        is_enabled: true,
        auto_translate: true,
      };

      const mockCreatedLocale: Locale = {
        id: 3,
        code: 'fr',
        name: 'French',
        native_name: 'Français',
        is_default: false,
        is_enabled: true,
        is_active: true,
        auto_translate: true,
        organization_id: 1,
        created_at: '2025-01-03T00:00:00Z',
        updated_at: '2025-01-03T00:00:00Z',
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockCreatedLocale } as any);

      const result = await translationApi.createLocale(createData);

      expect(result).toEqual(mockCreatedLocale);
      expect(apiClient.post).toHaveBeenCalledWith('/translation/locales', createData);
    });

    it('should handle duplicate locale code error', async () => {
      const createData: LocaleCreate = {
        code: 'en',
        name: 'English',
      };

      vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Locale code already exists'));

      await expect(translationApi.createLocale(createData)).rejects.toThrow('Locale code already exists');
    });

    it('should handle invalid locale code error', async () => {
      const createData: LocaleCreate = {
        code: 'invalid',
        name: 'Invalid',
      };

      vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Invalid locale code'));

      await expect(translationApi.createLocale(createData)).rejects.toThrow('Invalid locale code');
    });
  });

  describe('updateLocale', () => {
    it('should update locale successfully', async () => {
      const updateData: LocaleUpdate = {
        name: 'French (France)',
        native_name: 'Français (France)',
        auto_translate: false,
      };

      const mockUpdatedLocale: Locale = {
        id: 3,
        code: 'fr',
        name: 'French (France)',
        native_name: 'Français (France)',
        is_default: false,
        is_enabled: true,
        is_active: true,
        auto_translate: false,
        organization_id: 1,
        created_at: '2025-01-03T00:00:00Z',
        updated_at: '2025-01-04T00:00:00Z',
      };

      vi.mocked(apiClient.put).mockResolvedValueOnce({ data: mockUpdatedLocale } as any);

      const result = await translationApi.updateLocale('fr', updateData);

      expect(result).toEqual(mockUpdatedLocale);
      expect(apiClient.put).toHaveBeenCalledWith('/translation/locales/fr', updateData);
    });

    it('should handle default locale modification error', async () => {
      const updateData: LocaleUpdate = {
        is_default: false,
      };

      vi.mocked(apiClient.put).mockRejectedValueOnce(new Error('Cannot modify default locale status'));

      await expect(translationApi.updateLocale('en', updateData)).rejects.toThrow('Cannot modify default locale status');
    });

    it('should handle locale not found error', async () => {
      const updateData: LocaleUpdate = {
        name: 'Updated',
      };

      vi.mocked(apiClient.put).mockRejectedValueOnce(new Error('Locale not found'));

      await expect(translationApi.updateLocale('xx', updateData)).rejects.toThrow('Locale not found');
    });
  });

  describe('deleteLocale', () => {
    it('should delete locale successfully', async () => {
      vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: undefined } as any);

      await translationApi.deleteLocale('fr');

      expect(apiClient.delete).toHaveBeenCalledWith('/translation/locales/fr');
    });

    it('should handle default locale deletion error', async () => {
      vi.mocked(apiClient.delete).mockRejectedValueOnce(new Error('Cannot delete default locale'));

      await expect(translationApi.deleteLocale('en')).rejects.toThrow('Cannot delete default locale');
    });

    it('should handle locale with translations deletion error', async () => {
      vi.mocked(apiClient.delete).mockRejectedValueOnce(new Error('Cannot delete locale with existing translations'));

      await expect(translationApi.deleteLocale('es')).rejects.toThrow('Cannot delete locale with existing translations');
    });
  });

  describe('getContentTranslations', () => {
    it('should fetch all translations for content', async () => {
      const mockTranslations: Translation[] = [
        {
          id: 1,
          content_entry_id: 10,
          locale_id: 2,
          translated_data: { title: 'Título', body: 'Contenido' },
          status: 'completed',
          is_manual: false,
          version: 1,
          created_at: '2025-01-05T00:00:00Z',
          updated_at: '2025-01-05T00:00:00Z',
        },
        {
          id: 2,
          content_entry_id: 10,
          locale_id: 3,
          translated_data: { title: 'Titre', body: 'Contenu' },
          status: 'pending',
          is_manual: false,
          version: 1,
          created_at: '2025-01-06T00:00:00Z',
          updated_at: '2025-01-06T00:00:00Z',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockTranslations } as any);

      const result = await translationApi.getContentTranslations(10);

      expect(result).toEqual(mockTranslations);
      expect(apiClient.get).toHaveBeenCalledWith('/translation/content/10');
    });

    it('should handle content with no translations', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] } as any);

      const result = await translationApi.getContentTranslations(99);

      expect(result).toEqual([]);
    });

    it('should handle content not found error', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Content not found'));

      await expect(translationApi.getContentTranslations(999)).rejects.toThrow('Content not found');
    });
  });

  describe('getTranslation', () => {
    it('should fetch specific translation', async () => {
      const mockTranslation: Translation = {
        id: 1,
        content_entry_id: 10,
        locale_id: 2,
        translated_data: { title: 'Título Español', body: 'Contenido completo' },
        status: 'completed',
        is_manual: false,
        version: 1,
        created_at: '2025-01-05T00:00:00Z',
        updated_at: '2025-01-05T00:00:00Z',
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockTranslation } as any);

      const result = await translationApi.getTranslation(10, 'es');

      expect(result).toEqual(mockTranslation);
      expect(apiClient.get).toHaveBeenCalledWith('/translation/content/10/es');
    });

    it('should handle translation not found error', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Translation not found'));

      await expect(translationApi.getTranslation(10, 'de')).rejects.toThrow('Translation not found');
    });
  });

  describe('createOrUpdateTranslation', () => {
    it('should create or update translation successfully', async () => {
      const translationData = {
        title: 'Nouveau Titre',
        body: 'Nouveau contenu',
      };

      const mockTranslation: Translation = {
        id: 3,
        content_entry_id: 10,
        locale_id: 3,
        translated_data: translationData,
        status: 'pending',
        is_manual: true,
        version: 1,
        created_at: '2025-01-07T00:00:00Z',
        updated_at: '2025-01-07T00:00:00Z',
      };

      vi.mocked(apiClient.put).mockResolvedValueOnce({ data: mockTranslation } as any);

      const result = await translationApi.createOrUpdateTranslation(10, 'fr', translationData);

      expect(result).toEqual(mockTranslation);
      expect(apiClient.put).toHaveBeenCalledWith('/translation/content/10/fr', {
        translated_data: translationData,
      });
    });

    it('should handle invalid locale code error', async () => {
      vi.mocked(apiClient.put).mockRejectedValueOnce(new Error('Locale not enabled'));

      await expect(
        translationApi.createOrUpdateTranslation(10, 'xx', { title: 'Test' })
      ).rejects.toThrow('Locale not enabled');
    });

    it('should handle validation error', async () => {
      vi.mocked(apiClient.put).mockRejectedValueOnce(new Error('Translation data validation failed'));

      await expect(
        translationApi.createOrUpdateTranslation(10, 'es', {})
      ).rejects.toThrow('Translation data validation failed');
    });
  });

  describe('deleteTranslation', () => {
    it('should delete translation successfully', async () => {
      vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: undefined } as any);

      await translationApi.deleteTranslation(10, 'fr');

      expect(apiClient.delete).toHaveBeenCalledWith('/translation/content/10/fr');
    });

    it('should handle translation not found error', async () => {
      vi.mocked(apiClient.delete).mockRejectedValueOnce(new Error('Translation not found'));

      await expect(translationApi.deleteTranslation(10, 'de')).rejects.toThrow('Translation not found');
    });

    it('should handle default locale translation deletion error', async () => {
      vi.mocked(apiClient.delete).mockRejectedValueOnce(new Error('Cannot delete default locale translation'));

      await expect(translationApi.deleteTranslation(10, 'en')).rejects.toThrow('Cannot delete default locale translation');
    });
  });

  describe('autoTranslate', () => {
    it('should auto-translate to multiple locales successfully', async () => {
      const mockResponse = {
        message: 'Auto-translation completed',
        translations: [
          {
            id: 4,
            content_entry_id: 10,
            locale_id: 4,
            translated_data: { title: 'Deutscher Titel', body: 'Deutscher Inhalt' },
            status: 'completed' as const,
            is_manual: false,
            version: 1,
            created_at: '2025-01-08T00:00:00Z',
            updated_at: '2025-01-08T00:00:00Z',
          },
          {
            id: 5,
            content_entry_id: 10,
            locale_id: 5,
            translated_data: { title: 'Titolo italiano', body: 'Contenuto italiano' },
            status: 'completed' as const,
            is_manual: false,
            version: 1,
            created_at: '2025-01-08T00:00:00Z',
            updated_at: '2025-01-08T00:00:00Z',
          },
        ] as Translation[],
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await translationApi.autoTranslate(10, ['de', 'it']);

      expect(result).toEqual(mockResponse);
      expect(result.translations).toHaveLength(2);
      expect(apiClient.post).toHaveBeenCalledWith('/translation/content/10/auto-translate', {
        target_locales: ['de', 'it'],
      });
    });

    it('should handle auto-translate with disabled locale error', async () => {
      vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Auto-translate not enabled for locale'));

      await expect(translationApi.autoTranslate(10, ['xx'])).rejects.toThrow('Auto-translate not enabled for locale');
    });

    it('should handle auto-translate service unavailable error', async () => {
      vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Translation service unavailable'));

      await expect(translationApi.autoTranslate(10, ['es', 'fr'])).rejects.toThrow('Translation service unavailable');
    });

    it('should handle content not found error', async () => {
      vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Content not found'));

      await expect(translationApi.autoTranslate(999, ['es'])).rejects.toThrow('Content not found');
    });
  });
});
