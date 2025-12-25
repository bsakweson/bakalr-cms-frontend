/**
 * Employees Service API Client
 *
 * Connects CMS frontend to boutique-platform employee services.
 * Uses the CMS JWT token for authentication.
 */
import axios, { AxiosInstance } from 'axios';
import { getRuntimeConfig } from '@/lib/runtime-config';
import { getOrganizationIdFromToken } from '@/lib/jwt';

// Employees Service Configuration
const getEmployeesConfig = () => {
  const runtimeConfig = getRuntimeConfig();
  return {
    BASE_URL: runtimeConfig.platformApiUrl,
    CONTEXT_PATH: '/api/v1/employees',
  };
};

// ============= Types =============

export type EmployeeRole =
  | 'CASHIER'
  | 'SALES_ASSOCIATE'
  | 'STOCK_CLERK'
  | 'SUPERVISOR'
  | 'ASSISTANT_MANAGER'
  | 'STORE_MANAGER'
  | 'REGIONAL_MANAGER'
  | 'ADMIN';

export type Department =
  | 'SALES'
  | 'CUSTOMER_SERVICE'
  | 'INVENTORY'
  | 'MANAGEMENT'
  | 'FINANCE'
  | 'MARKETING'
  | 'IT';

export type EmploymentStatus = 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED';

export interface EmployeeSettings {
  maxDiscountPercent: number;
  canRefund: boolean;
  maxRefundAmount: number;
  canVoidTransaction: boolean;
  canOpenDrawer: boolean;
  canViewReports: boolean;
  additionalPermissions?: string[];
}

export interface CreateEmployeeRequest {
  cmsUserId: string;
  employeeCode: string;
  role: EmployeeRole;
  department: Department;
  pin: string;
  hireDate?: string;
  hourlyRate?: number;
  commissionRate?: number;
  managerId?: string;
  storeLocationId?: string;
  settings?: EmployeeSettings;
}

export interface UpdateEmployeeRequest {
  role?: EmployeeRole;
  department?: Department;
  hourlyRate?: number;
  commissionRate?: number;
  managerId?: string;
  storeLocationId?: string;
  settings?: EmployeeSettings;
}

export interface SetPinRequest {
  pin: string;
}

export interface UpdateStatusRequest {
  status: EmploymentStatus;
  reason?: string;
}

export interface UpdateSettingsRequest {
  settings: EmployeeSettings;
}

export interface EmployeeResponse {
  id: string;
  cmsUserId: string;
  employeeCode: string;
  role: EmployeeRole;
  department: Department;
  hireDate?: string;
  hourlyRate: number;
  commissionRate: number;
  managerId?: string;
  storeLocationId?: string;
  settings: EmployeeSettings;
  status: EmploymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeStatsResponse {
  totalEmployees: number;
  byStatus: Record<EmploymentStatus, number>;
  byDepartment: Record<Department, number>;
  byRole: Record<EmployeeRole, number>;
}

export interface EnumValue {
  value: string;
  label: string;
  metadata?: Record<string, unknown>;
}

export interface ReferenceDataResponse {
  departments: EnumValue[];
  roles: EnumValue[];
  statuses: EnumValue[];
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface EmployeeListParams {
  page?: number;
  size?: number;
  sort?: string;
  department?: Department;
  role?: EmployeeRole;
  status?: EmploymentStatus;
  managerId?: string;
  storeLocationId?: string;
  search?: string;
}

// ============= API Client Factory =============

function createEmployeesClient(baseURL: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
      const orgId = getOrganizationIdFromToken(token);
      if (orgId) {
        config.headers['X-Tenant-ID'] = orgId;
      }
    }
    return config;
  });

  return client;
}

let _client: AxiosInstance | null = null;

function getClient(): AxiosInstance {
  if (!_client) {
    const config = getEmployeesConfig();
    _client = createEmployeesClient(`${config.BASE_URL}${config.CONTEXT_PATH}`);
  }
  return _client;
}

// ============= API Methods =============

