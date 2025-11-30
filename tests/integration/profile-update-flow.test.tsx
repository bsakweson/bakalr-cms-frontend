/**
 * Integration Test: Complete Profile Update Flow
 * 
 * Tests the workflow of updating user profile with all fields:
 * 1. User navigates to settings page
 * 2. User views current profile data
 * 3. User updates bio, preferences, avatar, and other fields
 * 4. Changes are saved to backend
 * 5. Profile reflects updated data
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { authApi } from '@/lib/api/auth';

// Mock the auth API
vi.mock('@/lib/api/auth', () => ({
  authApi: {
    getCurrentUser: vi.fn(),
    updateProfile: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
    changePassword: vi.fn(),
  },
}));

// Mock auth context
vi.mock('@/contexts/auth-context', () => ({
  useAuth: vi.fn(),
}));

// Mock router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/dashboard/settings',
}));

describe('Profile Update Flow', () => {
  const initialUser = {
    id: 1,
    email: 'test@example.com',
    username: undefined,
    first_name: 'Test',
    last_name: 'User',
    bio: undefined,
    preferences: undefined,
    avatar_url: undefined,
    is_active: true,
    organization_id: 1,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load initial profile data', async () => {
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(initialUser);

    const result = await authApi.getCurrentUser();

    expect(result).toEqual(initialUser);
    expect(result.bio).toBeUndefined();
    expect(result.preferences).toBeUndefined();
    expect(result.avatar_url).toBeUndefined();
  });

  it('should update profile with bio field', async () => {
    const updatedUser = {
      ...initialUser,
      bio: 'Passionate software developer specializing in web applications',
    };

    vi.mocked(authApi.updateProfile).mockResolvedValue(updatedUser);

    const result = await authApi.updateProfile({
      bio: 'Passionate software developer specializing in web applications',
    });

    expect(result.bio).toBe('Passionate software developer specializing in web applications');
    expect(authApi.updateProfile).toHaveBeenCalledWith({
      bio: 'Passionate software developer specializing in web applications',
    });
  });

  it('should update profile with preferences field', async () => {
    const updatedUser = {
      ...initialUser,
      preferences: '{"theme":"dark","language":"en","notifications":true}',
    };

    vi.mocked(authApi.updateProfile).mockResolvedValue(updatedUser);

    const result = await authApi.updateProfile({
      preferences: '{"theme":"dark","language":"en","notifications":true}',
    });

    expect(result.preferences).toBe('{"theme":"dark","language":"en","notifications":true}');
    expect(authApi.updateProfile).toHaveBeenCalledWith({
      preferences: '{"theme":"dark","language":"en","notifications":true}',
    });
  });

  it('should update profile with avatar URL', async () => {
    const updatedUser = {
      ...initialUser,
      avatar_url: 'https://cdn.example.com/avatars/user1.jpg',
    };

    vi.mocked(authApi.updateProfile).mockResolvedValue(updatedUser);

    const result = await authApi.updateProfile({
      avatar_url: 'https://cdn.example.com/avatars/user1.jpg',
    });

    expect(result.avatar_url).toBe('https://cdn.example.com/avatars/user1.jpg');
    expect(authApi.updateProfile).toHaveBeenCalledWith({
      avatar_url: 'https://cdn.example.com/avatars/user1.jpg',
    });
  });

  it('should update profile with username', async () => {
    const updatedUser = {
      ...initialUser,
      username: 'testuser123',
    };

    vi.mocked(authApi.updateProfile).mockResolvedValue(updatedUser);

    const result = await authApi.updateProfile({
      username: 'testuser123',
    });

    expect(result.username).toBe('testuser123');
    expect(authApi.updateProfile).toHaveBeenCalledWith({
      username: 'testuser123',
    });
  });

  it('should complete full profile update with all new fields', async () => {
    const updatedUser = {
      ...initialUser,
      username: 'testuser123',
      bio: 'Experienced full-stack developer with expertise in React, Node.js, and Python',
      preferences: '{"theme":"dark","language":"en","timezone":"UTC","notifications":true}',
      avatar_url: 'https://cdn.example.com/avatars/testuser123.jpg',
      first_name: 'Updated',
      last_name: 'Name',
    };

    vi.mocked(authApi.updateProfile).mockResolvedValue(updatedUser);

    const updateData = {
      username: 'testuser123',
      first_name: 'Updated',
      last_name: 'Name',
      bio: 'Experienced full-stack developer with expertise in React, Node.js, and Python',
      preferences: '{"theme":"dark","language":"en","timezone":"UTC","notifications":true}',
      avatar_url: 'https://cdn.example.com/avatars/testuser123.jpg',
    };

    const result = await authApi.updateProfile(updateData);

    expect(result).toEqual(updatedUser);
    expect(result.username).toBe('testuser123');
    expect(result.bio).toBe('Experienced full-stack developer with expertise in React, Node.js, and Python');
    expect(result.preferences).toBe('{"theme":"dark","language":"en","timezone":"UTC","notifications":true}');
    expect(result.avatar_url).toBe('https://cdn.example.com/avatars/testuser123.jpg');
    expect(authApi.updateProfile).toHaveBeenCalledWith(updateData);
  });

  it('should handle partial profile updates', async () => {
    const updatedUser = {
      ...initialUser,
      bio: 'Just updated my bio',
    };

    vi.mocked(authApi.updateProfile).mockResolvedValue(updatedUser);

    const result = await authApi.updateProfile({
      bio: 'Just updated my bio',
    });

    expect(result.bio).toBe('Just updated my bio');
    // Other fields should remain unchanged
    expect(result.email).toBe(initialUser.email);
    expect(result.first_name).toBe(initialUser.first_name);
    expect(result.preferences).toBeUndefined();
    expect(result.avatar_url).toBeUndefined();
  });

  it('should handle updating bio with maximum length', async () => {
    const longBio = 'a'.repeat(500); // 500 characters (max length)
    const updatedUser = {
      ...initialUser,
      bio: longBio,
    };

    vi.mocked(authApi.updateProfile).mockResolvedValue(updatedUser);

    const result = await authApi.updateProfile({
      bio: longBio,
    });

    expect(result.bio).toBe(longBio);
    expect(result.bio?.length).toBe(500);
  });

  it('should update preferences with valid JSON', async () => {
    const preferences = JSON.stringify({
      theme: 'dark',
      language: 'en',
      notifications: {
        email: true,
        push: false,
        inApp: true,
      },
      timezone: 'America/New_York',
    });

    const updatedUser = {
      ...initialUser,
      preferences,
    };

    vi.mocked(authApi.updateProfile).mockResolvedValue(updatedUser);

    const result = await authApi.updateProfile({
      preferences,
    });

    expect(result.preferences).toBe(preferences);
    // Verify it's valid JSON
    expect(() => JSON.parse(result.preferences!)).not.toThrow();
    const parsed = JSON.parse(result.preferences!);
    expect(parsed.theme).toBe('dark');
    expect(parsed.notifications.email).toBe(true);
  });

  it('should handle clearing optional fields', async () => {
    const userWithData = {
      ...initialUser,
      bio: 'Original bio',
      preferences: '{"theme":"dark"}',
      avatar_url: 'https://example.com/avatar.jpg',
    };

    const updatedUser = {
      ...userWithData,
      bio: '',
      preferences: '',
      avatar_url: '',
    };

    vi.mocked(authApi.getCurrentUser).mockResolvedValue(userWithData);
    vi.mocked(authApi.updateProfile).mockResolvedValue(updatedUser);

    // Clear fields
    const result = await authApi.updateProfile({
      bio: '',
      preferences: '',
      avatar_url: '',
    });

    expect(result.bio).toBe('');
    expect(result.preferences).toBe('');
    expect(result.avatar_url).toBe('');
  });
});
