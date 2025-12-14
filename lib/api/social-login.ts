/**
 * Social Login API client
 * Supports OAuth2 social authentication (Google, Apple, Facebook, GitHub, Microsoft)
 */

import { apiClient } from './client';

// Types
export type SocialProvider = 'google' | 'apple' | 'facebook' | 'github' | 'microsoft';

export interface SocialProviderInfo {
  provider: string;
  name: string;
}

export interface SocialProvidersResponse {
  providers: SocialProviderInfo[];
}

export interface AuthorizationUrlRequest {
  provider: string;
  redirect_uri: string;
  link_to_existing?: boolean;
}

export interface AuthorizationUrlResponse {
  authorization_url: string;
  state: string;
  provider: string;
}

export interface SocialCallbackRequest {
  provider: string;
  code: string;
  state: string;
  redirect_uri: string;
}

export interface SocialAuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    organization_id: string;
  };
  is_new_user: boolean;
  linked_identity: boolean;
}

export interface LinkedIdentity {
  provider: string;
  provider_email: string | null;
  provider_name: string | null;
  provider_avatar_url: string | null;
  linked_at: string;
  last_login_at: string | null;
}

export interface UserIdentitiesResponse {
  identities: LinkedIdentity[];
}

export interface UnlinkResponse {
  success: boolean;
  message: string;
}

// Provider display info
export const PROVIDER_INFO: Record<SocialProvider, { name: string; icon: string; bgColor: string; textColor: string }> = {
  google: {
    name: 'Google',
    icon: 'M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z',
    bgColor: 'bg-white hover:bg-gray-50',
    textColor: 'text-gray-700',
  },
  github: {
    name: 'GitHub',
    icon: 'M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8z',
    bgColor: 'bg-gray-900 hover:bg-gray-800',
    textColor: 'text-white',
  },
  microsoft: {
    name: 'Microsoft',
    icon: 'M0 0h233.33v233.33H0V0zm266.67 0H500v233.33H266.67V0zM0 266.67h233.33V500H0V266.67zm266.67 0H500V500H266.67V266.67z',
    bgColor: 'bg-[#2F2F2F] hover:bg-[#1F1F1F]',
    textColor: 'text-white',
  },
  apple: {
    name: 'Apple',
    icon: 'M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z',
    bgColor: 'bg-black hover:bg-gray-900',
    textColor: 'text-white',
  },
  facebook: {
    name: 'Facebook',
    icon: 'M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z',
    bgColor: 'bg-[#1877F2] hover:bg-[#166FE5]',
    textColor: 'text-white',
  },
};

// API Client
export const socialLoginApi = {
  /**
   * Get list of enabled social login providers
   */
  async getProviders(): Promise<SocialProvidersResponse> {
    const response = await apiClient.get<SocialProvidersResponse>('/auth/social/providers');
    return response.data;
  },

  /**
   * Get authorization URL for a provider
   * This initiates the OAuth2 flow - redirect user to this URL
   */
  async getAuthorizationUrl(
    provider: SocialProvider,
    redirectUri: string,
    linkToExisting: boolean = false
  ): Promise<AuthorizationUrlResponse> {
    const response = await apiClient.post<AuthorizationUrlResponse>(
      '/auth/social/authorize',
      {
        provider,
        redirect_uri: redirectUri,
        link_to_existing: linkToExisting,
      }
    );
    return response.data;
  },

  /**
   * Handle OAuth2 callback from provider
   * Exchange authorization code for access token
   */
  async handleCallback(
    provider: SocialProvider,
    code: string,
    state: string,
    redirectUri: string
  ): Promise<SocialAuthResponse> {
    const response = await apiClient.post<SocialAuthResponse>(
      '/auth/social/callback',
      {
        provider,
        code,
        state,
        redirect_uri: redirectUri,
      }
    );
    return response.data;
  },

  /**
   * Get list of linked social identities for current user
   */
  async getLinkedIdentities(): Promise<UserIdentitiesResponse> {
    const response = await apiClient.get<UserIdentitiesResponse>('/auth/social/identities');
    return response.data;
  },

  /**
   * Unlink a social identity
   */
  async unlinkIdentity(provider: SocialProvider): Promise<UnlinkResponse> {
    const response = await apiClient.post<UnlinkResponse>('/auth/social/unlink', { provider });
    return response.data;
  },

  /**
   * Helper: Redirect to provider authorization
   */
  redirectToProvider(authorizationUrl: string): void {
    window.location.href = authorizationUrl;
  },

  /**
   * Helper: Open provider authorization in popup
   */
  openPopup(authorizationUrl: string, width = 500, height = 600): Window | null {
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    return window.open(
      authorizationUrl,
      'social-login',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`
    );
  },

  /**
   * Get the callback URL for a provider
   */
  getCallbackUrl(provider: SocialProvider): string {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/api/auth/callback/${provider}`;
  },
};

export default socialLoginApi;