export const employeesApi = {
  // -------- Query Operations (Read) --------

  /**
   * Get paginated list of employees
   */
  async getEmployees(params: EmployeeListParams = {}): Promise<PaginatedResponse<EmployeeResponse>> {
    const { data } = await getClient().get<PaginatedResponse<EmployeeResponse>>('', {
      params: {
        page: params.page || 0,
        size: params.size || 20,
        sort: params.sort,
      },
    });
    return data;
  },

  /**
   * Get employee by ID
   */
  async getEmployee(employeeId: string): Promise<EmployeeResponse> {
    const { data } = await getClient().get<EmployeeResponse>(`/${employeeId}`);
    return data;
  },

  /**
   * Get employee by CMS user ID
   */
  async getEmployeeByCmsUserId(cmsUserId: string): Promise<EmployeeResponse> {
    const { data } = await getClient().get<EmployeeResponse>(`/cms-user/${cmsUserId}`);
    return data;
  },

  /**
   * Get employee by employee code
   */
  async getEmployeeByCode(employeeCode: string): Promise<EmployeeResponse> {
    const { data } = await getClient().get<EmployeeResponse>(`/code/${employeeCode}`);
    return data;
  },

  /**
   * Get employees by department
   */
  async getEmployeesByDepartment(
    department: Department,
    params: Omit<EmployeeListParams, 'department'> = {}
  ): Promise<PaginatedResponse<EmployeeResponse>> {
    const { data } = await getClient().get<PaginatedResponse<EmployeeResponse>>(
      `/department/${department}`,
      { params }
    );
    return data;
  },

  /**
   * Get employees by role
   */
  async getEmployeesByRole(
    role: EmployeeRole,
    params: Omit<EmployeeListParams, 'role'> = {}
  ): Promise<PaginatedResponse<EmployeeResponse>> {
    const { data } = await getClient().get<PaginatedResponse<EmployeeResponse>>(
      `/role/${role}`,
      { params }
    );
    return data;
  },

  /**
   * Get employees by status
   */
  async getEmployeesByStatus(
    status: EmploymentStatus,
    params: Omit<EmployeeListParams, 'status'> = {}
  ): Promise<PaginatedResponse<EmployeeResponse>> {
    const { data } = await getClient().get<PaginatedResponse<EmployeeResponse>>(
      `/status/${status}`,
      { params }
    );
    return data;
  },

  /**
   * Get employees by manager
   */
  async getEmployeesByManager(managerId: string): Promise<EmployeeResponse[]> {
    const { data } = await getClient().get<EmployeeResponse[]>(`/manager/${managerId}`);
    return data;
  },

  /**
   * Get employees by store
   */
  async getEmployeesByStore(
    storeId: string,
    params: Omit<EmployeeListParams, 'storeLocationId'> = {}
  ): Promise<PaginatedResponse<EmployeeResponse>> {
    const { data } = await getClient().get<PaginatedResponse<EmployeeResponse>>(
      `/store/${storeId}`,
      { params }
    );
    return data;
  },

  /**
   * Get active employees
   */
  async getActiveEmployees(): Promise<EmployeeResponse[]> {
    const { data } = await getClient().get<EmployeeResponse[]>('/active');
    return data;
  },

  /**
   * Get active employees at a specific store
   */
  async getActiveEmployeesAtStore(storeId: string): Promise<EmployeeResponse[]> {
    const { data } = await getClient().get<EmployeeResponse[]>(`/store/${storeId}/active`);
    return data;
  },

  /**
   * Search employees
   */
  async searchEmployees(query: string): Promise<EmployeeResponse[]> {
    const { data } = await getClient().get<EmployeeResponse[]>('/search', {
      params: { q: query },
    });
    return data;
  },

  /**
   * Get employee statistics
   */
  async getStats(): Promise<EmployeeStatsResponse> {
    const { data } = await getClient().get<EmployeeStatsResponse>('/stats');
    return data;
  },

  // -------- Command Operations (Write) --------

  /**
   * Create a new employee
   */
  async createEmployee(request: CreateEmployeeRequest): Promise<string> {
    const { data } = await getClient().post<string>('', request);
    return data;
  },

  /**
   * Update an employee
   */
  async updateEmployee(employeeId: string, request: UpdateEmployeeRequest): Promise<void> {
    await getClient().put(`/${employeeId}`, request);
  },

  /**
   * Set employee PIN
   */
  async setPin(employeeId: string, request: SetPinRequest): Promise<void> {
    await getClient().put(`/${employeeId}/pin`, request);
  },

  /**
   * Update employee status
   */
  async updateStatus(employeeId: string, request: UpdateStatusRequest): Promise<void> {
    await getClient().put(`/${employeeId}/status`, request);
  },

  /**
   * Update employee settings
   */
  async updateSettings(employeeId: string, request: UpdateSettingsRequest): Promise<void> {
    await getClient().put(`/${employeeId}/settings`, request);
  },

  /**
   * Delete an employee
   */
  async deleteEmployee(employeeId: string, hardDelete: boolean = false): Promise<void> {
    await getClient().delete(`/${employeeId}`, {
      params: { hardDelete },
    });
  },

  // -------- Reference Data (Public - No Auth) --------

  /**
   * Get all reference data (departments, roles, statuses)
   */
  async getReferenceData(): Promise<ReferenceDataResponse> {
    const { data } = await getClient().get<ReferenceDataResponse>('/reference-data');
    return data;
  },

  /**
   * Get list of departments
   */
  async getDepartments(): Promise<EnumValue[]> {
    const { data } = await getClient().get<EnumValue[]>('/reference-data/departments');
    return data;
  },

  /**
   * Get list of employee roles
   */
  async getRoles(): Promise<EnumValue[]> {
    const { data } = await getClient().get<EnumValue[]>('/reference-data/roles');
    return data;
  },

  /**
   * Get list of employment statuses
   */
  async getStatuses(): Promise<EnumValue[]> {
    const { data } = await getClient().get<EnumValue[]>('/reference-data/statuses');
    return data;
  },

  // -------- Utility Methods --------

  /**
   * Check if employees service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      await getClient().get('/health', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  },
};

export default employeesApi;
