import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  socialLoginApi,
  PROVIDER_INFO,
  SocialProvider,
  SocialProvidersResponse,
  AuthorizationUrlResponse,
  SocialAuthResponse,
  UserIdentitiesResponse,
  UnlinkResponse,
} from './social-login';

// Mock the apiClient
vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { apiClient } from './client';

describe('socialLoginApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProviders', () => {
    it('should get list of enabled social login providers', async () => {
      const mockResponse: SocialProvidersResponse = {
        providers: [
          { provider: 'google', name: 'Google' },
          { provider: 'github', name: 'GitHub' },
        ],
      };
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockResponse });

      const result = await socialLoginApi.getProviders();

      expect(apiClient.get).toHaveBeenCalledWith('/auth/social/providers');
      expect(result.providers).toHaveLength(2);
    });
  });

  describe('getAuthorizationUrl', () => {
    it('should get authorization URL for Google provider', async () => {
      const mockResponse: AuthorizationUrlResponse = {
        authorization_url: 'https://accounts.google.com/o/oauth2/auth?...',
        state: 'random-state-123',
        provider: 'google',
      };
      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

      const result = await socialLoginApi.getAuthorizationUrl(
        'google',
        'http://localhost:3000/api/auth/callback/google'
      );

      expect(apiClient.post).toHaveBeenCalledWith('/auth/social/authorize', {
        provider: 'google',
        redirect_uri: 'http://localhost:3000/api/auth/callback/google',
        link_to_existing: false,
      });
      expect(result.authorization_url).toContain('accounts.google.com');
    });

    it('should get authorization URL for linking to existing account', async () => {
      const mockResponse: AuthorizationUrlResponse = {
        authorization_url: 'https://github.com/login/oauth/authorize?...',
        state: 'random-state-456',
        provider: 'github',
      };
      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

      await socialLoginApi.getAuthorizationUrl(
        'github',
        'http://localhost:3000/api/auth/callback/github',
        true
      );

      expect(apiClient.post).toHaveBeenCalledWith('/auth/social/authorize', {
        provider: 'github',
        redirect_uri: 'http://localhost:3000/api/auth/callback/github',
        link_to_existing: true,
      });
    });
  });

  describe('handleCallback', () => {
    it('should handle OAuth callback and return tokens', async () => {
      const mockResponse: SocialAuthResponse = {
        access_token: 'jwt-access-token',
        refresh_token: 'jwt-refresh-token',
        token_type: 'bearer',
        expires_in: 3600,
        user: {
          id: 'user-123',
          email: 'user@example.com',
          first_name: 'John',
          last_name: 'Doe',
          avatar_url: 'https://example.com/avatar.jpg',
          organization_id: 'org-123',
        },
        is_new_user: false,
        linked_identity: false,
      };
      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

      const result = await socialLoginApi.handleCallback(
        'google',
        'auth-code-123',
        'state-456',
        'http://localhost:3000/api/auth/callback/google'
      );

      expect(apiClient.post).toHaveBeenCalledWith('/auth/social/callback', {
        provider: 'google',
        code: 'auth-code-123',
        state: 'state-456',
        redirect_uri: 'http://localhost:3000/api/auth/callback/google',
      });
      expect(result.access_token).toBe('jwt-access-token');
      expect(result.user.email).toBe('user@example.com');
    });

    it('should identify new users', async () => {
      const mockResponse: SocialAuthResponse = {
        access_token: 'jwt-access-token',
        refresh_token: 'jwt-refresh-token',
        token_type: 'bearer',
        expires_in: 3600,
        user: {
          id: 'user-new',
          email: 'newuser@example.com',
          first_name: 'Jane',
          last_name: null,
          avatar_url: null,
          organization_id: 'org-new',
        },
        is_new_user: true,
        linked_identity: false,
      };
      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

      const result = await socialLoginApi.handleCallback(
        'github',
        'code',
        'state',
        'http://localhost:3000/api/auth/callback/github'
      );

      expect(result.is_new_user).toBe(true);
    });
  });

  describe('getLinkedIdentities', () => {
    it('should get linked social identities for current user', async () => {
      const mockResponse: UserIdentitiesResponse = {
        identities: [
          {
            provider: 'google',
            provider_email: 'user@gmail.com',
            provider_name: 'John Doe',
            provider_avatar_url: 'https://lh3.googleusercontent.com/photo',
            linked_at: '2025-01-01T00:00:00Z',
            last_login_at: '2025-01-15T10:00:00Z',
          },
          {
            provider: 'github',
            provider_email: 'user@github.com',
            provider_name: 'johndoe',
            provider_avatar_url: 'https://avatars.githubusercontent.com/u/123',
            linked_at: '2025-01-05T00:00:00Z',
            last_login_at: null,
          },
        ],
      };
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockResponse });

      const result = await socialLoginApi.getLinkedIdentities();

      expect(apiClient.get).toHaveBeenCalledWith('/auth/social/identities');
      expect(result.identities).toHaveLength(2);
    });
  });

  describe('unlinkIdentity', () => {
    it('should unlink a social identity', async () => {
      const mockResponse: UnlinkResponse = {
        success: true,
        message: 'Google account unlinked successfully',
      };
      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

      const result = await socialLoginApi.unlinkIdentity('google');

      expect(apiClient.post).toHaveBeenCalledWith('/auth/social/unlink', { provider: 'google' });
      expect(result.success).toBe(true);
    });
  });

  describe('PROVIDER_INFO', () => {
    it('should have configuration for all supported providers', () => {
      const providers: SocialProvider[] = ['google', 'github', 'microsoft', 'apple', 'facebook'];
      
      providers.forEach(provider => {
        expect(PROVIDER_INFO[provider]).toBeDefined();
        expect(PROVIDER_INFO[provider].name).toBeDefined();
        expect(PROVIDER_INFO[provider].icon).toBeDefined();
        expect(PROVIDER_INFO[provider].bgColor).toBeDefined();
        expect(PROVIDER_INFO[provider].textColor).toBeDefined();
      });
    });

    it('should have correct provider names', () => {
      expect(PROVIDER_INFO.google.name).toBe('Google');
      expect(PROVIDER_INFO.github.name).toBe('GitHub');
      expect(PROVIDER_INFO.microsoft.name).toBe('Microsoft');
      expect(PROVIDER_INFO.apple.name).toBe('Apple');
      expect(PROVIDER_INFO.facebook.name).toBe('Facebook');
    });
  });

  describe('getCallbackUrl', () => {
    const originalWindow = global.window;

    beforeEach(() => {
      global.window = {
        ...originalWindow,
        location: { origin: 'http://localhost:3000' } as Location,
      } as any;
    });

    afterEach(() => {
      global.window = originalWindow;
    });

    it('should generate callback URL for provider', () => {
      const callbackUrl = socialLoginApi.getCallbackUrl('google');

      expect(callbackUrl).toBe('http://localhost:3000/api/auth/callback/google');
    });

    it('should generate callback URL for different providers', () => {
      expect(socialLoginApi.getCallbackUrl('github')).toBe('http://localhost:3000/api/auth/callback/github');
      expect(socialLoginApi.getCallbackUrl('microsoft')).toBe('http://localhost:3000/api/auth/callback/microsoft');
    });
  });

  describe('redirectToProvider', () => {
    const originalWindow = global.window;

    afterEach(() => {
      global.window = originalWindow;
    });

    it('should redirect to authorization URL', () => {
      const mockLocation = { href: '' };
      global.window = { location: mockLocation } as any;

      socialLoginApi.redirectToProvider('https://accounts.google.com/o/oauth2/auth?...');

      expect(mockLocation.href).toBe('https://accounts.google.com/o/oauth2/auth?...');
    });
  });

  describe('openPopup', () => {
    const originalWindow = global.window;

    afterEach(() => {
      global.window = originalWindow;
    });

    it('should open popup window with correct parameters', () => {
      const mockOpen = vi.fn().mockReturnValue({ focus: vi.fn() });
      global.window = {
        open: mockOpen,
        screen: { width: 1920, height: 1080 },
      } as any;

      const popup = socialLoginApi.openPopup('https://accounts.google.com/o/oauth2/auth');

      expect(mockOpen).toHaveBeenCalled();
      const [url, name, features] = mockOpen.mock.calls[0];
      expect(url).toBe('https://accounts.google.com/o/oauth2/auth');
      expect(name).toBe('social-login');
      expect(features).toContain('width=500');
      expect(features).toContain('height=600');
      expect(features).toContain('toolbar=no');
      expect(features).toContain('menubar=no');
    });

    it('should allow custom popup dimensions', () => {
      const mockOpen = vi.fn().mockReturnValue({ focus: vi.fn() });
      global.window = {
        open: mockOpen,
        screen: { width: 1920, height: 1080 },
      } as any;

      socialLoginApi.openPopup('https://github.com/login/oauth/authorize', 600, 800);

      const features = mockOpen.mock.calls[0][2];
      expect(features).toContain('width=600');
      expect(features).toContain('height=800');
    });
  });

  describe('API path consistency', () => {
    it('should use /auth/social base path for all endpoints', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: { providers: [] } });
      vi.mocked(apiClient.post).mockResolvedValue({ data: { authorization_url: '', state: '', provider: 'google' } });

      await socialLoginApi.getProviders();
      await socialLoginApi.getAuthorizationUrl('google', 'http://localhost:3000/callback');
      await socialLoginApi.getLinkedIdentities();
      await socialLoginApi.unlinkIdentity('google');

      // All paths should be relative (baseURL handles /api/v1)
      expect(vi.mocked(apiClient.get).mock.calls[0][0]).toBe('/auth/social/providers');
      expect(vi.mocked(apiClient.post).mock.calls[0][0]).toBe('/auth/social/authorize');
      expect(vi.mocked(apiClient.get).mock.calls[1][0]).toBe('/auth/social/identities');
      expect(vi.mocked(apiClient.post).mock.calls[1][0]).toBe('/auth/social/unlink');
    });
  });
});
