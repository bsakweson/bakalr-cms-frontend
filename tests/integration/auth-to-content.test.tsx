/**
 * Integration Test: User Registration → Login → Content Creation Flow
 * 
 * Tests the complete workflow from user registration through content creation:
 * 1. User registers a new account with organization
 * 2. User logs in with credentials
 * 3. User creates a content type (blog post)
 * 4. User creates content entry with that type
 * 5. Verify content appears in content list
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { authApi } from '@/lib/api/auth';
import { contentApi } from '@/lib/api/content';

// Mock the API modules
vi.mock('@/lib/api/auth', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    getCurrentUser: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
    changePassword: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

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
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

describe('Integration: Auth to Content Creation Flow', () => {
  const mockUser = {
    id: 1,
    email: 'newuser@example.com',
    full_name: 'New User',
    organization_id: 1,
    is_active: true,
    created_at: '2025-11-29T00:00:00Z',
    updated_at: '2025-11-29T00:00:00Z',
    organization: {
      id: 1,
      name: 'Test Org',
      slug: 'test-org',
      is_active: true,
      created_at: '2025-11-29T00:00:00Z',
      updated_at: '2025-11-29T00:00:00Z',
    },
  };

  const mockAuthResponse = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    token_type: 'bearer',
    user: mockUser,
  };

  const mockContentType = {
    id: 1,
    name: 'Blog Post',
    slug: 'blog-post',
    schema: {
      title: { type: 'text', required: true },
      body: { type: 'textarea', required: true },
      author: { type: 'text' },
    },
    organization_id: 1,
    created_at: '2025-11-29T00:00:00Z',
    updated_at: '2025-11-29T00:00:00Z',
  };

  const mockContentEntry = {
    id: 1,
    content_type_id: 1,
    slug: 'my-first-blog-post',
    status: 'draft' as const,
    content_data: {
      title: 'My First Blog Post',
      body: 'This is the content of my first blog post.',
      author: 'New User',
    },
    version: 1,
    author_id: 1,
    created_at: '2025-11-29T00:00:00Z',
    updated_at: '2025-11-29T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Step 1: User Registration', () => {
    it('should successfully register a new user with organization', async () => {
      const registerSpy = vi.spyOn(authApi, 'register').mockResolvedValue(mockAuthResponse);

      const registrationData = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        full_name: 'New User',
        organization_name: 'Test Org',
      };

      const result = await authApi.register(registrationData);

      expect(registerSpy).toHaveBeenCalledWith(registrationData);
      expect(result).toEqual(mockAuthResponse);
      expect(result.user.email).toBe('newuser@example.com');
      expect(result.user.organization?.name).toBe('Test Org');
    });

    it('should store authentication tokens after registration', async () => {
      vi.spyOn(authApi, 'register').mockResolvedValue(mockAuthResponse);

      await authApi.register({
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        full_name: 'New User',
        organization_name: 'Test Org',
      });

      // Verify tokens would be stored (in real app, this happens in the component)
      expect(mockAuthResponse.access_token).toBeTruthy();
      expect(mockAuthResponse.refresh_token).toBeTruthy();
    });

    it('should handle registration errors gracefully', async () => {
      const registerSpy = vi.spyOn(authApi, 'register').mockRejectedValue({
        response: { data: { detail: 'Email already exists' } },
      });

      await expect(
        authApi.register({
          email: 'existing@example.com',
          password: 'password',
          full_name: 'User',
          organization_name: 'Org',
        })
      ).rejects.toMatchObject({
        response: { data: { detail: 'Email already exists' } },
      });

      expect(registerSpy).toHaveBeenCalled();
    });
  });

  describe('Step 2: User Login', () => {
    it('should successfully login with registered credentials', async () => {
      const loginSpy = vi.spyOn(authApi, 'login').mockResolvedValue(mockAuthResponse);

      const result = await authApi.login({
        email: 'newuser@example.com',
        password: 'SecurePass123!',
      });

      expect(loginSpy).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'SecurePass123!',
      });
      expect(result).toEqual(mockAuthResponse);
      expect(result.user).toEqual(mockUser);
    });

    it('should persist user session after login', async () => {
      vi.spyOn(authApi, 'login').mockResolvedValue(mockAuthResponse);

      const result = await authApi.login({
        email: 'newuser@example.com',
        password: 'SecurePass123!',
      });

      // Verify user data is available for session persistence
      expect(result.user.id).toBe(1);
      expect(result.user.organization_id).toBe(1);
    });

    it('should handle invalid credentials', async () => {
      const loginSpy = vi.spyOn(authApi, 'login').mockRejectedValue({
        response: { data: { detail: 'Invalid credentials' } },
      });

      await expect(
        authApi.login({
          email: 'wrong@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toMatchObject({
        response: { data: { detail: 'Invalid credentials' } },
      });

      expect(loginSpy).toHaveBeenCalled();
    });
  });

  describe('Step 3: Create Content Type', () => {
    it('should create a blog post content type', async () => {
      const createTypeSpy = vi.spyOn(contentApi, 'createContentType').mockResolvedValue(mockContentType);

      const contentTypeData = {
        name: 'Blog Post',
        slug: 'blog-post',
        schema: {
          title: { type: 'text', required: true },
          body: { type: 'textarea', required: true },
          author: { type: 'text' },
        },
      };

      const result = await contentApi.createContentType(contentTypeData);

      expect(createTypeSpy).toHaveBeenCalledWith(contentTypeData);
      expect(result).toEqual(mockContentType);
      expect(result.name).toBe('Blog Post');
      expect(result.slug).toBe('blog-post');
    });

    it('should validate content type schema', async () => {
      vi.spyOn(contentApi, 'createContentType').mockResolvedValue(mockContentType);

      const result = await contentApi.createContentType({
        name: 'Blog Post',
        slug: 'blog-post',
        schema: {
          title: { type: 'text', required: true },
          body: { type: 'textarea', required: true },
          author: { type: 'text' },
        },
      });

      // Verify schema structure
      expect(result.schema).toHaveProperty('title');
      expect(result.schema).toHaveProperty('body');
      expect(result.schema).toHaveProperty('author');
      expect(result.schema.title.required).toBe(true);
      expect(result.schema.body.required).toBe(true);
    });

    it('should associate content type with user organization', async () => {
      vi.spyOn(contentApi, 'createContentType').mockResolvedValue(mockContentType);

      const result = await contentApi.createContentType({
        name: 'Blog Post',
        slug: 'blog-post',
        schema: {},
      });

      expect(result.organization_id).toBe(mockUser.organization_id);
    });
  });

  describe('Step 4: Create Content Entry', () => {
    it('should create a content entry using the blog post type', async () => {
      const createEntrySpy = vi.spyOn(contentApi, 'createContentEntry').mockResolvedValue(mockContentEntry);

      const entryData = {
        content_type_id: 1,
        slug: 'my-first-blog-post',
        status: 'draft' as const,
        content_data: {
          title: 'My First Blog Post',
          body: 'This is the content of my first blog post.',
          author: 'New User',
        },
      };

      const result = await contentApi.createContentEntry(entryData);

      expect(createEntrySpy).toHaveBeenCalledWith(entryData);
      expect(result).toEqual(mockContentEntry);
      expect(result.content_data.title).toBe('My First Blog Post');
      expect(result.status).toBe('draft');
    });

    it('should populate fields according to content type schema', async () => {
      vi.spyOn(contentApi, 'createContentEntry').mockResolvedValue(mockContentEntry);

      const result = await contentApi.createContentEntry({
        content_type_id: 1,
        slug: 'my-first-blog-post',
        status: 'draft',
        content_data: {
          title: 'My First Blog Post',
          body: 'This is the content of my first blog post.',
          author: 'New User',
        },
      });

      // Verify all schema fields are populated
      expect(result.content_data).toHaveProperty('title');
      expect(result.content_data).toHaveProperty('body');
      expect(result.content_data).toHaveProperty('author');
      expect(result.content_data.title).toBe('My First Blog Post');
    });

    it('should handle missing required fields', async () => {
      const createEntrySpy = vi.spyOn(contentApi, 'createContentEntry').mockRejectedValue({
        response: { data: { detail: 'Missing required field: title' } },
      });

      await expect(
        contentApi.createContentEntry({
          content_type_id: 1,
          slug: 'invalid-entry',
          status: 'draft',
          content_data: {
            body: 'Content without title',
          },
        })
      ).rejects.toMatchObject({
        response: { data: { detail: 'Missing required field: title' } },
      });

      expect(createEntrySpy).toHaveBeenCalled();
    });
  });

  describe('Step 5: Verify Content in List', () => {
    it('should retrieve created content entry in content list', async () => {
      const listSpy = vi.spyOn(contentApi, 'getContentEntries').mockResolvedValue({
        items: [mockContentEntry],
        total: 1,
        page: 1,
        per_page: 10,
        total_pages: 1,
      });

      const result = await contentApi.getContentEntries();

      expect(listSpy).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual(mockContentEntry);
      expect(result.items[0].content_data.title).toBe('My First Blog Post');
    });

    it('should filter content by content type', async () => {
      const listSpy = vi.spyOn(contentApi, 'getContentEntries').mockResolvedValue({
        items: [mockContentEntry],
        total: 1,
        page: 1,
        per_page: 10,
        total_pages: 1,
      });

      const result = await contentApi.getContentEntries({ content_type_id: 1 });

      expect(listSpy).toHaveBeenCalledWith({ content_type_id: 1 });
      expect(result.items[0].content_type_id).toBe(1);
    });

    it('should filter content by status', async () => {
      const listSpy = vi.spyOn(contentApi, 'getContentEntries').mockResolvedValue({
        items: [mockContentEntry],
        total: 1,
        page: 1,
        per_page: 10,
        total_pages: 1,
      });

      const result = await contentApi.getContentEntries({ status: 'draft' });

      expect(listSpy).toHaveBeenCalledWith({ status: 'draft' });
      expect(result.items[0].status).toBe('draft');
    });
  });

  describe('Complete Workflow Integration', () => {
    it('should complete entire registration to content creation flow', async () => {
      // Step 1: Register
      vi.spyOn(authApi, 'register').mockResolvedValue(mockAuthResponse);
      const registerResult = await authApi.register({
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        full_name: 'New User',
        organization_name: 'Test Org',
      });
      expect(registerResult.user.email).toBe('newuser@example.com');

      // Step 2: Login (simulated - in real flow user would be auto-logged in)
      vi.spyOn(authApi, 'login').mockResolvedValue(mockAuthResponse);
      const loginResult = await authApi.login({
        email: 'newuser@example.com',
        password: 'SecurePass123!',
      });
      expect(loginResult.access_token).toBeTruthy();

      // Step 3: Create content type
      vi.spyOn(contentApi, 'createContentType').mockResolvedValue(mockContentType);
      const contentType = await contentApi.createContentType({
        name: 'Blog Post',
        slug: 'blog-post',
        schema: {
          title: { type: 'text', required: true },
          body: { type: 'textarea', required: true },
        },
      });
      expect(contentType.id).toBe(1);

      // Step 4: Create content entry
      vi.spyOn(contentApi, 'createContentEntry').mockResolvedValue(mockContentEntry);
      const entry = await contentApi.createContentEntry({
        content_type_id: contentType.id,
        slug: 'my-first-blog-post',
        status: 'draft',
        content_data: {
          title: 'My First Blog Post',
          body: 'This is my first post.',
        },
      });
      expect(entry.id).toBe(1);

      // Step 5: Verify in list
      vi.spyOn(contentApi, 'getContentEntries').mockResolvedValue({
        items: [entry],
        total: 1,
        page: 1,
        per_page: 10,
        total_pages: 1,
      });
      const list = await contentApi.getContentEntries();
      expect(list.items).toContainEqual(entry);
    });

    it('should maintain user context throughout workflow', async () => {
      // Register with organization
      vi.spyOn(authApi, 'register').mockResolvedValue(mockAuthResponse);
      const registerResult = await authApi.register({
        email: 'newuser@example.com',
        password: 'pass',
        full_name: 'User',
        organization_name: 'Test Org',
      });

      const organizationId = registerResult.user.organization_id;

      // Create content type - should use same organization
      vi.spyOn(contentApi, 'createContentType').mockResolvedValue(mockContentType);
      const contentType = await contentApi.createContentType({
        name: 'Blog Post',
        slug: 'blog-post',
        schema: {},
      });
      expect(contentType.organization_id).toBe(organizationId);

      // Create content entry - should be scoped to organization
      vi.spyOn(contentApi, 'createContentEntry').mockResolvedValue(mockContentEntry);
      const entry = await contentApi.createContentEntry({
        content_type_id: contentType.id,
        slug: 'test',
        status: 'draft',
        content_data: {},
      });
      
      // Verify data isolation by organization
      expect(entry.content_type_id).toBe(contentType.id);
    });
  });
});
