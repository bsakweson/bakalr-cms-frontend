import apiClient from './client';
import type {
  UserListResponse,
  InviteUserRequest,
  InviteUserResponse,
  UpdateUserRoleRequest,
  Role
} from '@/types';

export const userApi = {
  /**
   * List all users in the current organization
   */
  async listUsers(skip: number = 0, limit: number = 100): Promise<UserListResponse> {
    const response = await apiClient.get<UserListResponse>(`/users/?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  /**
   * Invite a new user to the organization
   */
  async inviteUser(data: InviteUserRequest): Promise<InviteUserResponse> {
    const response = await apiClient.post<InviteUserResponse>('/users/invite', data);
    return response.data;
  },

  /**
   * Update a user's role
   */
  async updateUserRole(userId: number, data: UpdateUserRoleRequest): Promise<{ message: string }> {
    const response = await apiClient.put(`/users/${userId}/role`, data);
    return response.data;
  },

  /**
   * Remove a user from the organization
   */
  async removeUser(userId: number): Promise<{ message: string }> {
    const response = await apiClient.delete(`/users/${userId}`);
    return response.data;
  },

  /**
   * List all roles in the current organization
   */
  async listRoles(): Promise<{ roles: Role[], total: number }> {
    const response = await apiClient.get('/roles/');
    return response.data;
  }
};
