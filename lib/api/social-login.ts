/**
 * Social Login API client
 * Supports OAuth2 social authentication (Google, Apple, Facebook, GitHub, Microsoft)
 */

import { apiClient } from './client';

// Types
export type SocialProvider = 'google' | 'apple' | 'facebook' | 'github' | 'microsoft';

export interface SocialProviderInfo {
  provider: SocialProvider;
  name: string;
  enabled: boolean;
  icon_url: string | null;
}

export interface SocialProvidersResponse {
  providers: SocialProviderInfo[];
}

export interface AuthorizationUrlResponse {
  authorization_url: string;
  state: string;
}

export interface SocialAuthCallback {
  code: string;
  state: string;
}

export interface SocialAuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  is_new_user: boolean;
  linked_provider: SocialProvider;
}

export interface LinkedAccount {
  provider: SocialProvider;
  provider_user_id: string;
  provider_email: string | null;
  linked_at: string;
  last_used_at: string | null;
}

export interface LinkedAccountsResponse {
  accounts: LinkedAccount[];
}

export interface UnlinkResponse {
  message: string;
  provider: SocialProvider;
}

// API Client
export const socialLoginApi = {
  /**
   * Get list of enabled social login providers
   */
  async getProviders(): Promise<SocialProvidersResponse> {
    const response = await apiClient.get<SocialProvidersResponse>('/social-login/providers');
    return response.data;
  },

  /**
   * Get authorization URL for a provider
   * This initiates the OAuth2 flow - redirect user to this URL
   */
  async getAuthorizationUrl(
    provider: SocialProvider,
    redirectUri?: string,
    linkAccount?: boolean
  ): Promise<AuthorizationUrlResponse> {
    const params = new URLSearchParams();
    if (redirectUri) params.append('redirect_uri', redirectUri);
    if (linkAccount) params.append('link_account', 'true');
    
    const response = await apiClient.get<AuthorizationUrlResponse>(
      `/social-login/${provider}/authorize?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Handle OAuth2 callback from provider
   * Exchange authorization code for access token
   */
  async handleCallback(
    provider: SocialProvider,
    data: SocialAuthCallback
  ): Promise<SocialAuthResponse> {
    const response = await apiClient.post<SocialAuthResponse>(
      `/social-login/${provider}/callback`,
      data
    );
    return response.data;
  },

  /**
   * Get list of linked social accounts for current user
   */
  async getLinkedAccounts(): Promise<LinkedAccountsResponse> {
    const response = await apiClient.get<LinkedAccountsResponse>('/social-login/linked');
    return response.data;
  },

  /**
   * Unlink a social account
   */
  async unlinkAccount(provider: SocialProvider): Promise<UnlinkResponse> {
    const response = await apiClient.delete<UnlinkResponse>(`/social-login/linked/${provider}`);
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
};

export default socialLoginApi;
