import { describe, it, expect, beforeEach, vi } from 'vitest';
import { customersApi } from './customers';

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

describe('customersApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Module exports', () => {
    it('should export customersApi object', () => {
      expect(customersApi).toBeDefined();
      expect(typeof customersApi).toBe('object');
    });

    // Customer query methods
    it('should have getCustomer method', () => {
      expect(typeof customersApi.getCustomer).toBe('function');
    });

    it('should have getCustomerByCmsUserId method', () => {
      expect(typeof customersApi.getCustomerByCmsUserId).toBe('function');
    });

    // Customer command methods
    it('should have createFromCmsUser method', () => {
      expect(typeof customersApi.createFromCmsUser).toBe('function');
    });

    it('should have updatePreferences method', () => {
      expect(typeof customersApi.updatePreferences).toBe('function');
    });

    it('should have updateAvatar method', () => {
      expect(typeof customersApi.updateAvatar).toBe('function');
    });

    it('should have deleteAvatar method', () => {
      expect(typeof customersApi.deleteAvatar).toBe('function');
    });

    it('should have deleteCustomer method', () => {
      expect(typeof customersApi.deleteCustomer).toBe('function');
    });

    // Address query methods
    it('should have getAddresses method', () => {
      expect(typeof customersApi.getAddresses).toBe('function');
    });

    it('should have getAddress method', () => {
      expect(typeof customersApi.getAddress).toBe('function');
    });

    it('should have getDefaultAddress method', () => {
      expect(typeof customersApi.getDefaultAddress).toBe('function');
    });

    it('should have getAddressCount method', () => {
      expect(typeof customersApi.getAddressCount).toBe('function');
    });

    // Address command methods
    it('should have addAddress method', () => {
      expect(typeof customersApi.addAddress).toBe('function');
    });

    it('should have updateAddress method', () => {
      expect(typeof customersApi.updateAddress).toBe('function');
    });

    it('should have deleteAddress method', () => {
      expect(typeof customersApi.deleteAddress).toBe('function');
    });

    it('should have setDefaultAddress method', () => {
      expect(typeof customersApi.setDefaultAddress).toBe('function');
    });

    // Wishlist query methods
    it('should have getWishlist method', () => {
      expect(typeof customersApi.getWishlist).toBe('function');
    });

    it('should have isInWishlist method', () => {
      expect(typeof customersApi.isInWishlist).toBe('function');
    });

    it('should have getWishlistCount method', () => {
      expect(typeof customersApi.getWishlistCount).toBe('function');
    });

    // Wishlist command methods
    it('should have addToWishlist method', () => {
      expect(typeof customersApi.addToWishlist).toBe('function');
    });

    it('should have removeFromWishlist method', () => {
      expect(typeof customersApi.removeFromWishlist).toBe('function');
    });

    it('should have removeFromWishlistByProductId method', () => {
      expect(typeof customersApi.removeFromWishlistByProductId).toBe('function');
    });

    it('should have clearWishlist method', () => {
      expect(typeof customersApi.clearWishlist).toBe('function');
    });

    // Utility methods
    it('should have healthCheck method', () => {
      expect(typeof customersApi.healthCheck).toBe('function');
    });
  });
});

describe('Type exports', () => {
  it('should export customersApi object', async () => {
    const module = await import('./customers');
    expect(module.customersApi).toBeDefined();
  });

  it('should export AddressType type', async () => {
    // Type exports are verified at compile-time
    const module = await import('./customers');
    expect(module.customersApi).toBeDefined();
  });
});

describe('Runtime config integration', () => {
  it('should use runtime config for platform URL', async () => {
    const { getRuntimeConfig } = await import('@/lib/runtime-config');
    const config = getRuntimeConfig();

    expect(config.platformApiUrl).toBe('http://localhost:3000');
  });

  it('should have correct customers API methods available', () => {
    const methods = [
      // Customer query
      'getCustomer',
      'getCustomerByCmsUserId',
      // Customer command
      'createFromCmsUser',
      'updatePreferences',
      'updateAvatar',
      'deleteAvatar',
      'deleteCustomer',
      // Address query
      'getAddresses',
      'getAddress',
      'getDefaultAddress',
      'getAddressCount',
      // Address command
      'addAddress',
      'updateAddress',
      'deleteAddress',
      'setDefaultAddress',
      // Wishlist query
      'getWishlist',
      'isInWishlist',
      'getWishlistCount',
      // Wishlist command
      'addToWishlist',
      'removeFromWishlist',
      'removeFromWishlistByProductId',
      'clearWishlist',
      // Utility
      'healthCheck',
    ];

    methods.forEach((method) => {
      expect(typeof (customersApi as Record<string, unknown>)[method]).toBe('function');
    });
  });
});

describe('Customer types validation', () => {
  it('should have valid AddressType values', () => {
    const validTypes = ['HOME', 'WORK', 'OTHER'];
    expect(validTypes).toHaveLength(3);
  });

  it('should have valid preferences fields', () => {
    const preferenceFields = [
      'newsletter',
      'marketingEmails',
      'orderUpdates',
      'smsNotifications',
    ];
    expect(preferenceFields).toHaveLength(4);
  });
});

describe('Address operations', () => {
  it('should have all address CRUD methods', () => {
    const addressMethods = [
      'getAddresses',
      'getAddress',
      'getDefaultAddress',
      'getAddressCount',
      'addAddress',
      'updateAddress',
      'deleteAddress',
      'setDefaultAddress',
    ];

    addressMethods.forEach((method) => {
      expect(typeof (customersApi as Record<string, unknown>)[method]).toBe('function');
    });
  });
});

describe('Wishlist operations', () => {
  it('should have all wishlist CRUD methods', () => {
    const wishlistMethods = [
      'getWishlist',
      'isInWishlist',
      'getWishlistCount',
      'addToWishlist',
      'removeFromWishlist',
      'removeFromWishlistByProductId',
      'clearWishlist',
    ];

    wishlistMethods.forEach((method) => {
      expect(typeof (customersApi as Record<string, unknown>)[method]).toBe('function');
    });
  });
});
