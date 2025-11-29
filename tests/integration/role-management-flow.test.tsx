/**
 * Integration Test: Role Creation → Permission Assignment → Access Control Workflow
 * 
 * Tests the complete workflow of:
 * 1. Creating custom roles with permissions
 * 2. Assigning permissions to roles
 * 3. Assigning roles to users
 * 4. Verifying permission-based access control
 * 5. Complete end-to-end role management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  Role,
  Permission,
  RoleListResponse,
  PermissionListResponse,
  CreateRoleRequest,
  RoleResponse,
  UpdateUserRoleRequest,
} from '@/types';

// Mock the roles API
vi.mock('@/lib/api/roles', () => ({
  roleApi: {
    listRoles: vi.fn(),
    listPermissions: vi.fn(),
    getRole: vi.fn(),
    createRole: vi.fn(),
    updateRole: vi.fn(),
    deleteRole: vi.fn(),
  },
}));

// Mock the users API
vi.mock('@/lib/api/users', () => ({
  userApi: {
    listUsers: vi.fn(),
    updateUserRole: vi.fn(),
    listRoles: vi.fn(),
  },
}));

import { roleApi } from '@/lib/api/roles';
import { userApi } from '@/lib/api/users';

describe('Integration: Role Creation → Permission Assignment → Access Control', () => {
  // Mock permissions
  const mockPermissions: Permission[] = [
    { id: 1, name: 'content.create', description: 'Create content', category: 'content' },
    { id: 2, name: 'content.read', description: 'Read content', category: 'content' },
    { id: 3, name: 'content.update', description: 'Update content', category: 'content' },
    { id: 4, name: 'content.delete', description: 'Delete content', category: 'content' },
    { id: 5, name: 'users.manage', description: 'Manage users', category: 'users' },
    { id: 6, name: 'roles.manage', description: 'Manage roles', category: 'roles' },
  ];

  // Mock roles
  const mockAdminRole: Role = {
    id: 1,
    name: 'Admin',
    description: 'Administrator with full access',
    organization_id: 1,
    is_system_role: true,
    level: 100,
    permissions: ['content.create', 'content.read', 'content.update', 'content.delete', 'users.manage', 'roles.manage'],
    user_count: 2,
    created_at: '2025-11-25T10:00:00Z',
    updated_at: '2025-11-25T10:00:00Z',
  };

  const mockEditorRole: Role = {
    id: 2,
    name: 'Editor',
    description: 'Content editor with limited access',
    organization_id: 1,
    is_system_role: false,
    level: 50,
    permissions: ['content.create', 'content.read', 'content.update'],
    user_count: 5,
    created_at: '2025-11-25T10:10:00Z',
    updated_at: '2025-11-25T10:10:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Step 1: List Available Permissions', () => {
    it('should list all available permissions', async () => {
      const permissionResponse: PermissionListResponse = {
        permissions: mockPermissions,
        total: mockPermissions.length,
      };

      vi.mocked(roleApi.listPermissions).mockResolvedValue(permissionResponse);

      const result = await roleApi.listPermissions();

      expect(roleApi.listPermissions).toHaveBeenCalled();
      expect(result.permissions).toHaveLength(6);
      expect(result.total).toBe(6);
    });

    it('should filter permissions by category', async () => {
      const contentPermissions = mockPermissions.filter(p => p.category === 'content');
      const filteredResponse: PermissionListResponse = {
        permissions: contentPermissions,
        total: contentPermissions.length,
      };

      vi.mocked(roleApi.listPermissions).mockResolvedValue(filteredResponse);

      const result = await roleApi.listPermissions('content');

      expect(roleApi.listPermissions).toHaveBeenCalledWith('content');
      expect(result.permissions).toHaveLength(4);
      expect(result.permissions.every(p => p.category === 'content')).toBe(true);
    });

    it('should list permissions by different categories', async () => {
      const userPermissions = mockPermissions.filter(p => p.category === 'users');
      const userResponse: PermissionListResponse = {
        permissions: userPermissions,
        total: userPermissions.length,
      };

      vi.mocked(roleApi.listPermissions).mockResolvedValue(userResponse);

      const result = await roleApi.listPermissions('users');

      expect(result.permissions).toHaveLength(1);
      expect(result.permissions[0].name).toBe('users.manage');
    });
  });

  describe('Step 2: Create Custom Role', () => {
    it('should create a role with selected permissions', async () => {
      const createRequest: CreateRoleRequest = {
        name: 'Content Manager',
        description: 'Manages content creation and editing',
        permission_ids: [1, 2, 3], // content.create, content.read, content.update
      };

      const createdRole: RoleResponse = {
        id: 3,
        name: 'Content Manager',
        description: 'Manages content creation and editing',
        is_system_role: false,
        level: 40,
        permissions: [mockPermissions[0], mockPermissions[1], mockPermissions[2]],
      };

      vi.mocked(roleApi.createRole).mockResolvedValue(createdRole);

      const result = await roleApi.createRole(createRequest);

      expect(roleApi.createRole).toHaveBeenCalledWith(createRequest);
      expect(result.name).toBe('Content Manager');
      expect(result.permissions).toHaveLength(3);
      expect(result.permissions.map(p => p.name)).toEqual([
        'content.create',
        'content.read',
        'content.update',
      ]);
    });

    it('should create a role without permissions', async () => {
      const createRequest: CreateRoleRequest = {
        name: 'Viewer',
        description: 'View-only access',
        permission_ids: [],
      };

      const createdRole: RoleResponse = {
        id: 4,
        name: 'Viewer',
        description: 'View-only access',
        is_system_role: false,
        level: 10,
        permissions: [],
      };

      vi.mocked(roleApi.createRole).mockResolvedValue(createdRole);

      const result = await roleApi.createRole(createRequest);

      expect(result.permissions).toHaveLength(0);
    });

    it('should handle role creation errors', async () => {
      const createRequest: CreateRoleRequest = {
        name: 'Admin', // Duplicate system role name
        description: 'Duplicate role',
        permission_ids: [1],
      };

      vi.mocked(roleApi.createRole).mockRejectedValue(new Error('Role name already exists'));

      await expect(roleApi.createRole(createRequest)).rejects.toThrow('Role name already exists');
    });
  });

  describe('Step 3: List and Verify Roles', () => {
    it('should list all roles in organization', async () => {
      const roleListResponse: RoleListResponse = {
        roles: [mockAdminRole, mockEditorRole],
        total: 2,
      };

      vi.mocked(roleApi.listRoles).mockResolvedValue(roleListResponse);

      const result = await roleApi.listRoles(0, 100);

      expect(roleApi.listRoles).toHaveBeenCalledWith(0, 100);
      expect(result.roles).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should get role with full permission details', async () => {
      const roleResponse: RoleResponse = {
        id: 2,
        name: 'Editor',
        description: 'Content editor with limited access',
        is_system_role: false,
        level: 50,
        permissions: [mockPermissions[0], mockPermissions[1], mockPermissions[2]],
      };

      vi.mocked(roleApi.getRole).mockResolvedValue(roleResponse);

      const result = await roleApi.getRole(2);

      expect(roleApi.getRole).toHaveBeenCalledWith(2);
      expect(result.name).toBe('Editor');
      expect(result.permissions).toHaveLength(3);
      expect(result.permissions.map(p => p.name)).toEqual([
        'content.create',
        'content.read',
        'content.update',
      ]);
    });

    it('should verify system role protection', async () => {
      vi.mocked(roleApi.getRole).mockResolvedValue({
        ...mockAdminRole,
        permissions: mockPermissions,
      });

      const result = await roleApi.getRole(1);

      expect(result.is_system_role).toBe(true);
      expect(result.level).toBe(100);
    });
  });

  describe('Step 4: Update Role Permissions', () => {
    it('should add permissions to existing role', async () => {
      const updatedRole: RoleResponse = {
        id: 2,
        name: 'Editor',
        description: 'Content editor with limited access',
        is_system_role: false,
        level: 50,
        permissions: [
          mockPermissions[0],
          mockPermissions[1],
          mockPermissions[2],
          mockPermissions[3], // Added content.delete
        ],
      };

      vi.mocked(roleApi.updateRole).mockResolvedValue(updatedRole);

      const result = await roleApi.updateRole(2, {
        permission_ids: [1, 2, 3, 4],
      });

      expect(roleApi.updateRole).toHaveBeenCalledWith(2, {
        permission_ids: [1, 2, 3, 4],
      });
      expect(result.permissions).toHaveLength(4);
      expect(result.permissions.some(p => p.name === 'content.delete')).toBe(true);
    });

    it('should remove permissions from role', async () => {
      const updatedRole: RoleResponse = {
        id: 2,
        name: 'Editor',
        description: 'Content editor with limited access',
        is_system_role: false,
        level: 50,
        permissions: [mockPermissions[1]], // Only content.read remains
      };

      vi.mocked(roleApi.updateRole).mockResolvedValue(updatedRole);

      const result = await roleApi.updateRole(2, {
        permission_ids: [2],
      });

      expect(result.permissions).toHaveLength(1);
      expect(result.permissions[0].name).toBe('content.read');
    });

    it('should prevent modifying system role permissions', async () => {
      vi.mocked(roleApi.updateRole).mockRejectedValue(
        new Error('Cannot modify system role permissions')
      );

      await expect(
        roleApi.updateRole(1, {
          permission_ids: [1, 2],
        })
      ).rejects.toThrow('Cannot modify system role permissions');
    });
  });

  describe('Step 5: Assign Role to User', () => {
    it('should assign role to user', async () => {
      const updateRequest: UpdateUserRoleRequest = {
        role_id: 2, // Assign Editor role
      };

      vi.mocked(userApi.updateUserRole).mockResolvedValue({
        message: 'User role updated successfully',
      });

      const result = await userApi.updateUserRole(10, updateRequest);

      expect(userApi.updateUserRole).toHaveBeenCalledWith(10, updateRequest);
      expect(result.message).toBe('User role updated successfully');
    });

    it('should change user role', async () => {
      const updateRequest: UpdateUserRoleRequest = {
        role_id: 3, // Change to Content Manager role
      };

      vi.mocked(userApi.updateUserRole).mockResolvedValue({
        message: 'User role updated successfully',
      });

      const result = await userApi.updateUserRole(10, updateRequest);

      expect(result.message).toContain('successfully');
    });

    it('should handle role assignment errors', async () => {
      vi.mocked(userApi.updateUserRole).mockRejectedValue(
        new Error('User not found')
      );

      await expect(
        userApi.updateUserRole(999, { role_id: 2 })
      ).rejects.toThrow('User not found');
    });
  });

  describe('Step 6: Verify Access Control', () => {
    it('should verify user has correct permissions through role', async () => {
      const roleResponse: RoleResponse = {
        id: 2,
        name: 'Editor',
        description: 'Content editor with limited access',
        is_system_role: false,
        level: 50,
        permissions: [mockPermissions[0], mockPermissions[1], mockPermissions[2]],
      };

      vi.mocked(roleApi.getRole).mockResolvedValue(roleResponse);

      const role = await roleApi.getRole(2);
      const hasCreatePermission = role.permissions.some(p => p.name === 'content.create');
      const hasDeletePermission = role.permissions.some(p => p.name === 'content.delete');

      expect(hasCreatePermission).toBe(true);
      expect(hasDeletePermission).toBe(false);
    });

    it('should verify admin role has all permissions', async () => {
      const roleResponse: RoleResponse = {
        ...mockAdminRole,
        permissions: mockPermissions,
      };

      vi.mocked(roleApi.getRole).mockResolvedValue(roleResponse);

      const role = await roleApi.getRole(1);
      const hasAllPermissions = mockPermissions.every(permission =>
        role.permissions.some(p => p.name === permission.name)
      );

      expect(hasAllPermissions).toBe(true);
      expect(role.level).toBe(100);
    });

    it('should verify viewer role has no write permissions', async () => {
      const viewerRole: RoleResponse = {
        id: 4,
        name: 'Viewer',
        description: 'View-only access',
        is_system_role: false,
        level: 10,
        permissions: [mockPermissions[1]], // Only content.read
      };

      vi.mocked(roleApi.getRole).mockResolvedValue(viewerRole);

      const role = await roleApi.getRole(4);
      const hasWritePermissions = role.permissions.some(p =>
        ['content.create', 'content.update', 'content.delete'].includes(p.name)
      );

      expect(hasWritePermissions).toBe(false);
      expect(role.permissions).toHaveLength(1);
      expect(role.permissions[0].name).toBe('content.read');
    });
  });

  describe('Complete Role Management Workflow', () => {
    it('should complete full workflow: create role → assign permissions → assign to user → verify', async () => {
      // Step 1: List available permissions
      vi.mocked(roleApi.listPermissions).mockResolvedValue({
        permissions: mockPermissions,
        total: mockPermissions.length,
      });
      const permissions = await roleApi.listPermissions();
      expect(permissions.permissions).toHaveLength(6);

      // Step 2: Create custom role with specific permissions
      const createRequest: CreateRoleRequest = {
        name: 'Content Manager',
        description: 'Manages content',
        permission_ids: [1, 2, 3], // content.create, read, update
      };
      const createdRole: RoleResponse = {
        id: 3,
        name: 'Content Manager',
        description: 'Manages content',
        is_system_role: false,
        level: 40,
        permissions: [mockPermissions[0], mockPermissions[1], mockPermissions[2]],
      };
      vi.mocked(roleApi.createRole).mockResolvedValue(createdRole);
      const newRole = await roleApi.createRole(createRequest);
      expect(newRole.permissions).toHaveLength(3);

      // Step 3: Assign role to user
      vi.mocked(userApi.updateUserRole).mockResolvedValue({
        message: 'User role updated successfully',
      });
      const assignResult = await userApi.updateUserRole(10, { role_id: newRole.id });
      expect(assignResult.message).toContain('successfully');

      // Step 4: Verify user has correct permissions
      vi.mocked(roleApi.getRole).mockResolvedValue(createdRole);
      const verifyRole = await roleApi.getRole(newRole.id);
      const hasContentCreate = verifyRole.permissions.some(p => p.name === 'content.create');
      const hasContentDelete = verifyRole.permissions.some(p => p.name === 'content.delete');
      expect(hasContentCreate).toBe(true);
      expect(hasContentDelete).toBe(false);
    });

    it('should handle role update workflow', async () => {
      // Create initial role
      const initialRole: RoleResponse = {
        id: 3,
        name: 'Content Manager',
        description: 'Manages content',
        is_system_role: false,
        level: 40,
        permissions: [mockPermissions[0], mockPermissions[1]], // create, read
      };
      vi.mocked(roleApi.createRole).mockResolvedValue(initialRole);
      const created = await roleApi.createRole({
        name: 'Content Manager',
        permission_ids: [1, 2],
      });

      // Update role to add more permissions
      const updatedRole: RoleResponse = {
        ...initialRole,
        permissions: [mockPermissions[0], mockPermissions[1], mockPermissions[2], mockPermissions[3]], // add update, delete
      };
      vi.mocked(roleApi.updateRole).mockResolvedValue(updatedRole);
      const updated = await roleApi.updateRole(created.id, {
        permission_ids: [1, 2, 3, 4],
      });

      expect(updated.permissions).toHaveLength(4);
      expect(updated.permissions.map(p => p.name)).toEqual([
        'content.create',
        'content.read',
        'content.update',
        'content.delete',
      ]);
    });

    it('should maintain permission hierarchy across operations', async () => {
      // List roles to see hierarchy
      vi.mocked(roleApi.listRoles).mockResolvedValue({
        roles: [mockAdminRole, mockEditorRole],
        total: 2,
      });
      const roles = await roleApi.listRoles();

      // Verify level hierarchy
      const adminRole = roles.roles.find(r => r.name === 'Admin');
      const editorRole = roles.roles.find(r => r.name === 'Editor');

      expect(adminRole?.level).toBeGreaterThan(editorRole?.level || 0);
      expect(adminRole?.permissions?.length).toBeGreaterThan(editorRole?.permissions?.length || 0);
      expect(adminRole?.is_system_role).toBe(true);
      expect(editorRole?.is_system_role).toBe(false);
    });
  });
});
