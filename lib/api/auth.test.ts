import { authApi } from './auth';
import apiClient from './client';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client');

describe('Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('login', () => {
    it('should login with credentials', async () => {
      const mockResponse = {
        access_token: 'token123',
        refresh_token: 'refresh123',
        user: { id: '1', email: 'test@example.com' },
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockResponse } as any);

      const credentials = { email: 'test@example.com', password: 'password123' };
      const result = await authApi.login(credentials);

      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', credentials);
    });
  });

  describe('register', () => {
    it('should register new user', async () => {
      const mockResponse = {
        access_token: 'token123',
        refresh_token: 'refresh123',
        user: { id: '1', email: 'new@example.com' },
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockResponse } as any);

      const registerData = {
        email: 'new@example.com',
        password: 'password123',
        full_name: 'Test User',
        organization_name: 'Test Org',
      };

      const result = await authApi.register(registerData);

      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', registerData);
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user', async () => {
      const mockUser = { id: '1', email: 'test@example.com', full_name: 'Test User' };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockUser } as any);

      const result = await authApi.getCurrentUser();

      expect(result).toEqual(mockUser);
      expect(apiClient.get).toHaveBeenCalledWith('/auth/me');
    });
  });

  describe('logout', () => {
    it('should clear local storage on logout', async () => {
      localStorage.setItem('access_token', 'token123');
      localStorage.setItem('refresh_token', 'refresh123');
      localStorage.setItem('user', JSON.stringify({ id: 1 }));

      await authApi.logout();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token', async () => {
      const mockResponse = {
        access_token: 'new-token',
        refresh_token: 'new-refresh',
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await authApi.refreshToken('old-refresh-token');

      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh', {
        refresh_token: 'old-refresh-token',
      });
    });
  });

  describe('changePassword', () => {
    it('should change user password', async () => {
      const mockResponse = { message: 'Password changed successfully' };

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await authApi.changePassword('oldpass', 'newpass');

      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith('/auth/change-password', {
        current_password: 'oldpass',
        new_password: 'newpass',
      });
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const mockUser = {
        id: '1',
        email: 'updated@example.com',
        full_name: 'Updated Name',
      };

      vi.mocked(apiClient.put).mockResolvedValueOnce({ data: mockUser } as any);

      const updateData = { email: 'updated@example.com', full_name: 'Updated Name' };
      const result = await authApi.updateProfile(updateData);

      expect(result).toEqual(mockUser);
      expect(apiClient.put).toHaveBeenCalledWith('/auth/profile', updateData);
    });

    it('should update partial profile fields', async () => {
      const mockUser = { id: '1', email: 'test@example.com', first_name: 'New', last_name: 'Name' };

      vi.mocked(apiClient.put).mockResolvedValueOnce({ data: mockUser } as any);

      const result = await authApi.updateProfile({ first_name: 'New', last_name: 'Name' });

      expect(result).toEqual(mockUser);
      expect(apiClient.put).toHaveBeenCalledWith('/auth/profile', {
        first_name: 'New',
        last_name: 'Name',
      });
    });

    it('should update profile with bio and preferences', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        bio: 'Software developer passionate about APIs',
        preferences: '{"theme":"dark","language":"en"}',
        avatar_url: 'https://example.com/avatar.jpg',
      };

      vi.mocked(apiClient.put).mockResolvedValueOnce({ data: mockUser } as any);

      const updateData = {
        bio: 'Software developer passionate about APIs',
        preferences: '{"theme":"dark","language":"en"}',
        avatar_url: 'https://example.com/avatar.jpg',
      };
      const result = await authApi.updateProfile(updateData);

      expect(result).toEqual(mockUser);
      expect(apiClient.put).toHaveBeenCalledWith('/auth/profile', updateData);
    });

    it('should handle updating username and avatar_url', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser123',
        avatar_url: 'https://cdn.example.com/avatars/user123.jpg',
      };

      vi.mocked(apiClient.put).mockResolvedValueOnce({ data: mockUser } as any);

      const updateData = {
        username: 'testuser123',
        avatar_url: 'https://cdn.example.com/avatars/user123.jpg',
      };
      const result = await authApi.updateProfile(updateData);

      expect(result).toEqual(mockUser);
      expect(apiClient.put).toHaveBeenCalledWith('/auth/profile', updateData);
    });

    it('should handle all profile fields together', async () => {
      const mockUser = {
        id: '1',
        email: 'complete@example.com',
        username: 'completeuser',
        first_name: 'Complete',
        last_name: 'User',
        bio: 'Full stack developer with 10 years experience',
        preferences: '{"theme":"light","language":"fr","notifications":true}',
        avatar_url: 'https://example.com/complete-avatar.jpg',
      };

      vi.mocked(apiClient.put).mockResolvedValueOnce({ data: mockUser } as any);

      const updateData = {
        email: 'complete@example.com',
        username: 'completeuser',
        first_name: 'Complete',
        last_name: 'User',
        bio: 'Full stack developer with 10 years experience',
        preferences: '{"theme":"light","language":"fr","notifications":true}',
        avatar_url: 'https://example.com/complete-avatar.jpg',
      };
      const result = await authApi.updateProfile(updateData);

      expect(result).toEqual(mockUser);
      expect(apiClient.put).toHaveBeenCalledWith('/auth/profile', updateData);
    });
  });
});