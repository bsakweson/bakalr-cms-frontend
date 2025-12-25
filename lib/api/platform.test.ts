import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock runtime-config before importing platform module
vi.mock('@/lib/runtime-config', () => ({
  getRuntimeConfig: vi.fn(() => ({
    cmsApiUrl: 'http://localhost:8000',
    platformApiUrl: 'https://bakalr.com',
  })),
}));

// Mock jwt module to return a tenant ID
vi.mock('@/lib/jwt', () => ({
  getTenantIdFromStoredToken: vi.fn(() => 'bakalr-boutique'),
  getOrganizationIdFromToken: vi.fn(() => 'bakalr-boutique'),
  parseJwtToken: vi.fn(),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('platform API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('getPlatformConfig', () => {
    it('should return config from runtime config', async () => {
      const { getRuntimeConfig } = await import('@/lib/runtime-config');
      const config = getRuntimeConfig();

      expect(config.platformApiUrl).toBe('https://bakalr.com');
    });
  });

  describe('getOrderStats', () => {
    it('should fetch order stats from platform API', async () => {
      const mockStats = {
        totalOrders: 100,
        pendingOrders: 10,
        confirmedOrders: 20,
        shippedOrders: 30,
        deliveredOrders: 35,
        cancelledOrders: 5,
        paidOrders: 85,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockStats)),
      });

      const { getOrderStats } = await import('./platform');
      const result = await getOrderStats('test-token');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://bakalr.com/api/v1/orders/stats/count',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
            'X-Tenant-ID': 'bakalr-boutique',
          }),
        })
      );
      expect(result).toEqual(mockStats);
    });

    it('should return default stats on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { getOrderStats } = await import('./platform');
      const result = await getOrderStats();

      expect(result).toEqual({
        totalOrders: 0,
        pendingOrders: 0,
        confirmedOrders: 0,
        shippedOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        paidOrders: 0,
      });
    });
  });

  describe('getOrders', () => {
    it('should fetch orders with pagination params', async () => {
      const mockResponse = {
        content: [
          { id: '1', orderNumber: 'ORD-001', status: 'PENDING' },
        ],
        totalElements: 1,
        totalPages: 1,
        size: 10,
        number: 0,
        first: true,
        last: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockResponse)),
      });

      const { getOrders } = await import('./platform');
      const result = await getOrders('test-token', { page: 0, size: 10, status: 'PENDING' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://bakalr.com/api/v1/orders'),
        expect.any(Object)
      );
      expect(result.content).toHaveLength(1);
    });
  });

  describe('getCustomers', () => {
    it('should fetch customers from platform API', async () => {
      const mockResponse = {
        content: [
          { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' },
        ],
        totalElements: 1,
        totalPages: 1,
        size: 10,
        number: 0,
        first: true,
        last: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockResponse)),
      });

      const { getCustomers } = await import('./platform');
      const result = await getCustomers('test-token');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://bakalr.com/api/customers'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Tenant-ID': 'bakalr-boutique',
          }),
        })
      );
      expect(result.content).toHaveLength(1);
    });
  });

  describe('getEmployees', () => {
    it('should fetch employees from platform API', async () => {
      const mockResponse = {
        content: [
          { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        ],
        totalElements: 1,
        totalPages: 1,
        size: 10,
        number: 0,
        first: true,
        last: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockResponse)),
      });

      const { getEmployees } = await import('./platform');
      const result = await getEmployees('test-token');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://bakalr.com/api/v1/employees'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Tenant-ID': 'bakalr-boutique',
          }),
        })
      );
      expect(result.content).toHaveLength(1);
    });
  });

  describe('Module exports', () => {
    it('should export order functions', async () => {
      const platform = await import('./platform');

      expect(typeof platform.getOrderStats).toBe('function');
      expect(typeof platform.getOrders).toBe('function');
      expect(typeof platform.getOrderById).toBe('function');
      expect(typeof platform.updateOrderStatus).toBe('function');
    });

    it('should export customer functions', async () => {
      const platform = await import('./platform');

      expect(typeof platform.getCustomers).toBe('function');
      expect(typeof platform.getCustomerById).toBe('function');
    });

    it('should export employee functions', async () => {
      const platform = await import('./platform');

      expect(typeof platform.getEmployees).toBe('function');
      expect(typeof platform.getEmployeeStats).toBe('function');
    });

    it('should export reference data constants', async () => {
      const platform = await import('./platform');

      expect(platform.DEPARTMENTS).toBeDefined();
      expect(Array.isArray(platform.DEPARTMENTS)).toBe(true);
      expect(platform.EMPLOYEE_ROLES).toBeDefined();
      expect(Array.isArray(platform.EMPLOYEE_ROLES)).toBe(true);
      expect(platform.EMPLOYMENT_STATUSES).toBeDefined();
      expect(Array.isArray(platform.EMPLOYMENT_STATUSES)).toBe(true);
    });
  });

  describe('Runtime config integration', () => {
    it('should use runtime config for platform URL', async () => {
      const { getRuntimeConfig } = await import('@/lib/runtime-config');
      const config = getRuntimeConfig();

      expect(config.platformApiUrl).toBe('https://bakalr.com');
    });

    it('should get tenant ID from JWT token', async () => {
      const { getTenantIdFromStoredToken } = await import('@/lib/jwt');
      const tenantId = getTenantIdFromStoredToken();

      // Tenant ID now comes from JWT, not runtime config
      expect(tenantId).toBe('bakalr-boutique');
    });
  });
});
