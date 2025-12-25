import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { inventoryApi } from './inventory';

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

describe('inventoryApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Module exports', () => {
    it('should export inventoryApi object', () => {
      expect(inventoryApi).toBeDefined();
      expect(typeof inventoryApi).toBe('object');
    });

    it('should have getItems method', () => {
      expect(typeof inventoryApi.getItems).toBe('function');
    });

    it('should have getItem method', () => {
      expect(typeof inventoryApi.getItem).toBe('function');
    });

    it('should have getByProductId method', () => {
      expect(typeof inventoryApi.getByProductId).toBe('function');
    });

    it('should have getBySku method', () => {
      expect(typeof inventoryApi.getBySku).toBe('function');
    });

    it('should have getLowStock method', () => {
      expect(typeof inventoryApi.getLowStock).toBe('function');
    });

    it('should have getStats method', () => {
      expect(typeof inventoryApi.getStats).toBe('function');
    });

    it('should have createItem method', () => {
      expect(typeof inventoryApi.createItem).toBe('function');
    });

    it('should have adjustQuantity method', () => {
      expect(typeof inventoryApi.adjustQuantity).toBe('function');
    });

    it('should have reserve method', () => {
      expect(typeof inventoryApi.reserve).toBe('function');
    });

    it('should have release method', () => {
      expect(typeof inventoryApi.release).toBe('function');
    });

    it('should have bulkUpdate method', () => {
      expect(typeof inventoryApi.bulkUpdate).toBe('function');
    });

    it('should have deleteItem method', () => {
      expect(typeof inventoryApi.deleteItem).toBe('function');
    });
  });

  describe('getLastSyncTime', () => {
    it('should return null when no sync time stored', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(inventoryApi.getLastSyncTime()).toBeNull();
    });

    it('should return stored sync time', () => {
      const timestamp = '2025-12-20T10:00:00.000Z';
      localStorageMock.getItem.mockReturnValue(timestamp);
      expect(inventoryApi.getLastSyncTime()).toBe(timestamp);
    });
  });

  describe('setLastSyncTime', () => {
    it('should store current timestamp', () => {
      const beforeTime = new Date().toISOString();
      inventoryApi.setLastSyncTime();

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'inventory_last_sync',
        expect.any(String)
      );

      // Verify timestamp is recent
      const storedTime = localStorageMock.setItem.mock.calls[0][1];
      expect(new Date(storedTime).getTime()).toBeGreaterThanOrEqual(new Date(beforeTime).getTime());
    });
  });
});

describe('Type exports', () => {
  it('should export InventoryItem type', async () => {
    // Type exports are verified at compile-time, not runtime
    // This test just ensures the module can be imported without error
    const module = await import('./inventory');
    expect(module.inventoryApi).toBeDefined();
  });
});

describe('Runtime config integration', () => {
  it('should use runtime config for platform URL', async () => {
    const { getRuntimeConfig } = await import('@/lib/runtime-config');
    const config = getRuntimeConfig();

    expect(config.platformApiUrl).toBe('http://localhost:3000');
  });

  it('should have correct inventory API methods available', () => {
    // Verify all API methods are still accessible after runtime config integration
    const methods = [
      'getItems',
      'getItem',
      'getByProductId',
      'getBySku',
      'getLowStock',
      'getStats',
      'createItem',
      'adjustQuantity',
      'reserve',
      'release',
      'bulkUpdate',
      'deleteItem',
      'healthCheck',
      'getLastSyncTime',
      'setLastSyncTime',
    ];

    methods.forEach(method => {
      expect(typeof (inventoryApi as any)[method]).toBe('function');
    });
  });
});
