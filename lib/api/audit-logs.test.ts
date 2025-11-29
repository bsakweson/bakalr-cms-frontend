import { auditLogApi } from './audit-logs';
import { apiClient } from './client';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client');

describe('Audit Log API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listLogs', () => {
    it('should fetch audit logs with default parameters', async () => {
      const mockResponse = {
        logs: [
          {
            id: 1,
            action: 'created',
            resource_type: 'content',
            resource_id: 42,
            description: 'Created new blog post',
            severity: 'info',
            status: 'success',
            user_id: 1,
            user_email: 'john@example.com',
            user_name: 'John Doe',
            ip_address: '192.168.1.1',
            created_at: '2025-11-28T10:30:00Z',
          },
          {
            id: 2,
            action: 'updated',
            resource_type: 'user',
            resource_id: 10,
            description: 'Updated user profile',
            severity: 'info',
            status: 'success',
            user_id: 2,
            user_email: 'jane@example.com',
            user_name: 'Jane Smith',
            created_at: '2025-11-28T10:15:00Z',
          },
        ],
        total: 2,
        page: 1,
        page_size: 50,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await auditLogApi.listLogs({});

      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/audit-logs/', { params: {} });
      expect(result.logs).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should fetch audit logs with page and page_size', async () => {
      const mockResponse = {
        logs: [
          {
            id: 3,
            action: 'deleted',
            resource_type: 'content',
            resource_id: 15,
            description: 'Deleted draft post',
            severity: 'warning',
            status: 'success',
            user_id: 1,
            created_at: '2025-11-27T14:20:00Z',
          },
        ],
        total: 100,
        page: 2,
        page_size: 20,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await auditLogApi.listLogs({ page: 2, page_size: 20 });

      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/audit-logs/', {
        params: { page: 2, page_size: 20 },
      });
    });

    it('should filter logs by action', async () => {
      const mockResponse = {
        logs: [
          {
            id: 1,
            action: 'created',
            resource_type: 'content',
            resource_id: 42,
            description: 'Created blog post',
            severity: 'info',
            status: 'success',
            user_id: 1,
            created_at: '2025-11-28T10:30:00Z',
          },
        ],
        total: 1,
        page: 1,
        page_size: 50,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await auditLogApi.listLogs({ action: 'created' });

      expect(result.logs).toHaveLength(1);
      expect(result.logs[0].action).toBe('created');
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/audit-logs/', {
        params: { action: 'created' },
      });
    });

    it('should filter logs by resource_type', async () => {
      const mockResponse = {
        logs: [
          {
            id: 2,
            action: 'updated',
            resource_type: 'user',
            resource_id: 10,
            description: 'Updated user',
            severity: 'info',
            status: 'success',
            user_id: 2,
            created_at: '2025-11-28T09:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        page_size: 50,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await auditLogApi.listLogs({ resource_type: 'user' });

      expect(result.logs[0].resource_type).toBe('user');
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/audit-logs/', {
        params: { resource_type: 'user' },
      });
    });

    it('should filter logs by user_id', async () => {
      const mockResponse = {
        logs: [
          {
            id: 1,
            action: 'created',
            resource_type: 'content',
            resource_id: 42,
            description: 'User action',
            severity: 'info',
            status: 'success',
            user_id: 5,
            user_email: 'specific@example.com',
            created_at: '2025-11-28T10:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        page_size: 50,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await auditLogApi.listLogs({ user_id: 5 });

      expect(result.logs[0].user_id).toBe(5);
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/audit-logs/', {
        params: { user_id: 5 },
      });
    });

    it('should filter logs by severity', async () => {
      const mockResponse = {
        logs: [
          {
            id: 3,
            action: 'failed_login',
            resource_type: 'auth',
            resource_id: 0,
            description: 'Failed login attempt',
            severity: 'error',
            status: 'failed',
            user_id: 1,
            created_at: '2025-11-28T08:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        page_size: 50,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await auditLogApi.listLogs({ severity: 'error' });

      expect(result.logs[0].severity).toBe('error');
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/audit-logs/', {
        params: { severity: 'error' },
      });
    });

    it('should filter logs by status', async () => {
      const mockResponse = {
        logs: [
          {
            id: 4,
            action: 'delete',
            resource_type: 'content',
            resource_id: 20,
            description: 'Delete failed',
            severity: 'error',
            status: 'failed',
            user_id: 1,
            created_at: '2025-11-28T07:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        page_size: 50,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await auditLogApi.listLogs({ status: 'failed' });

      expect(result.logs[0].status).toBe('failed');
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/audit-logs/', {
        params: { status: 'failed' },
      });
    });

    it('should filter logs by days parameter', async () => {
      const mockResponse = {
        logs: [],
        total: 0,
        page: 1,
        page_size: 50,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await auditLogApi.listLogs({ days: 7 });

      expect(result.logs).toHaveLength(0);
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/audit-logs/', {
        params: { days: 7 },
      });
    });

    it('should handle multiple filter parameters', async () => {
      const mockResponse = {
        logs: [],
        total: 0,
        page: 1,
        page_size: 20,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      await auditLogApi.listLogs({
        page: 1,
        page_size: 20,
        action: 'updated',
        resource_type: 'content',
        severity: 'info',
        days: 30,
      });

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/audit-logs/', {
        params: {
          page: 1,
          page_size: 20,
          action: 'updated',
          resource_type: 'content',
          severity: 'info',
          days: 30,
        },
      });
    });

    it('should handle empty logs response', async () => {
      const mockResponse = {
        logs: [],
        total: 0,
        page: 1,
        page_size: 50,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await auditLogApi.listLogs({});

      expect(result.logs).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle API errors', async () => {
      const mockError = new Error('Failed to fetch audit logs');
      vi.mocked(apiClient.get).mockRejectedValueOnce(mockError);

      await expect(auditLogApi.listLogs({})).rejects.toThrow('Failed to fetch audit logs');
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/audit-logs/', { params: {} });
    });
  });

  describe('getStats', () => {
    it('should fetch audit log statistics', async () => {
      const mockStats = {
        total_logs: 1024,
        actions_today: 45,
        failed_actions: 8,
        unique_users: 23,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockStats } as any);

      const result = await auditLogApi.getStats();

      expect(result).toEqual(mockStats);
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/audit-logs/stats');
      expect(result.total_logs).toBe(1024);
      expect(result.actions_today).toBe(45);
      expect(result.failed_actions).toBe(8);
      expect(result.unique_users).toBe(23);
    });

    it('should handle stats with zero values', async () => {
      const mockStats = {
        total_logs: 0,
        actions_today: 0,
        failed_actions: 0,
        unique_users: 0,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockStats } as any);

      const result = await auditLogApi.getStats();

      expect(result.total_logs).toBe(0);
      expect(result.actions_today).toBe(0);
    });

    it('should handle API errors when fetching stats', async () => {
      const mockError = new Error('Failed to fetch stats');
      vi.mocked(apiClient.get).mockRejectedValueOnce(mockError);

      await expect(auditLogApi.getStats()).rejects.toThrow('Failed to fetch stats');
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/audit-logs/stats');
    });
  });
});
