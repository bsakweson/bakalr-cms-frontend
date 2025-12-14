import { describe, it, expect, beforeEach, vi } from 'vitest';
import { roleApi } from './roles';
import { apiClient } from './client';
import type {
  RoleListResponse,
  PermissionListResponse,
  CreateRoleRequest,
  UpdateRoleRequest,
  RoleResponse,
} from '@/types';

vi.mock('./client');

describe('roleApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listRoles', () => {
    it('should fetch roles with default pagination', async () => {
      const mockResponse: RoleListResponse = {
        roles: [
          {
            id: '1',
            name: 'Admin',
            description: 'Administrator role',
            organization_id: "1",
            is_system_role: true,
            level: 100,
            permissions: ['content:read', 'content:write'],
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
          },
          {
            id: '2',
            name: 'Editor',
            description: 'Editor role',
            organization_id: "1",
            is_system_role: false,
            level: 50,
            permissions: ['content:read', 'content:write'],
            created_at: '2025-01-02T00:00:00Z',
            updated_at: '2025-01-02T00:00:00Z',
          },
        ],
        total: 2,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await roleApi.listRoles();

      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith('/roles/', { params: { skip: 0, limit: 100 } });
    });

    it('should fetch roles with custom pagination', async () => {
      const mockResponse: RoleListResponse = {
        roles: [],
        total: 50,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await roleApi.listRoles(20, 10);

      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith('/roles/', { params: { skip: 20, limit: 10 } });
    });

    it('should handle error when fetching roles', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Network error'));

      await expect(roleApi.listRoles()).rejects.toThrow('Network error');
    });
  });

  describe('listPermissions', () => {
    it('should fetch all permissions without category filter', async () => {
      const mockResponse: PermissionListResponse = {
        permissions: [
          {
            id: '1',
            name: 'Read Content',
            description: 'View content',
            category: 'content',
          },
          {
            id: '2',
            name: 'Write Content',
            description: 'Create and edit content',
            category: 'content',
          },
        ],
        total: 2,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await roleApi.listPermissions();

      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith('/roles/permissions', { params: {} });
    });

    it('should fetch permissions filtered by category', async () => {
      const mockResponse: PermissionListResponse = {
        permissions: [
          {
            id: '1',
            name: 'Read Content',
            description: 'View content',
            category: 'content',
          },
        ],
        total: 1,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await roleApi.listPermissions('content');

      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith('/roles/permissions', { params: { category: 'content' } });
    });

    it('should handle error when fetching permissions', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Network error'));

      await expect(roleApi.listPermissions()).rejects.toThrow('Network error');
    });
  });

  describe('getRole', () => {
    it('should fetch role by id successfully', async () => {
      const mockRole: RoleResponse = {
        id: '1',
        name: 'Admin',
        description: 'Administrator role',
        permissions: [
          { id: '1', name: 'Read Content', category: 'content' },
          { id: '2', name: 'Write Content', category: 'content' },
          { id: '3', name: 'Manage Users', category: 'users' },
        ],
        is_system_role: true,
        level: 100,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockRole } as any);

      const result = await roleApi.getRole("1");

      expect(result).toEqual(mockRole);
      expect(apiClient.get).toHaveBeenCalledWith('/roles/1');
    });

    it('should handle not found error', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Role not found'));

      await expect(roleApi.getRole("999")).rejects.toThrow('Role not found');
    });
  });

  describe('createRole', () => {
    it('should create role successfully', async () => {
      const createData: CreateRoleRequest = {
        name: 'Content Manager',
        description: 'Manages content',
        permission_ids: ["1", "2"],
      };

      const mockCreatedRole: RoleResponse = {
        id: '3',
        name: 'Content Manager',
        description: 'Manages content',
        permissions: [
          { id: '1', name: 'Read Content', category: 'content' },
          { id: '2', name: 'Write Content', category: 'content' },
        ],
        is_system_role: false,
        level: 30,
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockCreatedRole } as any);

      const result = await roleApi.createRole(createData);

      expect(result).toEqual(mockCreatedRole);
      expect(apiClient.post).toHaveBeenCalledWith('/roles/', createData);
    });

    it('should handle duplicate role name error', async () => {
      const createData: CreateRoleRequest = {
        name: 'Admin',
        permission_ids: [],
      };

      vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Role name already exists'));

      await expect(roleApi.createRole(createData)).rejects.toThrow('Role name already exists');
    });

    it('should handle invalid permissions error', async () => {
      const createData: CreateRoleRequest = {
        name: 'Bad Role',
        permission_ids: ['999'],
      };

      vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Invalid permissions'));

      await expect(roleApi.createRole(createData)).rejects.toThrow('Invalid permissions');
    });
  });

  describe('updateRole', () => {
    it('should update role successfully', async () => {
      const updateData: UpdateRoleRequest = {
        description: 'Updated description',
        permission_ids: ["1", "2", "4"],
      };

      const mockUpdatedRole: RoleResponse = {
        id: '3',
        name: 'Content Manager',
        description: 'Updated description',
        permissions: [
          { id: '1', name: 'Read Content', category: 'content' },
          { id: '2', name: 'Write Content', category: 'content' },
          { id: '4', name: 'Delete Content', category: 'content' },
        ],
        is_system_role: false,
        level: 30,
      };

      vi.mocked(apiClient.put).mockResolvedValueOnce({ data: mockUpdatedRole } as any);

      const result = await roleApi.updateRole("3", updateData);

      expect(result).toEqual(mockUpdatedRole);
      expect(apiClient.put).toHaveBeenCalledWith('/roles/3', updateData);
    });

    it('should handle system role modification error', async () => {
      const updateData: UpdateRoleRequest = {
        permission_ids: [],
      };

      vi.mocked(apiClient.put).mockRejectedValueOnce(new Error('Cannot modify system role'));

      await expect(roleApi.updateRole("1", updateData)).rejects.toThrow('Cannot modify system role');
    });
  });

  describe('deleteRole', () => {
    it('should delete role successfully', async () => {
      const mockResponse = { message: 'Role deleted successfully' };

      vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await roleApi.deleteRole("3");

      expect(result).toEqual(mockResponse);
      expect(apiClient.delete).toHaveBeenCalledWith('/roles/3');
    });

    it('should handle system role deletion error', async () => {
      vi.mocked(apiClient.delete).mockRejectedValueOnce(new Error('Cannot delete system role'));

      await expect(roleApi.deleteRole("1")).rejects.toThrow('Cannot delete system role');
    });

    it('should handle role in use error', async () => {
      vi.mocked(apiClient.delete).mockRejectedValueOnce(new Error('Role is assigned to users'));

      await expect(roleApi.deleteRole("2")).rejects.toThrow('Role is assigned to users');
    });
  });
});
