/**
 * Session Management API client
 * Supports session listing, revocation, and security monitoring
 */

import { apiClient } from './client';

// Types
export interface Session {
  id: string;
  device_id: string | null;
  ip_address: string;
  browser: string | null;
  browser_version: string | null;
  os: string | null;
  os_version: string | null;
  device_type: string | null;
  country: string | null;
  city: string | null;
  is_active: boolean;
  is_current: boolean;
  login_method: string;
  mfa_verified: boolean;
  is_suspicious: boolean;
  created_at: string;
  last_active_at: string;
  expires_at: string;
  location_display: string;
  device_display: string;
}

export interface SessionListResponse {
  sessions: Session[];
  current_session_id: string;
  total: number;
}

export interface LoginActivity {
  id: string;
  ip_address: string;
  location_display: string;
  device_display: string;
  login_method: string;
  mfa_verified: boolean;
  is_suspicious: boolean;
  suspicious_reason: string | null;
  created_at: string;
  terminated_at: string | null;
  termination_reason: string | null;
  session_duration_minutes: number | null;
}

export interface LoginActivityListResponse {
  activities: LoginActivity[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface SecurityOverview {
  total_sessions: number;
  active_sessions: number;
  suspicious_sessions: number;
  devices_count: number;
  trusted_devices_count: number;
  mfa_enabled: boolean;
  last_password_change: string | null;
  recent_suspicious_activities: LoginActivity[];
  login_methods_used: string[];
  countries_logged_in: string[];
}

export interface SessionRevokeRequest {
  session_ids?: string[];
  revoke_all?: boolean;
  keep_current?: boolean;
}

export interface SessionRevokeResponse {
  revoked_count: number;
  message: string;
}

// API Client
export const sessionApi = {
  /**
   * List all active sessions for the current user
   */
  async listSessions(): Promise<SessionListResponse> {
    const response = await apiClient.get<SessionListResponse>('/sessions');
    return response.data;
  },

  /**
   * Get a specific session by ID
   */
  async getSession(sessionId: string): Promise<Session> {
    const response = await apiClient.get<Session>(`/sessions/${sessionId}`);
    return response.data;
  },

  /**
   * Get current session info
   */
  async getCurrentSession(): Promise<Session> {
    const response = await apiClient.get<Session>('/sessions/current');
    return response.data;
  },

  /**
   * Revoke specific sessions or all sessions
   */
  async revokeSessions(data: SessionRevokeRequest): Promise<SessionRevokeResponse> {
    const response = await apiClient.post<SessionRevokeResponse>('/sessions/revoke', data);
    return response.data;
  },

  /**
   * Revoke a single session by ID
   */
  async revokeSession(sessionId: string): Promise<SessionRevokeResponse> {
    const response = await apiClient.delete<SessionRevokeResponse>(`/sessions/${sessionId}`);
    return response.data;
  },

  /**
   * Get login activity history
   */
  async getLoginActivity(params?: {
    page?: number;
    per_page?: number;
    days?: number;
    suspicious_only?: boolean;
  }): Promise<LoginActivityListResponse> {
    const response = await apiClient.get<LoginActivityListResponse>('/sessions/activity', {
      params,
    });
    return response.data;
  },

  /**
   * Get security overview for current user
   */
  async getSecurityOverview(): Promise<SecurityOverview> {
    const response = await apiClient.get<SecurityOverview>('/sessions/security-overview');
    return response.data;
  },

  /**
   * Revoke all sessions except current
   */
  async revokeAllOtherSessions(): Promise<SessionRevokeResponse> {
    return this.revokeSessions({
      revoke_all: true,
      keep_current: true,
    });
  },
};

export default sessionApi;
