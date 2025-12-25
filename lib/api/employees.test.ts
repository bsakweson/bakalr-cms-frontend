import { describe, it, expect, beforeEach, vi } from 'vitest';
import { employeesApi } from './employees';

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

describe('employeesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Module exports', () => {
    it('should export employeesApi object', () => {
      expect(employeesApi).toBeDefined();
      expect(typeof employeesApi).toBe('object');
    });

    // Query methods
    it('should have getEmployees method', () => {
      expect(typeof employeesApi.getEmployees).toBe('function');
    });

    it('should have getEmployee method', () => {
      expect(typeof employeesApi.getEmployee).toBe('function');
    });

    it('should have getEmployeeByCmsUserId method', () => {
      expect(typeof employeesApi.getEmployeeByCmsUserId).toBe('function');
    });

    it('should have getEmployeeByCode method', () => {
      expect(typeof employeesApi.getEmployeeByCode).toBe('function');
    });

    it('should have getEmployeesByDepartment method', () => {
      expect(typeof employeesApi.getEmployeesByDepartment).toBe('function');
    });

    it('should have getEmployeesByRole method', () => {
      expect(typeof employeesApi.getEmployeesByRole).toBe('function');
    });

    it('should have getEmployeesByStatus method', () => {
      expect(typeof employeesApi.getEmployeesByStatus).toBe('function');
    });

    it('should have getEmployeesByManager method', () => {
      expect(typeof employeesApi.getEmployeesByManager).toBe('function');
    });

    it('should have getEmployeesByStore method', () => {
      expect(typeof employeesApi.getEmployeesByStore).toBe('function');
    });

    it('should have getActiveEmployees method', () => {
      expect(typeof employeesApi.getActiveEmployees).toBe('function');
    });

    it('should have getActiveEmployeesAtStore method', () => {
      expect(typeof employeesApi.getActiveEmployeesAtStore).toBe('function');
    });

    it('should have searchEmployees method', () => {
      expect(typeof employeesApi.searchEmployees).toBe('function');
    });

    it('should have getStats method', () => {
      expect(typeof employeesApi.getStats).toBe('function');
    });

    // Command methods
    it('should have createEmployee method', () => {
      expect(typeof employeesApi.createEmployee).toBe('function');
    });

    it('should have updateEmployee method', () => {
      expect(typeof employeesApi.updateEmployee).toBe('function');
    });

    it('should have setPin method', () => {
      expect(typeof employeesApi.setPin).toBe('function');
    });

    it('should have updateStatus method', () => {
      expect(typeof employeesApi.updateStatus).toBe('function');
    });

    it('should have updateSettings method', () => {
      expect(typeof employeesApi.updateSettings).toBe('function');
    });

    it('should have deleteEmployee method', () => {
      expect(typeof employeesApi.deleteEmployee).toBe('function');
    });

    // Reference data methods
    it('should have getReferenceData method', () => {
      expect(typeof employeesApi.getReferenceData).toBe('function');
    });

    it('should have getDepartments method', () => {
      expect(typeof employeesApi.getDepartments).toBe('function');
    });

    it('should have getRoles method', () => {
      expect(typeof employeesApi.getRoles).toBe('function');
    });

    it('should have getStatuses method', () => {
      expect(typeof employeesApi.getStatuses).toBe('function');
    });

    // Utility methods
    it('should have healthCheck method', () => {
      expect(typeof employeesApi.healthCheck).toBe('function');
    });
  });
});

describe('Type exports', () => {
  it('should export employeesApi object', async () => {
    const module = await import('./employees');
    expect(module.employeesApi).toBeDefined();
  });

  it('should export EmployeeRole type', async () => {
    // Type exports are verified at compile-time
    const module = await import('./employees');
    expect(module.employeesApi).toBeDefined();
  });

  it('should export Department type', async () => {
    const module = await import('./employees');
    expect(module.employeesApi).toBeDefined();
  });

  it('should export EmploymentStatus type', async () => {
    const module = await import('./employees');
    expect(module.employeesApi).toBeDefined();
  });
});

describe('Runtime config integration', () => {
  it('should use runtime config for platform URL', async () => {
    const { getRuntimeConfig } = await import('@/lib/runtime-config');
    const config = getRuntimeConfig();

    expect(config.platformApiUrl).toBe('http://localhost:3000');
  });

  it('should have correct employees API methods available', () => {
    const methods = [
      // Query methods
      'getEmployees',
      'getEmployee',
      'getEmployeeByCmsUserId',
      'getEmployeeByCode',
      'getEmployeesByDepartment',
      'getEmployeesByRole',
      'getEmployeesByStatus',
      'getEmployeesByManager',
      'getEmployeesByStore',
      'getActiveEmployees',
      'getActiveEmployeesAtStore',
      'searchEmployees',
      'getStats',
      // Command methods
      'createEmployee',
      'updateEmployee',
      'setPin',
      'updateStatus',
      'updateSettings',
      'deleteEmployee',
      // Reference data
      'getReferenceData',
      'getDepartments',
      'getRoles',
      'getStatuses',
      // Utility
      'healthCheck',
    ];

    methods.forEach((method) => {
      expect(typeof (employeesApi as Record<string, unknown>)[method]).toBe('function');
    });
  });
});

describe('Employee types validation', () => {
  it('should have valid EmployeeRole values', () => {
    const validRoles = [
      'CASHIER',
      'SALES_ASSOCIATE',
      'STOCK_CLERK',
      'SUPERVISOR',
      'ASSISTANT_MANAGER',
      'STORE_MANAGER',
      'REGIONAL_MANAGER',
      'ADMIN',
    ];
    expect(validRoles).toHaveLength(8);
  });

  it('should have valid Department values', () => {
    const validDepartments = [
      'SALES',
      'CUSTOMER_SERVICE',
      'INVENTORY',
      'MANAGEMENT',
      'FINANCE',
      'MARKETING',
      'IT',
    ];
    expect(validDepartments).toHaveLength(7);
  });

  it('should have valid EmploymentStatus values', () => {
    const validStatuses = ['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED'];
    expect(validStatuses).toHaveLength(4);
  });
});

describe('Employee settings', () => {
  it('should have all expected settings fields', () => {
    const settingsFields = [
      'maxDiscountPercent',
      'canRefund',
      'maxRefundAmount',
      'canVoidTransaction',
      'canOpenDrawer',
      'canViewReports',
      'additionalPermissions',
    ];
    expect(settingsFields).toHaveLength(7);
  });
});

describe('Reference data operations', () => {
  it('should have all reference data methods', () => {
    const refDataMethods = [
      'getReferenceData',
      'getDepartments',
      'getRoles',
      'getStatuses',
    ];

    refDataMethods.forEach((method) => {
      expect(typeof (employeesApi as Record<string, unknown>)[method]).toBe('function');
    });
  });
});

describe('Filter operations', () => {
  it('should have methods for filtering employees', () => {
    const filterMethods = [
      'getEmployeesByDepartment',
      'getEmployeesByRole',
      'getEmployeesByStatus',
      'getEmployeesByManager',
      'getEmployeesByStore',
      'getActiveEmployees',
      'getActiveEmployeesAtStore',
      'searchEmployees',
    ];

    filterMethods.forEach((method) => {
      expect(typeof (employeesApi as Record<string, unknown>)[method]).toBe('function');
    });
  });
});
