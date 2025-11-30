import { apiClient } from './client';
import type { AuditLogListResponse, AuditLogStats } from '@/types';

export const auditLogApi = {
  async listLogs(params: {
    page?: number;
    page_size?: number;
    action?: string;
    resource_type?: string;
    user_id?: number;
    severity?: string;
    status?: string;
    days?: number;
  }): Promise<AuditLogListResponse> {
    const response = await apiClient.get('/audit-logs/', { params });
    return response.data;
  },

  async getStats(): Promise<AuditLogStats> {
    const response = await apiClient.get('/audit-logs/stats');
    return response.data;
  },
};
