import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sessionApi,
  Session,
  SessionListResponse,
  SessionRevokeResponse,
  LoginActivityListResponse,
  SecurityOverview,
} from './sessions';

// Mock the apiClient
vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from './client';

describe('sessionApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSession: Session = {
    id: 'session-123',
    device_id: 'device-456',
    ip_address: '192.168.1.100',
    browser: 'Chrome',
    browser_version: '120.0',
    os: 'macOS',
    os_version: '14.0',
    device_type: 'desktop',
    country: 'US',
    city: 'New York',
    is_active: true,
    is_current: true,
    login_method: 'password',
    mfa_verified: true,
    is_suspicious: false,
    created_at: '2025-01-01T00:00:00Z',
    last_active_at: '2025-01-15T10:30:00Z',
    expires_at: '2025-02-01T00:00:00Z',
    location_display: 'New York, US',
    device_display: 'Chrome on macOS',
  };

  const mockLoginActivity = {
    id: 'activity-123',
    ip_address: '192.168.1.100',
    location_display: 'New York, US',
    device_display: 'Chrome on macOS',
    login_method: 'password',
    mfa_verified: true,
    is_suspicious: false,
    suspicious_reason: null,
    created_at: '2025-01-15T10:00:00Z',
    terminated_at: null,
    termination_reason: null,
    session_duration_minutes: 30,
  };

  describe('listSessions', () => {
    it('should list all active sessions', async () => {
      const mockResponse: SessionListResponse = {
        sessions: [mockSession],
        current_session_id: 'session-123',
        total: 1,
      };
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockResponse });

      const result = await sessionApi.listSessions();

      expect(apiClient.get).toHaveBeenCalledWith('/sessions');
      expect(result).toEqual(mockResponse);
      expect(result.sessions).toHaveLength(1);
    });
  });

  describe('getSession', () => {
    it('should get a specific session by ID', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockSession });

      const result = await sessionApi.getSession('session-123');

      expect(apiClient.get).toHaveBeenCalledWith('/sessions/session-123');
      expect(result).toEqual(mockSession);
    });
  });

  describe('getCurrentSession', () => {
    it('should get current session info', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockSession });

      const result = await sessionApi.getCurrentSession();

      expect(apiClient.get).toHaveBeenCalledWith('/sessions/current');
      expect(result.is_current).toBe(true);
    });
  });

  describe('revokeSessions', () => {
    it('should revoke specific sessions', async () => {
      const mockResponse: SessionRevokeResponse = {
        revoked_count: 2,
        message: '2 sessions revoked successfully',
      };
      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

      const result = await sessionApi.revokeSessions({
        session_ids: ['session-456', 'session-789'],
      });

      expect(apiClient.post).toHaveBeenCalledWith('/sessions/revoke', {
        session_ids: ['session-456', 'session-789'],
      });
      expect(result.revoked_count).toBe(2);
    });

    it('should revoke all sessions except current', async () => {
      const mockResponse: SessionRevokeResponse = {
        revoked_count: 5,
        message: '5 sessions revoked successfully',
      };
      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

      const result = await sessionApi.revokeSessions({
        revoke_all: true,
        keep_current: true,
      });

      expect(apiClient.post).toHaveBeenCalledWith('/sessions/revoke', {
        revoke_all: true,
        keep_current: true,
      });
      expect(result.revoked_count).toBe(5);
    });
  });

  describe('revokeSession', () => {
    it('should revoke a single session by ID', async () => {
      const mockResponse: SessionRevokeResponse = {
        revoked_count: 1,
        message: 'Session revoked successfully',
      };
      vi.mocked(apiClient.delete).mockResolvedValue({ data: mockResponse });

      const result = await sessionApi.revokeSession('session-456');

      expect(apiClient.delete).toHaveBeenCalledWith('/sessions/session-456');
      expect(result.revoked_count).toBe(1);
    });
  });

  describe('getLoginActivity', () => {
    it('should get login activity with default params', async () => {
      const mockResponse: LoginActivityListResponse = {
        activities: [mockLoginActivity],
        total: 1,
        page: 1,
        per_page: 10,
        total_pages: 1,
      };
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockResponse });

      const result = await sessionApi.getLoginActivity();

      expect(apiClient.get).toHaveBeenCalledWith('/sessions/activity', { params: undefined });
      expect(result).toEqual(mockResponse);
    });

    it('should get login activity with custom params', async () => {
      const mockResponse: LoginActivityListResponse = {
        activities: [mockLoginActivity],
        total: 10,
        page: 2,
        per_page: 5,
        total_pages: 2,
      };
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockResponse });

      await sessionApi.getLoginActivity({
        page: 2,
        per_page: 5,
        days: 30,
        suspicious_only: true,
      });

      expect(apiClient.get).toHaveBeenCalledWith('/sessions/activity', {
        params: { page: 2, per_page: 5, days: 30, suspicious_only: true },
      });
    });

    it('should filter suspicious activity only', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { activities: [], total: 0, page: 1, per_page: 10, total_pages: 0 },
      });

      await sessionApi.getLoginActivity({ suspicious_only: true });

      expect(apiClient.get).toHaveBeenCalledWith('/sessions/activity', {
        params: { suspicious_only: true },
      });
    });
  });

  describe('getSecurityOverview', () => {
    it('should get security overview for current user', async () => {
      const mockOverview: SecurityOverview = {
        total_sessions: 5,
        active_sessions: 3,
        suspicious_sessions: 0,
        devices_count: 2,
        trusted_devices_count: 1,
        mfa_enabled: true,
        last_password_change: '2025-01-01T00:00:00Z',
        recent_suspicious_activities: [],
        login_methods_used: ['password', '2fa'],
        countries_logged_in: ['US', 'CA'],
      };
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockOverview });

      const result = await sessionApi.getSecurityOverview();

      expect(apiClient.get).toHaveBeenCalledWith('/sessions/security-overview');
      expect(result).toEqual(mockOverview);
      expect(result.mfa_enabled).toBe(true);
    });
  });

  describe('revokeAllOtherSessions', () => {
    it('should revoke all sessions except current', async () => {
      const mockResponse: SessionRevokeResponse = {
        revoked_count: 4,
        message: '4 sessions revoked successfully',
      };
      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

      const result = await sessionApi.revokeAllOtherSessions();

      expect(apiClient.post).toHaveBeenCalledWith('/sessions/revoke', {
        revoke_all: true,
        keep_current: true,
      });
      expect(result.revoked_count).toBe(4);
    });
  });

  describe('API path consistency', () => {
    it('should use /sessions base path for all endpoints', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockSession });
      vi.mocked(apiClient.post).mockResolvedValue({ data: { revoked_count: 1, message: 'ok' } });
      vi.mocked(apiClient.delete).mockResolvedValue({ data: { revoked_count: 1, message: 'ok' } });

      await sessionApi.listSessions();
      await sessionApi.getSession('session-123');
      await sessionApi.getCurrentSession();
      await sessionApi.getLoginActivity();
      await sessionApi.getSecurityOverview();
      await sessionApi.revokeSessions({ session_ids: ['session-123'] });
      await sessionApi.revokeSession('session-456');

      // All paths should be relative (baseURL handles /api/v1)
      expect(vi.mocked(apiClient.get).mock.calls[0][0]).toBe('/sessions');
      expect(vi.mocked(apiClient.get).mock.calls[1][0]).toBe('/sessions/session-123');
      expect(vi.mocked(apiClient.get).mock.calls[2][0]).toBe('/sessions/current');
      expect(vi.mocked(apiClient.get).mock.calls[3][0]).toBe('/sessions/activity');
      expect(vi.mocked(apiClient.get).mock.calls[4][0]).toBe('/sessions/security-overview');
      expect(vi.mocked(apiClient.post).mock.calls[0][0]).toBe('/sessions/revoke');
      expect(vi.mocked(apiClient.delete).mock.calls[0][0]).toBe('/sessions/session-456');
    });
  });
});
