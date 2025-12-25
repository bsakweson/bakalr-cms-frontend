/**
 * Platform API Client for Boutique Admin
 *
 * This module provides API functions for managing the boutique platform
 * from the CMS admin interface. It communicates with:
 * - Boutique Platform (customers, orders, revenue, inventory)
 * - CMS API (products, categories, brands, API keys)
 */

import { getRuntimeConfig } from '@/lib/runtime-config';
import { getTenantIdFromStoredToken } from '@/lib/jwt';

// ============================================================================
// Configuration - uses runtime config for flexibility
// ============================================================================

const getPlatformConfig = () => {
  const config = getRuntimeConfig();
  return {
    PLATFORM_API_BASE: config.platformApiUrl,
  };
};

// ============================================================================
// Types
// ============================================================================

export interface DashboardStats {
  products: {
    total: number;
    published: number;
    draft: number;
  };
  customers: {
    total: number;
    new: number;
  };
  orders: {
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    today: number;
  };
  revenue: {
    total: number;
    currency: string;
  };
  inventory: {
    lowStockCount: number;
  };
  apiKeys: {
    total: number;
    active: number;
  };
  employees: {
    total: number;
  };
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  paidOrders: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  currencyCode: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  shippingAddress?: Address;
  billingAddress?: Address;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  totalOrders: number;
  totalSpent: number;
  status: 'active' | 'inactive' | 'blocked';
  addresses?: Address[];
  tags?: string[];
}

export interface LowStockItem {
  id: string;
  productId: string;
  variantId?: string;
  sku: string;
  quantityAvailable: number;
  quantityReserved: number;
  totalQuantity: number;
  reorderLevel: number;
  reorderQuantity: number;
  isLowStock: boolean;
  locationCode?: string;
  warehouseId?: string;
}

export interface RecentActivity {
  id: string;
  type: 'order' | 'customer' | 'product' | 'low_stock' | 'employee';
  action: string;
  details: string;
  timestamp: string;
  icon: string;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department: string;
  role: string;
  status: 'active' | 'inactive' | 'on_leave';
  hireDate: string;
  manager?: string;
  managerId?: string;
  employeeId?: string;
  employeeCode?: string;
  avatar?: string;
  storeLocationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeStats {
  total: number;
  totalEmployees?: number;
  active: number;
  inactive: number;
  onLeave: number;
  byDepartment: Record<string, number>;
  byRole?: Record<string, number>;
  byStatus?: Record<string, number>;
}

// ============================================================================
// Reference Data Types
// ============================================================================

export interface EnumValue {
  value: string;
  label: string;
  description?: string;
  icon?: string;
  color?: string;
  metadata?: Record<string, unknown>;
  /** True if this is a custom entry (not a system default) */
  isCustom?: boolean;
  /** Sort order for display */
  sortOrder?: number;
}

export interface DepartmentOption extends EnumValue {
  value: Department | string; // Allow custom department codes
}

export interface RoleOption extends EnumValue {
  value: EmployeeRole | string; // Allow custom role codes
  metadata?: {
    managerLevel?: boolean;
    permissions?: string[];
    [key: string]: unknown;
  };
}

export interface StatusOption extends EnumValue {
  value: string;
}

export interface ReferenceData {
  departments: DepartmentOption[];
  roles: RoleOption[];
  statuses: StatusOption[];
}

// Department enum matching backend
export type Department =
  | 'SALES'
  | 'INVENTORY'
  | 'CUSTOMER_SERVICE'
  | 'MANAGEMENT'
  | 'KITCHEN'
  | 'FRONT_OF_HOUSE'
  | 'DELIVERY'
  | 'GENERAL';

// Fallback static data (used when API unavailable)
export const DEPARTMENTS: { value: Department; label: string }[] = [
  { value: 'SALES', label: 'Sales' },
  { value: 'INVENTORY', label: 'Inventory' },
  { value: 'CUSTOMER_SERVICE', label: 'Customer Service' },
  { value: 'MANAGEMENT', label: 'Management' },
  { value: 'KITCHEN', label: 'Kitchen' },
  { value: 'FRONT_OF_HOUSE', label: 'Front of House' },
  { value: 'DELIVERY', label: 'Delivery' },
  { value: 'GENERAL', label: 'General' },
];

// Employee role enum matching backend
export type EmployeeRole =
  | 'MANAGER'
  | 'ASSISTANT_MANAGER'
  | 'SALES_ASSOCIATE'
  | 'CASHIER'
  | 'STOCK_HANDLER'
  | 'CUSTOMER_SERVICE'
  | 'KITCHEN_STAFF'
  | 'WAITER'
  | 'DELIVERY_DRIVER';

// Fallback static data (used when API unavailable)
export const EMPLOYEE_ROLES: { value: EmployeeRole; label: string; managerLevel: boolean }[] = [
  { value: 'MANAGER', label: 'Manager', managerLevel: true },
  { value: 'ASSISTANT_MANAGER', label: 'Assistant Manager', managerLevel: true },
  { value: 'SALES_ASSOCIATE', label: 'Sales Associate', managerLevel: false },
  { value: 'CASHIER', label: 'Cashier', managerLevel: false },
  { value: 'STOCK_HANDLER', label: 'Stock Handler', managerLevel: false },
  { value: 'CUSTOMER_SERVICE', label: 'Customer Service', managerLevel: false },
  { value: 'KITCHEN_STAFF', label: 'Kitchen Staff', managerLevel: false },
  { value: 'WAITER', label: 'Waiter/Server', managerLevel: false },
  { value: 'DELIVERY_DRIVER', label: 'Delivery Driver', managerLevel: false },
];

export const EMPLOYMENT_STATUSES: { value: string; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'ON_LEAVE', label: 'On Leave' },
  { value: 'TERMINATED', label: 'Terminated' },
];

