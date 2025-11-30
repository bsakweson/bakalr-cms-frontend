import apiClient from './client';
import { LoginRequest, LoginResponse, RegisterRequest, User } from '@/types';

export const authApi = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  async register(data: RegisterRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/register', data);
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  async logout(): Promise<void> {
    // Clear local storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await apiClient.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  async updateProfile(data: { 
    first_name?: string; 
    last_name?: string; 
    username?: string; 
    email?: string;
    bio?: string;
    preferences?: string;
    avatar_url?: string;
  }): Promise<User> {
    const response = await apiClient.put<User>('/auth/profile', data);
    return response.data;
  },

  // Two-Factor Authentication
  async get2FAStatus(): Promise<{ 
    enabled: boolean; 
    verified: boolean;
    backup_codes_remaining: number;
    required: boolean;
  }> {
    const response = await apiClient.get('/auth/2fa/status');
    return response.data;
  },

  async enable2FA(): Promise<{ qr_code: string; secret: string; backup_codes: string[] }> {
    const response = await apiClient.post('/auth/2fa/enable');
    return response.data;
  },

  async verifySetup2FA(token: string): Promise<{ message: string }> {
    const response = await apiClient.post('/auth/2fa/verify-setup', { token });
    return response.data;
  },

  async disable2FA(password: string): Promise<{ message: string }> {
    const response = await apiClient.post('/auth/2fa/disable', { password });
    return response.data;
  },

  async verify2FA(token: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/2fa/verify', { token });
    return response.data;
  },

  async regenerateBackupCodes(password: string): Promise<{ backup_codes: string[] }> {
    const response = await apiClient.post('/auth/2fa/backup-codes/regenerate', { password });
    return response.data;
  },

  // Email Verification
  async verifyEmail(token: string): Promise<{ message: string; email?: string }> {
    const response = await apiClient.post(`/auth/verify-email/${token}`);
    return response.data;
  },

  async resendVerification(): Promise<{ message: string }> {
    const response = await apiClient.post('/auth/resend-verification');
    return response.data;
  },
};