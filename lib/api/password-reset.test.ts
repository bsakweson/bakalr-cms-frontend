import {
  requestPasswordReset,
  confirmPasswordReset,
  validateResetToken,
} from './password-reset';
import apiClient from './client';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client');

describe('Password Reset API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('requestPasswordReset', () => {
    it('should request password reset email', async () => {
      const mockResponse = {
        message: 'Password reset email sent successfully',
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await requestPasswordReset('user@example.com');

      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith('/auth/password-reset/request', {
        email: 'user@example.com',
      });
    });

    it('should handle non-existent email gracefully', async () => {
      const mockResponse = {
        message: 'If the email exists, a reset link has been sent',
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await requestPasswordReset('nonexistent@example.com');

      expect(result.message).toContain('reset link');
    });

    it('should handle API errors', async () => {
      const mockError = new Error('Service unavailable');
      vi.mocked(apiClient.post).mockRejectedValueOnce(mockError);

      await expect(requestPasswordReset('user@example.com')).rejects.toThrow('Service unavailable');
    });

    it('should handle invalid email format', async () => {
      const mockError = new Error('Invalid email format');
      vi.mocked(apiClient.post).mockRejectedValueOnce(mockError);

      await expect(requestPasswordReset('invalid-email')).rejects.toThrow('Invalid email format');
    });
  });

  describe('confirmPasswordReset', () => {
    it('should confirm password reset with valid token', async () => {
      const mockResponse = {
        message: 'Password has been reset successfully',
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await confirmPasswordReset('valid-token-123', 'NewSecurePassword123!');

      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith('/auth/password-reset/confirm', {
        token: 'valid-token-123',
        new_password: 'NewSecurePassword123!',
      });
    });

    it('should handle expired token', async () => {
      const mockError = new Error('Token has expired');
      vi.mocked(apiClient.post).mockRejectedValueOnce(mockError);

      await expect(
        confirmPasswordReset('expired-token', 'NewPassword123!')
      ).rejects.toThrow('Token has expired');
    });

    it('should handle invalid token', async () => {
      const mockError = new Error('Invalid or malformed token');
      vi.mocked(apiClient.post).mockRejectedValueOnce(mockError);

      await expect(
        confirmPasswordReset('invalid-token', 'NewPassword123!')
      ).rejects.toThrow('Invalid or malformed token');
    });

    it('should handle weak password rejection', async () => {
      const mockError = new Error('Password does not meet requirements');
      vi.mocked(apiClient.post).mockRejectedValueOnce(mockError);

      await expect(
        confirmPasswordReset('valid-token', 'weak')
      ).rejects.toThrow('Password does not meet requirements');
    });

    it('should accept strong passwords', async () => {
      const mockResponse = {
        message: 'Password reset successful',
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockResponse } as any);

      const strongPassword = 'MyV3ry$tr0ng!P@ssw0rd';
      const result = await confirmPasswordReset('token', strongPassword);

      expect(result.message).toContain('successful');
    });
  });

  describe('validateResetToken', () => {
    it('should validate valid token', async () => {
      const mockResponse = {
        valid: true,
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await validateResetToken('valid-token-123');

      expect(result.valid).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith('/auth/password-reset/validate', {
        token: 'valid-token-123',
      });
    });

    it('should invalidate expired token', async () => {
      const mockResponse = {
        valid: false,
        message: 'Token has expired',
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await validateResetToken('expired-token');

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Token has expired');
    });

    it('should invalidate malformed token', async () => {
      const mockResponse = {
        valid: false,
        message: 'Invalid token format',
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await validateResetToken('bad-token');

      expect(result.valid).toBe(false);
    });

    it('should handle API errors during validation', async () => {
      const mockError = {
        response: {
          data: {
            detail: 'Validation service error',
          },
        },
      };
      vi.mocked(apiClient.post).mockRejectedValueOnce(mockError);

      const result = await validateResetToken('token');

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Validation service error');
    });

    it('should return false on network error', async () => {
      const mockError = new Error('Network error');
      vi.mocked(apiClient.post).mockRejectedValueOnce(mockError);

      const result = await validateResetToken('token');

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Invalid or expired token');
    });
  });
});
