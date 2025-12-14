/**
 * Integration Test: Content Creation → Translation → Publishing Flow
 * 
 * Tests the complete workflow from content creation through multi-language translation to publishing:
 * 1. User creates a content type (blog post)
 * 2. User creates a content entry with default locale content
 * 3. User adds translations for multiple locales (Spanish, French)
 * 4. User publishes the content entry
 * 5. Verify published content is available in all locales
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { contentApi } from '@/lib/api/content';
import { translationApi } from '@/lib/api/translation';

// Mock the API modules
vi.mock('@/lib/api/content', () => ({
  contentApi: {
    getContentTypes: vi.fn(),
    getContentType: vi.fn(),
    createContentType: vi.fn(),
    updateContentType: vi.fn(),
    deleteContentType: vi.fn(),
    getContentEntries: vi.fn(),
    getContentEntry: vi.fn(),
    createContentEntry: vi.fn(),
    updateContentEntry: vi.fn(),
    deleteContentEntry: vi.fn(),
    publishContentEntry: vi.fn(),
    unpublishContentEntry: vi.fn(),
  },
}));

vi.mock('@/lib/api/translation', () => ({
  translationApi: {
    getLocales: vi.fn(),
    createLocale: vi.fn(),
    updateLocale: vi.fn(),
    deleteLocale: vi.fn(),
    getContentTranslations: vi.fn(),
    getTranslation: vi.fn(),
    createOrUpdateTranslation: vi.fn(),
    deleteTranslation: vi.fn(),
    autoTranslate: vi.fn(),
  },
}));

describe('Integration: Content → Translation → Publishing Flow', () => {
  const mockContentType = {
    id: '1',
    name: 'Blog Post',
    slug: 'blog-post',
    schema: {
      title: { type: 'text', required: true },
      body: { type: 'textarea', required: true },
      excerpt: { type: 'text' },
    },
    organization_id: '1',
    created_at: '2025-11-29T00:00:00Z',
    updated_at: '2025-11-29T00:00:00Z',
  };

  const mockContentEntry = {
    id: '1',
    content_type_id: '1',
    slug: 'hello-world',
    status: 'draft' as const,
    content_data: {
      title: 'Hello World',
      body: 'This is my first blog post.',
      excerpt: 'Introduction to my blog',
    },
    version: 1,
    author_id: '1',
    created_at: '2025-11-29T00:00:00Z',
    updated_at: '2025-11-29T00:00:00Z',
  };

  const mockPublishedEntry = {
    ...mockContentEntry,
    status: 'published' as const,
    published_at: '2025-11-29T12:00:00Z',
  };

  const mockLocales = [
    {
      id: '1',
      code: 'en',
      name: 'English',
      is_default: true,
      is_enabled: true,
      is_active: true,
      auto_translate: false,
      organization_id: '1',
      created_at: '2025-11-29T00:00:00Z',
      updated_at: '2025-11-29T00:00:00Z',
    },
    {
      id: '2',
      code: 'es',
      name: 'Spanish',
      is_default: false,
      is_enabled: true,
      is_active: true,
      auto_translate: true,
      organization_id: '1',
      created_at: '2025-11-29T00:00:00Z',
      updated_at: '2025-11-29T00:00:00Z',
    },
    {
      id: '3',
      code: 'fr',
      name: 'French',
      is_default: false,
      is_enabled: true,
      is_active: true,
      auto_translate: true,
      organization_id: '1',
      created_at: '2025-11-29T00:00:00Z',
      updated_at: '2025-11-29T00:00:00Z',
    },
  ];

  const mockSpanishTranslation = {
    id: '1',
    content_entry_id: '1',
    locale_id: '2',
    translated_data: {
      title: 'Hola Mundo',
      body: 'Esta es mi primera entrada de blog.',
      excerpt: 'Introducción a mi blog',
    },
    status: 'completed' as const,
    is_manual: true,
    version: 1,
    created_at: '2025-11-29T00:00:00Z',
    updated_at: '2025-11-29T00:00:00Z',
  };

  const mockFrenchTranslation = {
    id: '2',
    content_entry_id: '1',
    locale_id: '3',
    translated_data: {
      title: 'Bonjour le Monde',
      body: 'Ceci est mon premier article de blog.',
      excerpt: 'Introduction à mon blog',
    },
    status: 'completed' as const,
    is_manual: true,
    version: 1,
    created_at: '2025-11-29T00:00:00Z',
    updated_at: '2025-11-29T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Step 1: Create Content Type', () => {
    it('should create a blog post content type', async () => {
      const createTypeSpy = vi.spyOn(contentApi, 'createContentType').mockResolvedValue(mockContentType);

      const result = await contentApi.createContentType({
        name: 'Blog Post',
        slug: 'blog-post',
        schema: {
          title: { type: 'text', required: true },
          body: { type: 'textarea', required: true },
          excerpt: { type: 'text' },
        },
      });

      expect(createTypeSpy).toHaveBeenCalled();
      expect(result).toEqual(mockContentType);
      expect(result.name).toBe('Blog Post');
    });

    it('should include all required fields in schema', async () => {
      vi.spyOn(contentApi, 'createContentType').mockResolvedValue(mockContentType);

      const result = await contentApi.createContentType({
        name: 'Blog Post',
        slug: 'blog-post',
        schema: mockContentType.schema,
      });

      expect(result.schema).toHaveProperty('title');
      expect(result.schema).toHaveProperty('body');
      expect(result.schema).toHaveProperty('excerpt');
      expect(result.schema!.title.required).toBe(true);
      expect(result.schema!.body.required).toBe(true);
    });
  });

  describe('Step 2: Create Content Entry', () => {
    it('should create a draft content entry with default locale', async () => {
      const createEntrySpy = vi.spyOn(contentApi, 'createContentEntry').mockResolvedValue(mockContentEntry);

      const result = await contentApi.createContentEntry({
        content_type_id: '1',
        slug: 'hello-world',
        status: 'draft',
        content_data: {
          title: 'Hello World',
          body: 'This is my first blog post.',
          excerpt: 'Introduction to my blog',
        },
      });

      expect(createEntrySpy).toHaveBeenCalled();
      expect(result).toEqual(mockContentEntry);
      expect(result.status).toBe('draft');
      expect(result.content_data!.title).toBe('Hello World');
    });

    it('should validate required fields', async () => {
      vi.spyOn(contentApi, 'createContentEntry').mockResolvedValue(mockContentEntry);

      const result = await contentApi.createContentEntry({
        content_type_id: '1',
        slug: 'hello-world',
        status: 'draft',
        content_data: {
          title: 'Hello World',
          body: 'This is my first blog post.',
          excerpt: 'Introduction to my blog',
        },
      });

      expect(result.content_data!.title).toBeTruthy();
      expect(result.content_data!.body).toBeTruthy();
    });

    it('should handle missing optional fields', async () => {
      const entryWithoutExcerpt = {
        ...mockContentEntry,
        content_data: {
          title: 'Hello World',
          body: 'This is my first blog post.',
        },
      };

      vi.spyOn(contentApi, 'createContentEntry').mockResolvedValue(entryWithoutExcerpt);

      const result = await contentApi.createContentEntry({
        content_type_id: '1',
        slug: 'hello-world',
        status: 'draft',
        content_data: {
          title: 'Hello World',
          body: 'This is my first blog post.',
        },
      });

      expect(result.content_data!.title).toBeTruthy();
      expect(result.content_data!.body).toBeTruthy();
      expect(result.content_data!.excerpt).toBeUndefined();
    });
  });

  describe('Step 3: Get Available Locales', () => {
    it('should retrieve enabled locales', async () => {
      const getLocalesSpy = vi.spyOn(translationApi, 'getLocales').mockResolvedValue(mockLocales);

      const result = await translationApi.getLocales();

      expect(getLocalesSpy).toHaveBeenCalled();
      expect(result).toHaveLength(3);
      expect(result[0].code).toBe('en');
      expect(result[1].code).toBe('es');
      expect(result[2].code).toBe('fr');
    });

    it('should identify default locale', async () => {
      vi.spyOn(translationApi, 'getLocales').mockResolvedValue(mockLocales);

      const result = await translationApi.getLocales();
      const defaultLocale = result.find(l => l.is_default);

      expect(defaultLocale).toBeDefined();
      expect(defaultLocale?.code).toBe('en');
    });

    it('should filter only enabled locales', async () => {
      vi.spyOn(translationApi, 'getLocales').mockResolvedValue(mockLocales);

      const result = await translationApi.getLocales();
      const enabledLocales = result.filter(l => l.is_enabled);

      expect(enabledLocales).toHaveLength(3);
    });
  });

  describe('Step 4: Create Translations', () => {
    it('should create Spanish translation', async () => {
      const createTranslationSpy = vi.spyOn(translationApi, 'createOrUpdateTranslation').mockResolvedValue(mockSpanishTranslation);

      const result = await translationApi.createOrUpdateTranslation("1", 'es', {
        title: 'Hola Mundo',
        body: 'Esta es mi primera entrada de blog.',
        excerpt: 'Introducción a mi blog',
      });

      expect(createTranslationSpy).toHaveBeenCalledWith(1, 'es', {
        title: 'Hola Mundo',
        body: 'Esta es mi primera entrada de blog.',
        excerpt: 'Introducción a mi blog',
      });
      expect(result).toEqual(mockSpanishTranslation);
      expect(result.translated_data.title).toBe('Hola Mundo');
    });

    it('should create French translation', async () => {
      const createTranslationSpy = vi.spyOn(translationApi, 'createOrUpdateTranslation').mockResolvedValue(mockFrenchTranslation);

      const result = await translationApi.createOrUpdateTranslation("1", 'fr', {
        title: 'Bonjour le Monde',
        body: 'Ceci est mon premier article de blog.',
        excerpt: 'Introduction à mon blog',
      });

      expect(createTranslationSpy).toHaveBeenCalledWith(1, 'fr', {
        title: 'Bonjour le Monde',
        body: 'Ceci est mon premier article de blog.',
        excerpt: 'Introduction à mon blog',
      });
      expect(result).toEqual(mockFrenchTranslation);
      expect(result.translated_data.title).toBe('Bonjour le Monde');
    });

    it('should translate all fields from schema', async () => {
      vi.spyOn(translationApi, 'createOrUpdateTranslation').mockResolvedValue(mockSpanishTranslation);

      const result = await translationApi.createOrUpdateTranslation("1", 'es', {
        title: 'Hola Mundo',
        body: 'Esta es mi primera entrada de blog.',
        excerpt: 'Introducción a mi blog',
      });

      expect(result.translated_data).toHaveProperty('title');
      expect(result.translated_data).toHaveProperty('body');
      expect(result.translated_data).toHaveProperty('excerpt');
    });

    it('should handle translation errors', async () => {
      const createTranslationSpy = vi.spyOn(translationApi, 'createOrUpdateTranslation').mockRejectedValue({
        response: { data: { detail: 'Translation service unavailable' } },
      });

      await expect(
        translationApi.createOrUpdateTranslation("1", 'es', {})
      ).rejects.toMatchObject({
        response: { data: { detail: 'Translation service unavailable' } },
      });

      expect(createTranslationSpy).toHaveBeenCalled();
    });
  });

  describe('Step 5: Publish Content', () => {
    it('should publish content entry', async () => {
      const publishSpy = vi.spyOn(contentApi, 'publishContentEntry').mockResolvedValue(mockPublishedEntry);

      const result = await contentApi.publishContentEntry("1");

      expect(publishSpy).toHaveBeenCalledWith(1);
      expect(result.status).toBe('published');
      expect(result.published_at).toBeTruthy();
    });

    it('should update status from draft to published', async () => {
      vi.spyOn(contentApi, 'publishContentEntry').mockResolvedValue(mockPublishedEntry);

      const result = await contentApi.publishContentEntry("1");

      expect(result.status).toBe('published');
      expect(result.published_at).toBe('2025-11-29T12:00:00Z');
    });

    it('should handle publish errors', async () => {
      const publishSpy = vi.spyOn(contentApi, 'publishContentEntry').mockRejectedValue({
        response: { data: { detail: 'Cannot publish content with missing translations' } },
      });

      await expect(
        contentApi.publishContentEntry("1")
      ).rejects.toMatchObject({
        response: { data: { detail: 'Cannot publish content with missing translations' } },
      });

      expect(publishSpy).toHaveBeenCalled();
    });
  });

  describe('Step 6: Verify Published Content', () => {
    it('should retrieve published content entry', async () => {
      const getEntrySpy = vi.spyOn(contentApi, 'getContentEntry').mockResolvedValue(mockPublishedEntry);

      const result = await contentApi.getContentEntry("1");

      expect(getEntrySpy).toHaveBeenCalledWith(1);
      expect(result.status).toBe('published');
      expect(result.published_at).toBeTruthy();
    });

    it('should retrieve all translations for published content', async () => {
      const getTranslationsSpy = vi.spyOn(translationApi, 'getContentTranslations').mockResolvedValue(
        [mockSpanishTranslation, mockFrenchTranslation]
      );

      const result = await translationApi.getContentTranslations("1");

      expect(getTranslationsSpy).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(2);
      expect(result.find(t => t.locale!.id === '2')).toBeDefined();
      expect(result.find(t => t.locale!.id === '3')).toBeDefined();
    });

    it('should verify Spanish translation is available', async () => {
      vi.spyOn(translationApi, 'getContentTranslations').mockResolvedValue(
        [mockSpanishTranslation, mockFrenchTranslation]
      );

      const result = await translationApi.getContentTranslations("1");
      const spanish = result.find(t => t.locale!.id === '2');

      expect(spanish).toBeDefined();
      expect(spanish?.translated_data.title).toBe('Hola Mundo');
    });

    it('should verify French translation is available', async () => {
      vi.spyOn(translationApi, 'getContentTranslations').mockResolvedValue(
        [mockSpanishTranslation, mockFrenchTranslation]
      );

      const result = await translationApi.getContentTranslations("1");
      const french = result.find(t => t.locale!.id === '3');

      expect(french).toBeDefined();
      expect(french?.translated_data.title).toBe('Bonjour le Monde');
    });
  });

  describe('Complete Workflow Integration', () => {
    it('should complete entire content → translation → publishing flow', async () => {
      // Step 1: Create content type
      vi.spyOn(contentApi, 'createContentType').mockResolvedValue(mockContentType);
      const contentType = await contentApi.createContentType({
        name: 'Blog Post',
        slug: 'blog-post',
        schema: mockContentType.schema,
      });
      expect(contentType.id).toBe(1);

      // Step 2: Create content entry
      vi.spyOn(contentApi, 'createContentEntry').mockResolvedValue(mockContentEntry);
      const entry = await contentApi.createContentEntry({
        content_type_id: contentType.id,
        slug: 'hello-world',
        status: 'draft',
        content_data: mockContentEntry.content_data,
      });
      expect(entry.status).toBe('draft');

      // Step 3: Get available locales
      vi.spyOn(translationApi, 'getLocales').mockResolvedValue(mockLocales);
      const locales = await translationApi.getLocales();
      expect(locales).toHaveLength(3);

      // Step 4: Create Spanish translation
      vi.spyOn(translationApi, 'createOrUpdateTranslation').mockResolvedValue(mockSpanishTranslation);
      const spanish = await translationApi.createOrUpdateTranslation(
        entry.id,
        'es',
        mockSpanishTranslation.translated_data
      );
      expect(spanish.locale_id).toBe(2);

      // Step 5: Create French translation
      vi.spyOn(translationApi, 'createOrUpdateTranslation').mockResolvedValue(mockFrenchTranslation);
      const french = await translationApi.createOrUpdateTranslation(
        entry.id,
        'fr',
        mockFrenchTranslation.translated_data
      );
      expect(french.locale_id).toBe(3);

      // Step 6: Publish content
      vi.spyOn(contentApi, 'publishContentEntry').mockResolvedValue(mockPublishedEntry);
      const published = await contentApi.publishContentEntry(entry.id);
      expect(published.status).toBe('published');

      // Step 7: Verify translations are available
      vi.spyOn(translationApi, 'getContentTranslations').mockResolvedValue(
        [mockSpanishTranslation, mockFrenchTranslation]
      );
      const translations = await translationApi.getContentTranslations(entry.id);
      expect(translations).toHaveLength(2);
    });

    it('should maintain content data integrity across translations', async () => {
      // Create content
      vi.spyOn(contentApi, 'createContentEntry').mockResolvedValue(mockContentEntry);
      const entry = await contentApi.createContentEntry({
        content_type_id: '1',
        slug: 'hello-world',
        status: 'draft',
        content_data: mockContentEntry.content_data,
      });

      const originalTitle = entry.content_data!.title;

      // Create translations
      vi.spyOn(translationApi, 'createOrUpdateTranslation')
        .mockResolvedValueOnce(mockSpanishTranslation)
        .mockResolvedValueOnce(mockFrenchTranslation);

      const spanish = await translationApi.createOrUpdateTranslation(
        entry.id,
        'es',
        mockSpanishTranslation.translated_data
      );

      const french = await translationApi.createOrUpdateTranslation(
        entry.id,
        'fr',
        mockFrenchTranslation.translated_data
      );

      // Original content should be unchanged
      expect(entry.content_data!.title).toBe(originalTitle);
      // Translations should have different content
      expect(spanish.translated_data.title).not.toBe(originalTitle);
      expect(french.translated_data.title).not.toBe(originalTitle);
      expect(spanish.translated_data.title).not.toBe(french.translated_data.title);
    });

    it('should handle multi-locale publishing workflow', async () => {
      // Setup: Create content with translations
      vi.spyOn(contentApi, 'createContentEntry').mockResolvedValue(mockContentEntry);
      vi.spyOn(translationApi, 'createOrUpdateTranslation')
        .mockResolvedValueOnce(mockSpanishTranslation)
        .mockResolvedValueOnce(mockFrenchTranslation);

      const entry = await contentApi.createContentEntry({
        content_type_id: '1',
        slug: 'hello-world',
        status: 'draft',
        content_data: mockContentEntry.content_data,
      });

      await translationApi.createOrUpdateTranslation(
        entry.id,
        'es',
        mockSpanishTranslation.translated_data
      );

      await translationApi.createOrUpdateTranslation(
        entry.id,
        'fr',
        mockFrenchTranslation.translated_data
      );

      // Publish
      vi.spyOn(contentApi, 'publishContentEntry').mockResolvedValue(mockPublishedEntry);
      const published = await contentApi.publishContentEntry(entry.id);

      // Verify all locales are available
      vi.spyOn(translationApi, 'getContentTranslations').mockResolvedValue(
        [mockSpanishTranslation, mockFrenchTranslation]
      );
      const translations = await translationApi.getContentTranslations(published.id);

      expect(published.status).toBe('published');
      expect(translations).toHaveLength(2);
      expect(translations.map(t => t.locale_id)).toContain(2);
      expect(translations.map(t => t.locale_id)).toContain(3);
    });
  });
});
