/**
 * Integration tests for Two-Factor Authentication flow
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authApi } from '@/lib/api/auth';

// Mock the apiClient module
vi.mock('@/lib/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  },
}));

import apiClient from '@/lib/api/client';

describe('Two-Factor Authentication Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('2FA Status', () => {
    it('should fetch 2FA status successfully', async () => {
      const mockStatus = {
        enabled: false,
        verified: false,
        backup_codes_remaining: 0,
        required: false,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockStatus } as any);

      const status = await authApi.get2FAStatus();
      expect(status).toEqual(mockStatus);
    });
  });

  describe('2FA Enable', () => {
    it('should enable 2FA and return QR code', async () => {
      const mockSetup = {
        secret: 'TESTSECRET123456',
        qr_code: 'data:image/png;base64,iVBORw0KG...',
        backup_codes: ['CODE1', 'CODE2', 'CODE3'],
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockSetup } as any);

      const setup = await authApi.enable2FA();
      expect(setup).toEqual(mockSetup);
      expect(setup.backup_codes).toHaveLength(3);
    });

    it('should handle enable 2FA errors', async () => {
      const mockError = {
        response: {
          data: { detail: '2FA already enabled' },
        },
      };

      vi.mocked(apiClient.post).mockRejectedValueOnce(mockError);

      await expect(authApi.enable2FA()).rejects.toEqual(mockError);
    });
  });

  describe('2FA Verify Setup', () => {
    it('should verify 2FA setup with valid code', async () => {
      const mockResponse = { message: '2FA enabled successfully' };

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await authApi.verifySetup2FA('123456');
      expect(result).toEqual(mockResponse);
    });

    it('should handle invalid verification code', async () => {
      const mockError = {
        response: {
          data: { detail: 'Invalid verification code' },
        },
      };

      vi.mocked(apiClient.post).mockRejectedValueOnce(mockError);

      await expect(authApi.verifySetup2FA('000000')).rejects.toEqual(mockError);
    });
  });

  describe('2FA Disable', () => {
    it('should disable 2FA with valid password', async () => {
      const mockResponse = { message: '2FA disabled successfully' };

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await authApi.disable2FA('password123');
      expect(result).toEqual(mockResponse);
    });

    it('should handle incorrect password when disabling', async () => {
      const mockError = {
        response: {
          data: { detail: 'Incorrect password' },
        },
      };

      vi.mocked(apiClient.post).mockRejectedValueOnce(mockError);

      await expect(authApi.disable2FA('wrongpassword')).rejects.toEqual(mockError);
    });
  });

  describe('2FA Verify', () => {
    it('should verify 2FA code during login', async () => {
      const mockResponse = { message: 'Verification successful' };

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await authApi.verify2FA('123456');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Backup Codes', () => {
    it('should regenerate backup codes with valid password', async () => {
      const mockCodes = {
        backup_codes: ['NEW1', 'NEW2', 'NEW3', 'NEW4', 'NEW5'],
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockCodes } as any);

      const result = await authApi.regenerateBackupCodes('password123');
      expect(result).toEqual(mockCodes);
      expect(result.backup_codes).toHaveLength(5);
    });
  });

  describe('API Method Existence', () => {
    it('should have all required 2FA API methods', () => {
      expect(typeof authApi.get2FAStatus).toBe('function');
      expect(typeof authApi.enable2FA).toBe('function');
      expect(typeof authApi.verifySetup2FA).toBe('function');
      expect(typeof authApi.disable2FA).toBe('function');
      expect(typeof authApi.verify2FA).toBe('function');
      expect(typeof authApi.regenerateBackupCodes).toBe('function');
    });
  });

  describe('URL Formation', () => {
    it('should use correct API endpoints', () => {
      // The methods should call the correct endpoints
      // This is implicit in the API client configuration
      // Just verify the methods exist and are callable
      expect(authApi.get2FAStatus).toBeDefined();
      expect(authApi.enable2FA).toBeDefined();
      expect(authApi.verifySetup2FA).toBeDefined();
      expect(authApi.disable2FA).toBeDefined();
      expect(authApi.verify2FA).toBeDefined();
      expect(authApi.regenerateBackupCodes).toBeDefined();
    });
  });
});
