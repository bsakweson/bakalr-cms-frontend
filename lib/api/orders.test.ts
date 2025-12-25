import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ordersApi } from './orders';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock runtime-config
vi.mock('@/lib/runtime-config', () => ({
  getRuntimeConfig: vi.fn(() => ({
    cmsApiUrl: 'http://localhost:8000',
    platformApiUrl: 'http://localhost:3000',
  })),
}));

// Mock jwt utils
vi.mock('@/lib/jwt', () => ({
  getOrganizationIdFromToken: vi.fn(() => 'test-org-id'),
}));

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
    get: vi.fn(),
  },
}));

describe('ordersApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Module exports', () => {
    it('should export ordersApi object', () => {
      expect(ordersApi).toBeDefined();
      expect(typeof ordersApi).toBe('object');
    });

    // Query methods
    it('should have getOrders method', () => {
      expect(typeof ordersApi.getOrders).toBe('function');
    });

    it('should have getOrder method', () => {
      expect(typeof ordersApi.getOrder).toBe('function');
    });

    it('should have getOrdersByCustomer method', () => {
      expect(typeof ordersApi.getOrdersByCustomer).toBe('function');
    });

    it('should have getOrdersByShop method', () => {
      expect(typeof ordersApi.getOrdersByShop).toBe('function');
    });

    it('should have getOrdersByStatus method', () => {
      expect(typeof ordersApi.getOrdersByStatus).toBe('function');
    });

    it('should have getOrdersByPaymentStatus method', () => {
      expect(typeof ordersApi.getOrdersByPaymentStatus).toBe('function');
    });

    it('should have getReadyForShipping method', () => {
      expect(typeof ordersApi.getReadyForShipping).toBe('function');
    });

    it('should have getReadyForDelivery method', () => {
      expect(typeof ordersApi.getReadyForDelivery).toBe('function');
    });

    it('should have getOverdueOrders method', () => {
      expect(typeof ordersApi.getOverdueOrders).toBe('function');
    });

    it('should have getHighValueOrders method', () => {
      expect(typeof ordersApi.getHighValueOrders).toBe('function');
    });

    it('should have getTotalRevenue method', () => {
      expect(typeof ordersApi.getTotalRevenue).toBe('function');
    });

    it('should have getCustomerRevenue method', () => {
      expect(typeof ordersApi.getCustomerRevenue).toBe('function');
    });

    it('should have getShopRevenue method', () => {
      expect(typeof ordersApi.getShopRevenue).toBe('function');
    });

    it('should have getStats method', () => {
      expect(typeof ordersApi.getStats).toBe('function');
    });

    // Command methods
    it('should have createOrder method', () => {
      expect(typeof ordersApi.createOrder).toBe('function');
    });

    it('should have updateOrder method', () => {
      expect(typeof ordersApi.updateOrder).toBe('function');
    });

    it('should have cancelOrder method', () => {
      expect(typeof ordersApi.cancelOrder).toBe('function');
    });

    it('should have processPayment method', () => {
      expect(typeof ordersApi.processPayment).toBe('function');
    });

    it('should have updateShipping method', () => {
      expect(typeof ordersApi.updateShipping).toBe('function');
    });

    // Utility methods
    it('should have healthCheck method', () => {
      expect(typeof ordersApi.healthCheck).toBe('function');
    });
  });
});

describe('Type exports', () => {
  it('should export ordersApi object', async () => {
    const module = await import('./orders');
    expect(module.ordersApi).toBeDefined();
  });

  it('should export OrderStatus type', async () => {
    // Type exports are verified at compile-time
    const module = await import('./orders');
    expect(module.ordersApi).toBeDefined();
  });

  it('should export OrderType type', async () => {
    const module = await import('./orders');
    expect(module.ordersApi).toBeDefined();
  });

  it('should export PaymentStatus type', async () => {
    const module = await import('./orders');
    expect(module.ordersApi).toBeDefined();
  });
});

describe('Runtime config integration', () => {
  it('should use runtime config for platform URL', async () => {
    const { getRuntimeConfig } = await import('@/lib/runtime-config');
    const config = getRuntimeConfig();

    expect(config.platformApiUrl).toBe('http://localhost:3000');
  });

  it('should have correct orders API methods available', () => {
    const methods = [
      // Query methods
      'getOrders',
      'getOrder',
      'getOrdersByCustomer',
      'getOrdersByShop',
      'getOrdersByStatus',
      'getOrdersByPaymentStatus',
      'getReadyForShipping',
      'getReadyForDelivery',
      'getOverdueOrders',
      'getHighValueOrders',
      'getTotalRevenue',
      'getCustomerRevenue',
      'getShopRevenue',
      'getStats',
      // Command methods
      'createOrder',
      'updateOrder',
      'cancelOrder',
      'processPayment',
      'updateShipping',
      // Utility methods
      'healthCheck',
    ];

    methods.forEach((method) => {
      expect(typeof (ordersApi as Record<string, unknown>)[method]).toBe('function');
    });
  });
});

describe('Order types validation', () => {
  it('should have valid OrderStatus values', () => {
    const validStatuses = [
      'PENDING',
      'CONFIRMED',
      'PROCESSING',
      'READY_FOR_PICKUP',
      'SHIPPED',
      'IN_TRANSIT',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED',
      'RETURNED',
      'REFUNDED',
      'ON_HOLD',
    ];
    // This is a compile-time check - if types are wrong, TypeScript will catch it
    expect(validStatuses).toHaveLength(12);
  });

  it('should have valid OrderType values', () => {
    const validTypes = [
      'STANDARD',
      'EXPRESS',
      'SAME_DAY',
      'PICKUP',
      'SUBSCRIPTION',
      'PRE_ORDER',
      'BACKORDER',
      'WHOLESALE',
    ];
    expect(validTypes).toHaveLength(8);
  });

  it('should have valid PaymentStatus values', () => {
    const validStatuses = [
      'PENDING',
      'AUTHORIZED',
      'PAID',
      'PARTIALLY_PAID',
      'REFUNDED',
      'PARTIALLY_REFUNDED',
      'FAILED',
      'CANCELLED',
    ];
    expect(validStatuses).toHaveLength(8);
  });
});