export interface StoreSettings {
  id?: string;
  storeName: string;
  storeEmail: string;
  storePhone?: string;
  storeAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  currency: string;
  timezone: string;
  defaultLanguage?: string;
  enableGuestCheckout: boolean;
  showOutOfStock: boolean;
  enableReviews: boolean;
  enableWishlist: boolean;
  taxRate?: number;
  freeShippingThreshold?: number;
  defaultShippingRate?: number;
  // Pagination settings
  defaultPageSize: number;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description?: string;
  rate: number;
  estimatedDays: string;
  enabled: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  testMode?: boolean;
}

export interface NotificationSettings {
  orderNotifications: boolean;
  lowStockAlerts: boolean;
  customerRegistration: boolean;
  orderStatusEmails: boolean;
  promotionalEmails?: boolean;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// ============================================================================
// Platform API Helpers
// ============================================================================

async function platformFetch<T>(
  endpoint: string,
  accessToken?: string,
  options: RequestInit = {}
): Promise<T> {
  const platformConfig = getPlatformConfig();
  const tenantId = getTenantIdFromStoredToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(tenantId && { 'X-Tenant-ID': tenantId }),
    ...((options.headers as Record<string, string>) || {}),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const url = `${platformConfig.PLATFORM_API_BASE}${endpoint}`;

  console.log('[Platform API] Request:', url, 'Token present:', !!accessToken);

  const response = await fetch(url, {
    ...options,
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Platform API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text);
}

// ============================================================================
// Order API Functions
// ============================================================================

export async function getOrderStats(accessToken?: string): Promise<OrderStats> {
  try {
    return await platformFetch<OrderStats>('/api/v1/orders/stats/count', accessToken);
  } catch (error) {
    console.error('Failed to fetch order stats:', error);
    return {
      totalOrders: 0,
      pendingOrders: 0,
      confirmedOrders: 0,
      shippedOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      paidOrders: 0,
    };
  }
}

export async function getOrders(
  accessToken?: string,
  params?: {
    page?: number;
    size?: number;
    status?: string;
    search?: string;
    sort?: string;
  }
): Promise<PaginatedResponse<Order>> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.size) searchParams.append('size', params.size.toString());
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.sort) searchParams.append('sort', params.sort);

    const endpoint = `/api/v1/orders${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return await platformFetch<PaginatedResponse<Order>>(endpoint, accessToken);
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 10,
      number: 0,
      first: true,
      last: true,
    };
  }
}

export async function getOrderById(orderId: string, accessToken?: string): Promise<Order | null> {
  try {
    return await platformFetch<Order>(`/api/v1/orders/${orderId}`, accessToken);
  } catch (error) {
    console.error('Failed to fetch order:', error);
    return null;
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
  accessToken?: string
): Promise<Order | null> {
  try {
    return await platformFetch<Order>(
      `/api/v1/orders/${orderId}/status`,
      accessToken,
      {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }
    );
  } catch (error) {
    console.error('Failed to update order status:', error);
    return null;
  }
}

export async function getTotalRevenue(accessToken?: string): Promise<number> {
  try {
    const revenue = await platformFetch<number>('/api/v1/orders/revenue/total', accessToken);
    return revenue || 0;
  } catch (error) {
    console.error('Failed to fetch total revenue:', error);
    return 0;
  }
}

// ============================================================================
// Customer API Functions
// ============================================================================

export async function getCustomers(
  accessToken?: string,
  params?: {
    page?: number;
    size?: number;
    status?: string;
    search?: string;
    sort?: string;
  }
): Promise<PaginatedResponse<Customer>> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.size) searchParams.append('size', params.size.toString());
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.sort) searchParams.append('sort', params.sort);

    const endpoint = `/api/customers${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return await platformFetch<PaginatedResponse<Customer>>(endpoint, accessToken);
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 10,
      number: 0,
      first: true,
      last: true,
    };
  }
}

