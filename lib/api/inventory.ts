/**
 * Inventory Service API Client
 *
 * Connects CMS frontend to boutique-platform inventory services.
 * Uses the CMS JWT token for authentication.
 */
import axios, { AxiosInstance } from 'axios';
import { getRuntimeConfig } from '@/lib/runtime-config';
import { getOrganizationIdFromToken } from '@/lib/jwt';

// Inventory Service Configuration - uses runtime config for flexibility
const getInventoryConfig = () => {
  const runtimeConfig = getRuntimeConfig();
  return {
    BASE_URL: runtimeConfig.platformApiUrl,
    CONTEXT_PATH: '/api/v1/inventory',
  };
};

// ============= Types =============

export interface InventoryItem {
  id: string;
  tenantId: string;
  productId: string;
  variantId?: string;
  sku: string;
  quantityAvailable: number;
  quantityReserved: number;
  quantityOnOrder: number;
  totalQuantity: number;
  reorderLevel: number;
  reorderQuantity: number;
  locationCode?: string;
  warehouseId?: string;
  supplierId?: string;
  costPrice: number;
  isLowStock: boolean;
  lastCountedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItemResponse extends InventoryItem {}

export interface PaginatedInventoryResponse {
  items: InventoryItemResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface InventoryStatsResponse {
  totalItems: number;
  totalQuantityAvailable: number;
  totalQuantityReserved: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalWarehouses: number;
  totalSuppliers: number;
  totalInventoryValue: number;
}

export interface CreateInventoryItemRequest {
  productId: string;
  variantId?: string;
  sku: string;
  initialQuantity: number;
  reorderLevel?: number;
  reorderQuantity?: number;
  locationCode?: string;
  warehouseId?: string;
  supplierId?: string;
  costPrice?: number;
}

export interface AdjustInventoryRequest {
  newQuantity: number;
  reason: string;
  adjustmentType?: 'RESTOCK' | 'SALE' | 'RETURN' | 'DAMAGE' | 'COUNT' | 'OTHER';
  referenceId?: string;
  referenceType?: string;
}

export interface BulkUpdateItem {
  sku: string;
  newQuantity: number;
  reason?: string;
}

export interface BulkUpdateRequest {
  items: BulkUpdateItem[];
  reason: string;
}

export interface BulkUpdateResponse {
  successful: number;
  failed: number;
  errors: { sku: string; error: string }[];
}

export interface InventoryListParams {
  page?: number;
  pageSize?: number;
  warehouseId?: string;
  supplierId?: string;
  lowStockOnly?: boolean;
  outOfStockOnly?: boolean;
  search?: string;
}

// ============= API Client Factory =============

/**
 * Create an axios instance for inventory service
 */
function createInventoryClient(baseURL: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  // Add auth token and tenant ID from CMS session
  client.interceptors.request.use((config) => {
    // Get CMS JWT token
    const token = localStorage.getItem('access_token');

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;

      // Extract org_id from JWT to use as X-Tenant-ID
      const orgId = getOrganizationIdFromToken(token);
      if (orgId) {
        config.headers['X-Tenant-ID'] = orgId;
      }
    }
    return config;
  });

  return client;
}

// Lazy-initialized client
let _client: AxiosInstance | null = null;

function getClient(): AxiosInstance {
  if (!_client) {
    const config = getInventoryConfig();
    _client = createInventoryClient(`${config.BASE_URL}${config.CONTEXT_PATH}`);
  }
  return _client;
}

// ============= API Methods =============

export const inventoryApi = {
  // -------- Query Operations (Read) --------

  /**
   * Get paginated list of inventory items
   */
  async getItems(params: InventoryListParams = {}): Promise<PaginatedInventoryResponse> {
    const { data } = await getClient().get<PaginatedInventoryResponse>('/items', {
      params: {
        page: params.page || 1,
        pageSize: params.pageSize || 20,
        warehouseId: params.warehouseId,
        supplierId: params.supplierId,
        lowStockOnly: params.lowStockOnly || false,
        outOfStockOnly: params.outOfStockOnly || false,
        search: params.search,
      },
    });
    return data;
  },

  /**
   * Get a single inventory item by ID
   */
  async getItem(inventoryItemId: string): Promise<InventoryItemResponse> {
    const { data } = await getClient().get<InventoryItemResponse>(`/items/${inventoryItemId}`);
    return data;
  },

  /**
   * Get inventory by product ID
   */
  async getByProductId(productId: string): Promise<InventoryItemResponse[]> {
    const { data } = await getClient().get<InventoryItemResponse[]>(`/products/${productId}`);
    return data;
  },

  /**
   * Get inventory by SKU
   */
  async getBySku(sku: string): Promise<InventoryItemResponse> {
    const { data } = await getClient().get<InventoryItemResponse>(`/sku/${sku}`);
    return data;
  },

  /**
   * Get low stock items (below reorder level)
   */
  async getLowStock(): Promise<InventoryItemResponse[]> {
    const { data } = await getClient().get<InventoryItemResponse[]>('/low-stock');
    return data;
  },

  /**
   * Get inventory statistics
   */
  async getStats(warehouseId?: string): Promise<InventoryStatsResponse> {
    const { data } = await getClient().get<InventoryStatsResponse>('/stats', {
      params: { warehouseId },
    });
    return data;
  },

  // -------- Command Operations (Write) --------

  /**
   * Create a new inventory item
   */
  async createItem(request: CreateInventoryItemRequest): Promise<string> {
    const { data } = await getClient().post<string>('/items', request);
    return data; // Returns the new inventory item ID
  },

  /**
   * Adjust inventory quantity
   */
  async adjustQuantity(inventoryItemId: string, request: AdjustInventoryRequest): Promise<void> {
    await getClient().put(`/items/${inventoryItemId}/adjust`, request);
  },

  /**
   * Reserve inventory for an order
   */
  async reserve(inventoryItemId: string, quantity: number, orderId: string): Promise<void> {
    await getClient().post(`/items/${inventoryItemId}/reserve`, {
      quantity,
      orderId,
    });
  },

  /**
   * Release reserved inventory
   */
  async release(inventoryItemId: string, quantity: number, orderId: string): Promise<void> {
    await getClient().post(`/items/${inventoryItemId}/release`, {
      quantity,
      orderId,
    });
  },

  /**
   * Bulk update inventory quantities
   */
  async bulkUpdate(request: BulkUpdateRequest): Promise<BulkUpdateResponse> {
    const { data } = await getClient().post<BulkUpdateResponse>('/bulk-update', request);
    return data;
  },

  /**
   * Delete an inventory item
   */
  async deleteItem(inventoryItemId: string): Promise<void> {
    await getClient().delete(`/items/${inventoryItemId}`);
  },

  // -------- Utility Methods --------

  /**
   * Get last sync timestamp (from localStorage)
   */
  getLastSyncTime(): string | null {
    return localStorage.getItem('inventory_last_sync');
  },

  /**
   * Update last sync timestamp
   */
  setLastSyncTime(): void {
    localStorage.setItem('inventory_last_sync', new Date().toISOString());
  },
};

export default inventoryApi;
