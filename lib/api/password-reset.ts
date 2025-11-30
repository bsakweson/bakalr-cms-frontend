/**
 * Password Reset API Client
 * Handles forgot password and reset password flows
 */

import apiClient from './client';

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
}

export interface PasswordResetResponse {
  message: string;
  email?: string;
}

export interface TokenValidationResponse {
  valid: boolean;
  message?: string;
}

/**
 * Request password reset email
 */
export async function requestPasswordReset(email: string): Promise<PasswordResetResponse> {
  const response = await apiClient.post('/auth/password-reset/request', { email });
  return response.data;
}

/**
 * Confirm password reset with token
 */
export async function confirmPasswordReset(token: string, newPassword: string): Promise<PasswordResetResponse> {
  const response = await apiClient.post('/auth/password-reset/confirm', {
    token,
    new_password: newPassword,
  });
  return response.data;
}

/**
 * Validate reset token
 */
export async function validateResetToken(token: string): Promise<TokenValidationResponse> {
  try {
    const response = await apiClient.post('/auth/password-reset/validate', { token });
    return response.data;
  } catch (error: any) {
    return {
      valid: false,
      message: error.response?.data?.detail || 'Invalid or expired token',
    };
  }
}

export const passwordResetApi = {
  requestPasswordReset,
  confirmPasswordReset,
  validateResetToken,
};