export async function getCustomerById(customerId: string, accessToken?: string): Promise<Customer | null> {
  try {
    return await platformFetch<Customer>(`/api/customers/${customerId}`, accessToken);
  } catch (error) {
    console.error('Failed to fetch customer:', error);
    return null;
  }
}

export async function getCustomerStats(accessToken?: string): Promise<{ total: number; new: number; active: number }> {
  try {
    const response = await platformFetch<{ total: number; new: number; active: number }>(
      '/api/customers/stats',
      accessToken
    );
    return response;
  } catch (error) {
    console.error('Failed to fetch customer stats:', error);
    return { total: 0, new: 0, active: 0 };
  }
}

// ============================================================================
// Inventory API Functions
// ============================================================================

export async function getLowStockItems(accessToken?: string): Promise<LowStockItem[]> {
  try {
    const items = await platformFetch<LowStockItem[]>('/api/v1/inventory/low-stock', accessToken);
    return items || [];
  } catch (error) {
    console.error('Failed to fetch low stock items:', error);
    return [];
  }
}

export async function getInventoryStats(accessToken?: string): Promise<{
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
}> {
  try {
    return await platformFetch<{
      totalItems: number;
      lowStockItems: number;
      outOfStockItems: number;
    }>('/api/v1/inventory/stats', accessToken);
  } catch (error) {
    console.error('Failed to fetch inventory stats:', error);
    return { totalItems: 0, lowStockItems: 0, outOfStockItems: 0 };
  }
}

// ============================================================================
// Dashboard API Functions
// ============================================================================

export async function getDashboardStats(accessToken?: string): Promise<DashboardStats> {
  const [orderStats, revenue, lowStockItems] = await Promise.all([
    getOrderStats(accessToken),
    getTotalRevenue(accessToken),
    getLowStockItems(accessToken),
  ]);

  return {
    products: { total: 0, published: 0, draft: 0 },
    customers: { total: 0, new: 0 },
    orders: {
      total: orderStats.totalOrders,
      pending: orderStats.pendingOrders,
      processing: orderStats.confirmedOrders,
      shipped: orderStats.shippedOrders,
      delivered: orderStats.deliveredOrders,
      cancelled: orderStats.cancelledOrders,
      today: 0,
    },
    revenue: { total: revenue, currency: 'USD' },
    inventory: { lowStockCount: Array.isArray(lowStockItems) ? lowStockItems.length : 0 },
    apiKeys: { total: 0, active: 0 },
    employees: { total: 0 },
  };
}

