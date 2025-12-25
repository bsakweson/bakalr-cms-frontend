import { userApi } from './users';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the apiClient
vi.mock('./client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import apiClient from './client';

describe('User API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listUsers', () => {
    it('should fetch users with default skip and limit', async () => {
      const mockResponse = {
        users: [
          {
            id: '1',
            email: 'admin@example.com',
            full_name: 'Admin User',
            is_active: true,
            roles: ['admin'],
          },
          {
            id: '2',
            email: 'editor@example.com',
            full_name: 'Editor User',
            is_active: true,
            roles: ['editor'],
          },
        ],
        total: 2,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await userApi.listUsers();

      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith('/users/?skip=0&limit=100');
      expect(result.users).toHaveLength(2);
    });

    it('should fetch users with custom skip and limit', async () => {
      const mockResponse = {
        users: [
          {
            id: '21',
            email: 'user21@example.com',
            full_name: 'User Twenty One',
            is_active: true,
            roles: ['viewer'],
          },
        ],
        total: 50,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await userApi.listUsers(20, 10);

      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith('/users/?skip=20&limit=10');
    });

    it('should handle empty user list', async () => {
      const mockResponse = {
        users: [],
        total: 0,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await userApi.listUsers();

      expect(result.users).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle API errors', async () => {
      const mockError = new Error('Failed to fetch users');
      vi.mocked(apiClient.get).mockRejectedValueOnce(mockError);

      await expect(userApi.listUsers()).rejects.toThrow('Failed to fetch users');
    });
  });

  describe('inviteUser', () => {
    it('should invite a new user with email, full_name and role_id', async () => {
      const mockResponse = {
        user_id: '3',
        email: 'newuser@example.com',
        message: 'Invitation sent successfully',
      };

      const inviteData = {
        email: 'newuser@example.com',
        full_name: 'New User',
        role_id: '2',
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await userApi.inviteUser(inviteData);

      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith('/users/invite', inviteData);
      expect(result.user_id).toBe("3");
    });

    it('should invite user with send_invite_email option', async () => {
      const mockResponse = {
        user_id: '4',
        email: 'multi@example.com',
        message: 'Invitation sent',
      };

      const inviteData = {
        email: 'multi@example.com',
        full_name: 'Multi Role User',
        role_id: '2',
        send_invite_email: true,
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await userApi.inviteUser(inviteData);

      expect(result.user_id).toBe("4");
      expect(apiClient.post).toHaveBeenCalledWith('/users/invite', inviteData);
    });

    it('should handle invite errors', async () => {
      const mockError = new Error('User already exists');
      vi.mocked(apiClient.post).mockRejectedValueOnce(mockError);

      const inviteData = {
        email: 'existing@example.com',
        full_name: 'Existing User',
        role_id: '3',
      };

      await expect(userApi.inviteUser(inviteData)).rejects.toThrow('User already exists');
    });
  });

  describe('updateUserRole', () => {
    it('should update user role successfully', async () => {
      const mockResponse = {
        message: 'User role updated successfully',
      };

      const updateData = {
        role_id: '1',
      };

      vi.mocked(apiClient.put).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await userApi.updateUserRole("5", updateData);

      expect(result).toEqual(mockResponse);
      expect(apiClient.put).toHaveBeenCalledWith('/users/5/role', updateData);
    });

    it('should change user from editor to viewer', async () => {
      const mockResponse = {
        message: 'Role updated to viewer',
      };

      const updateData = {
        role_id: '3',
      };

      vi.mocked(apiClient.put).mockResolvedValueOnce({ data: mockResponse } as any);

      await userApi.updateUserRole("10", updateData);

      expect(apiClient.put).toHaveBeenCalledWith('/users/10/role', updateData);
    });

    it('should handle update role errors', async () => {
      const mockError = new Error('User not found');
      vi.mocked(apiClient.put).mockRejectedValueOnce(mockError);

      const updateData = { role_id: '1' };

      await expect(userApi.updateUserRole("999", updateData)).rejects.toThrow('User not found');
    });
  });

  describe('removeUser', () => {
    it('should remove user successfully', async () => {
      const mockResponse = {
        message: 'User removed from organization',
      };

      vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await userApi.removeUser("7");

      expect(result).toEqual(mockResponse);
      expect(apiClient.delete).toHaveBeenCalledWith('/users/7');
    });

    it('should handle remove user errors', async () => {
      const mockError = new Error('Cannot remove last admin');
      vi.mocked(apiClient.delete).mockRejectedValueOnce(mockError);

      await expect(userApi.removeUser("1")).rejects.toThrow('Cannot remove last admin');
      expect(apiClient.delete).toHaveBeenCalledWith('/users/1');
    });

    it('should handle non-existent user removal', async () => {
      const mockError = new Error('User not found');
      vi.mocked(apiClient.delete).mockRejectedValueOnce(mockError);

      await expect(userApi.removeUser("999")).rejects.toThrow('User not found');
    });
  });

  describe('listRoles', () => {
    it('should fetch all available roles', async () => {
      const mockResponse = {
        roles: [
          { id: '1', name: 'admin', description: 'Administrator', permissions: [] },
          { id: '2', name: 'editor', description: 'Editor', permissions: [] },
          { id: '3', name: 'viewer', description: 'Viewer', permissions: [] },
        ],
        total: 3,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await userApi.listRoles();

      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith('/roles/');
      expect(result.roles).toHaveLength(3);
      expect(result.total).toBe(3);
    });

    it('should handle empty roles list', async () => {
      const mockResponse = {
        roles: [],
        total: 0,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await userApi.listRoles();

      expect(result.roles).toHaveLength(0);
    });

    it('should handle API errors when fetching roles', async () => {
      const mockError = new Error('Failed to fetch roles');
      vi.mocked(apiClient.get).mockRejectedValueOnce(mockError);

      await expect(userApi.listRoles()).rejects.toThrow('Failed to fetch roles');
    });
  });
});
