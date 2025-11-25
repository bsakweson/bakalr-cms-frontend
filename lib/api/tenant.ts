import { apiClient } from './client';
import type {
  UserOrganizationsResponse,
  SwitchOrganizationRequest,
  SwitchOrganizationResponse,
} from '@/types';

export const tenantApi = {
  async listOrganizations(): Promise<UserOrganizationsResponse> {
    const response = await apiClient.get('/tenant/organizations');
    return response.data;
  },

  async switchOrganization(data: SwitchOrganizationRequest): Promise<SwitchOrganizationResponse> {
    const response = await apiClient.post('/tenant/switch', data);
    return response.data;
  },
};