export async function getRecentOrders(accessToken?: string, limit = 5): Promise<Order[]> {
  try {
    const response = await getOrders(accessToken, {
      size: limit,
      sort: 'createdAt,desc',
    });
    return response.content || [];
  } catch (error) {
    console.error('Failed to fetch recent orders:', error);
    return [];
  }
}

export async function getRecentActivity(accessToken?: string): Promise<RecentActivity[]> {
  const activities: RecentActivity[] = [];

  try {
    const recentOrders = await getRecentOrders(accessToken, 3);

    for (const order of recentOrders) {
      activities.push({
        id: `order-${order.id}`,
        type: 'order',
        action: 'New order',
        details: `Order #${order.orderNumber} - ${formatCurrency(order.totalAmount, order.currencyCode)}`,
        timestamp: order.createdAt,
        icon: '🛒',
      });
    }

    const lowStockItems = await getLowStockItems(accessToken);

    for (const item of lowStockItems.slice(0, 2)) {
      activities.push({
        id: `lowstock-${item.id}`,
        type: 'low_stock',
        action: 'Low stock alert',
        details: `${item.sku} - Only ${item.quantityAvailable} left`,
        timestamp: new Date().toISOString(),
        icon: '⚠️',
      });
    }

    activities.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return activities.slice(0, 5);
  } catch (error) {
    console.error('Failed to generate recent activity:', error);
    return [];
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;

  return date.toLocaleDateString();
}

// ============================================================================
// Employee API Functions
// ============================================================================
// Reference Data API
// ============================================================================

/**
 * Fetch reference data from boutique platform.
 * Returns departments, roles, and statuses for dropdowns.
 * Falls back to static data if API is unavailable.
 */
export async function getReferenceData(accessToken?: string): Promise<ReferenceData> {
  const { PLATFORM_API_BASE } = getPlatformConfig();
  const tenantId = getTenantIdFromStoredToken();
  try {
    const headers: Record<string, string> = {
      ...(tenantId && { 'X-Tenant-ID': tenantId }),
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${PLATFORM_API_BASE}/api/v1/reference`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch reference data: ${response.status}`);
    }

    const data = await response.json();

    // Handle undefined/null data gracefully - use fallback if structure is invalid
    if (!data || !data.departments || !data.roles || !data.statuses) {
      console.warn('Reference data API returned incomplete data, using fallback');
      return {
        departments: DEPARTMENTS,
        roles: EMPLOYEE_ROLES.map(r => ({
          value: r.value,
          label: r.label,
          metadata: { managerLevel: r.managerLevel },
        })),
        statuses: EMPLOYMENT_STATUSES,
      };
    }

    return {
      departments: (data.departments || []).map((d: EnumValue) => ({
        value: d.value as Department,
        label: d.label,
      })),
      roles: (data.roles || []).map((r: EnumValue & { metadata?: { managerLevel?: boolean } }) => ({
        value: r.value as EmployeeRole,
        label: r.label,
        metadata: r.metadata,
      })),
      statuses: (data.statuses || []).map((s: EnumValue) => ({
        value: s.value,
        label: s.label,
      })),
    };
  } catch (error) {
    console.warn('Failed to fetch reference data from API, using fallback:', error);

    // Return fallback static data
    return {
      departments: DEPARTMENTS,
      roles: EMPLOYEE_ROLES.map(r => ({
        value: r.value,
        label: r.label,
        metadata: { managerLevel: r.managerLevel },
      })),
      statuses: EMPLOYMENT_STATUSES,
    };
  }
}

/**
 * Fetch departments only
 */
export async function getDepartments(accessToken?: string): Promise<DepartmentOption[]> {
  const { PLATFORM_API_BASE } = getPlatformConfig();
  const tenantId = getTenantIdFromStoredToken();
  try {
    const headers: Record<string, string> = {
      ...(tenantId && { 'X-Tenant-ID': tenantId }),
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${PLATFORM_API_BASE}/api/v1/reference/departments`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch departments: ${response.status}`);
    }

    const data = await response.json();
    return data.map((d: EnumValue) => ({
      value: d.value as Department,
      label: d.label,
    }));
  } catch (error) {
    console.warn('Failed to fetch departments from API, using fallback:', error);
    return DEPARTMENTS;
  }
}

