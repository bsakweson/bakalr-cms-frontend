import { apiClient } from './client';
import type {
  RoleListResponse,
  PermissionListResponse,
  CreateRoleRequest,
  UpdateRoleRequest,
  RoleResponse,
} from '@/types';

export const roleApi = {
  async listRoles(skip = 0, limit = 100): Promise<RoleListResponse> {
    const response = await apiClient.get('/roles/', { params: { skip, limit } });
    return response.data;
  },

  async listPermissions(category?: string): Promise<PermissionListResponse> {
    const response = await apiClient.get('/roles/permissions', {
      params: category ? { category } : {},
    });
    return response.data;
  },

  async getRole(roleId: string): Promise<RoleResponse> {
    const response = await apiClient.get(`/roles/${roleId}`);
    return response.data;
  },

  async createRole(data: CreateRoleRequest): Promise<RoleResponse> {
    const response = await apiClient.post('/roles/', data);
    return response.data;
  },

  async updateRole(roleId: string, data: UpdateRoleRequest): Promise<RoleResponse> {
    const response = await apiClient.put(`/roles/${roleId}`, data);
    return response.data;
  },

  async deleteRole(roleId: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/roles/${roleId}`);
    return response.data;
  },
};