/**
 * Fetch employee roles only
 */
export async function getEmployeeRoles(accessToken?: string): Promise<RoleOption[]> {
  const { PLATFORM_API_BASE } = getPlatformConfig();
  const tenantId = getTenantIdFromStoredToken();
  try {
    const headers: Record<string, string> = {
      ...(tenantId && { 'X-Tenant-ID': tenantId }),
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${PLATFORM_API_BASE}/api/v1/reference/roles`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch roles: ${response.status}`);
    }

    const data = await response.json();
    return data.map((r: EnumValue & { metadata?: { managerLevel?: boolean } }) => ({
      value: r.value as EmployeeRole,
      label: r.label,
      metadata: r.metadata,
    }));
  } catch (error) {
    console.warn('Failed to fetch roles from API, using fallback:', error);
    return EMPLOYEE_ROLES.map(r => ({
      value: r.value,
      label: r.label,
      metadata: { managerLevel: r.managerLevel },
    }));
  }
}

// ============================================================================
// Employee API
// ============================================================================

export interface EmployeeListOptions {
  page?: number;
  size?: number;
  sort?: string;
  department?: string;
  status?: 'active' | 'inactive' | 'on_leave';
  search?: string;
}

export async function getEmployees(
  accessToken?: string,
  options: EmployeeListOptions = {}
): Promise<{ content: Employee[]; totalElements: number; totalPages: number }> {
  const params = new URLSearchParams();
  if (options.page !== undefined) params.append('page', options.page.toString());
  if (options.size !== undefined) params.append('size', options.size.toString());
  if (options.sort) params.append('sort', options.sort);
  if (options.department) params.append('department', options.department);
  if (options.status) params.append('status', options.status);
  if (options.search) params.append('search', options.search);

  try {
    const endpoint = `/api/v1/employees${params.toString() ? `?${params.toString()}` : ''}`;
    return await platformFetch<{ content: Employee[]; totalElements: number; totalPages: number }>(
      endpoint,
      accessToken
    );
  } catch (error) {
    console.error('Failed to fetch employees:', error);
    return { content: [], totalElements: 0, totalPages: 0 };
  }
}

export async function getEmployeeById(
  id: string,
  accessToken?: string
): Promise<Employee | null> {
  try {
    return await platformFetch<Employee>(`/api/v1/employees/${id}`, accessToken);
  } catch (error) {
    console.error('Failed to fetch employee:', error);
    return null;
  }
}

export async function getEmployeeStats(accessToken?: string): Promise<EmployeeStats> {
  try {
    return await platformFetch<EmployeeStats>('/api/v1/employees/stats', accessToken);
  } catch (error) {
    console.error('Failed to fetch employee stats:', error);
    return {
      total: 0,
      active: 0,
      inactive: 0,
      onLeave: 0,
      byDepartment: {},
    };
  }
}

export async function getEmployeesByDepartment(
  department: Department,
  accessToken?: string,
  options: { page?: number; size?: number } = {}
): Promise<{ content: Employee[]; totalElements: number; totalPages: number }> {
  const params = new URLSearchParams();
  if (options.page !== undefined) params.append('page', options.page.toString());
  if (options.size !== undefined) params.append('size', options.size.toString());

  try {
    const endpoint = `/api/v1/employees/by-department/${department}${params.toString() ? `?${params.toString()}` : ''}`;
    return await platformFetch<{ content: Employee[]; totalElements: number; totalPages: number }>(
      endpoint,
      accessToken
    );
  } catch (error) {
    console.error('Failed to fetch employees by department:', error);
    return { content: [], totalElements: 0, totalPages: 0 };
  }
}

export async function getEmployeesByRole(
  role: EmployeeRole,
  accessToken?: string,
  options: { page?: number; size?: number } = {}
): Promise<{ content: Employee[]; totalElements: number; totalPages: number }> {
  const params = new URLSearchParams();
  if (options.page !== undefined) params.append('page', options.page.toString());
  if (options.size !== undefined) params.append('size', options.size.toString());

  try {
    const endpoint = `/api/v1/employees/by-role/${role}${params.toString() ? `?${params.toString()}` : ''}`;
    return await platformFetch<{ content: Employee[]; totalElements: number; totalPages: number }>(
      endpoint,
      accessToken
    );
  } catch (error) {
    console.error('Failed to fetch employees by role:', error);
    return { content: [], totalElements: 0, totalPages: 0 };
  }
}

export async function getEmployeesByStatus(
  status: Employee['status'],
  accessToken?: string,
  options: { page?: number; size?: number } = {}
): Promise<{ content: Employee[]; totalElements: number; totalPages: number }> {
  const params = new URLSearchParams();
  if (options.page !== undefined) params.append('page', options.page.toString());
  if (options.size !== undefined) params.append('size', options.size.toString());

  try {
    const endpoint = `/api/v1/employees/by-status/${status.toUpperCase()}${params.toString() ? `?${params.toString()}` : ''}`;
    return await platformFetch<{ content: Employee[]; totalElements: number; totalPages: number }>(
      endpoint,
      accessToken
    );
  } catch (error) {
    console.error('Failed to fetch employees by status:', error);
    return { content: [], totalElements: 0, totalPages: 0 };
  }
}

export async function getEmployeesByManager(
  managerId: string,
  accessToken?: string
): Promise<Employee[]> {
  try {
    return await platformFetch<Employee[]>(`/api/v1/employees/by-manager/${managerId}`, accessToken);
  } catch (error) {
    console.error('Failed to fetch employees by manager:', error);
    return [];
  }
}

export async function getActiveEmployees(accessToken?: string): Promise<Employee[]> {
  try {
    return await platformFetch<Employee[]>('/api/v1/employees/active', accessToken);
  } catch (error) {
    console.error('Failed to fetch active employees:', error);
    return [];
  }
}

export async function searchEmployees(
  query: string,
  accessToken?: string,
  options: { page?: number; size?: number } = {}
): Promise<{ content: Employee[]; totalElements: number; totalPages: number }> {
  const params = new URLSearchParams();
  params.append('query', query);
  if (options.page !== undefined) params.append('page', options.page.toString());
  if (options.size !== undefined) params.append('size', options.size.toString());

  try {
    return await platformFetch<{ content: Employee[]; totalElements: number; totalPages: number }>(
      `/api/v1/employees/search?${params.toString()}`,
      accessToken
    );
  } catch (error) {
    console.error('Failed to search employees:', error);
    return { content: [], totalElements: 0, totalPages: 0 };
  }
}

export async function createEmployee(
  data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>,
  accessToken?: string
): Promise<Employee | null> {
  try {
    return await platformFetch<Employee>(
      '/api/v1/employees',
      accessToken,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  } catch (error) {
    console.error('Failed to create employee:', error);
    return null;
  }
}

export async function updateEmployee(
  id: string,
  data: Partial<Employee>,
  accessToken?: string
): Promise<Employee | null> {
  try {
    return await platformFetch<Employee>(
      `/api/v1/employees/${id}`,
      accessToken,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  } catch (error) {
    console.error('Failed to update employee:', error);
    return null;
  }
}

export async function deleteEmployee(
  id: string,
  accessToken?: string
): Promise<boolean> {
  try {
    await platformFetch<void>(`/api/v1/employees/${id}`, accessToken, { method: 'DELETE' });
    return true;
  } catch (error) {
    console.error('Failed to delete employee:', error);
    return false;
  }
}

// ============================================================================
// Store Settings API Functions
// ============================================================================

export async function getStoreSettings(accessToken?: string): Promise<StoreSettings> {
  try {
    return await platformFetch<StoreSettings>('/api/settings/store', accessToken);
  } catch (error) {
    console.error('Failed to fetch store settings:', error);
    return {
      storeName: '',
      storeEmail: '',
      currency: 'USD',
      timezone: 'America/New_York',
      enableGuestCheckout: true,
      showOutOfStock: true,
      enableReviews: true,
      enableWishlist: true,
      defaultPageSize: 50,
    };
  }
}

export async function updateStoreSettings(
  settings: Partial<StoreSettings>,
  accessToken?: string
): Promise<StoreSettings | null> {
  try {
    return await platformFetch<StoreSettings>(
      '/api/settings/store',
      accessToken,
      {
        method: 'PUT',
        body: JSON.stringify(settings),
      }
    );
  } catch (error) {
    console.error('Failed to update store settings:', error);
    return null;
  }
}

export async function getShippingMethods(accessToken?: string): Promise<ShippingMethod[]> {
  try {
    return await platformFetch<ShippingMethod[]>('/api/settings/shipping-methods', accessToken);
  } catch (error) {
    console.error('Failed to fetch shipping methods:', error);
    return [];
  }
}

export async function updateShippingMethods(
  methods: ShippingMethod[],
  accessToken?: string
): Promise<ShippingMethod[]> {
  try {
    return await platformFetch<ShippingMethod[]>(
      '/api/settings/shipping-methods',
      accessToken,
      {
        method: 'PUT',
        body: JSON.stringify(methods),
      }
    );
  } catch (error) {
    console.error('Failed to update shipping methods:', error);
    return [];
  }
}

export async function getPaymentMethods(accessToken?: string): Promise<PaymentMethod[]> {
  try {
    return await platformFetch<PaymentMethod[]>('/api/settings/payment-methods', accessToken);
  } catch (error) {
    console.error('Failed to fetch payment methods:', error);
    return [];
  }
}

export async function updatePaymentMethods(
  methods: PaymentMethod[],
  accessToken?: string
): Promise<PaymentMethod[]> {
  try {
    return await platformFetch<PaymentMethod[]>(
      '/api/settings/payment-methods',
      accessToken,
      {
        method: 'PUT',
        body: JSON.stringify(methods),
      }
    );
  } catch (error) {
    console.error('Failed to update payment methods:', error);
    return [];
  }
}

export async function getNotificationSettings(accessToken?: string): Promise<NotificationSettings> {
  try {
    return await platformFetch<NotificationSettings>('/api/settings/notifications', accessToken);
  } catch (error) {
    console.error('Failed to fetch notification settings:', error);
    return {
      orderNotifications: true,
      lowStockAlerts: true,
      customerRegistration: true,
      orderStatusEmails: true,
    };
  }
}

export async function updateNotificationSettings(
  settings: Partial<NotificationSettings>,
  accessToken?: string
): Promise<NotificationSettings | null> {
  try {
    return await platformFetch<NotificationSettings>(
      '/api/settings/notifications',
      accessToken,
      {
        method: 'PUT',
        body: JSON.stringify(settings),
      }
    );
  } catch (error) {
    console.error('Failed to update notification settings:', error);
    return null;
  }
}

// ============================================================================
// Export
// ============================================================================

export const platformAPI = {
  // Orders
  getOrderStats,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getTotalRevenue,
  getRecentOrders,
  // Customers
  getCustomers,
  getCustomerById,
  getCustomerStats,
  // Inventory
  getLowStockItems,
  getInventoryStats,
  // Dashboard
  getDashboardStats,
  getRecentActivity,
  // Employees
  getEmployees,
  getEmployeeById,
  getEmployeeStats,
  getEmployeesByDepartment,
  getEmployeesByRole,
  getEmployeesByStatus,
  getEmployeesByManager,
  getActiveEmployees,
  searchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  // Store Settings
  getStoreSettings,
  updateStoreSettings,
  getShippingMethods,
  updateShippingMethods,
  getPaymentMethods,
  updatePaymentMethods,
  getNotificationSettings,
  updateNotificationSettings,
  // Utils
  formatCurrency,
  formatTimeAgo,
};

export default platformAPI;
