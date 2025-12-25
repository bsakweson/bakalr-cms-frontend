/**
 * Customers Service API Client
 *
 * Connects CMS frontend to boutique-platform customer services.
 * Uses the CMS JWT token for authentication.
 */
import axios, { AxiosInstance } from 'axios';
import { getRuntimeConfig } from '@/lib/runtime-config';
import { getOrganizationIdFromToken } from '@/lib/jwt';

// Customers Service Configuration
const getCustomersConfig = () => {
  const runtimeConfig = getRuntimeConfig();
  return {
    BASE_URL: runtimeConfig.platformApiUrl,
    CONTEXT_PATH: '/api/v1/customers',
  };
};

// ============= Types =============

export type AddressType = 'HOME' | 'WORK' | 'OTHER';

export interface PreferencesRequest {
  newsletter: boolean;
  marketingEmails: boolean;
  orderUpdates: boolean;
  smsNotifications: boolean;
}

export interface PreferencesResponse {
  newsletter: boolean;
  marketingEmails: boolean;
  orderUpdates: boolean;
  smsNotifications: boolean;
}

export interface AddressRequest {
  label?: string;
  type: AddressType;
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
  isDefault?: boolean;
}

export interface AddressResponse {
  id: string;
  label?: string;
  type: AddressType;
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WishlistItemRequest {
  productId: string;
  productName: string;
  productSlug?: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  inStock?: boolean;
}

export interface WishlistItemResponse {
  id: string;
  productId: string;
  productName: string;
  productSlug?: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  inStock: boolean;
  addedAt: string;
}

export interface CustomerResponse {
  id: string;
  cmsUserId: string;
  avatarUrl?: string;
  preferences: PreferencesResponse;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFromCmsRequest {
  cmsUserId: string;
}

export interface AvatarRequest {
  avatarUrl: string;
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

export interface WishlistParams {
  page?: number;
  size?: number;
}

// ============= API Client Factory =============

function createCustomersClient(baseURL: string): AxiosInstance {
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
    const config = getCustomersConfig();
    _client = createCustomersClient(`${config.BASE_URL}${config.CONTEXT_PATH}`);
  }
  return _client;
}

// ============= API Methods =============

export const customersApi = {
  // -------- Customer Query Operations --------

  /**
   * Get customer profile by ID
   */
  async getCustomer(customerId: string): Promise<CustomerResponse> {
    const { data } = await getClient().get<CustomerResponse>(`/${customerId}`);
    return data;
  },

  /**
   * Get customer by CMS user ID
   */
  async getCustomerByCmsUserId(cmsUserId: string): Promise<CustomerResponse> {
    const { data } = await getClient().get<CustomerResponse>(`/cms-user/${cmsUserId}`);
    return data;
  },

  // -------- Customer Command Operations --------

  /**
   * Create customer from CMS user
   */
  async createFromCmsUser(request: CreateFromCmsRequest): Promise<string> {
    const { data } = await getClient().post<string>('', request);
    return data;
  },

  /**
   * Update customer preferences
   */
  async updatePreferences(customerId: string, request: PreferencesRequest): Promise<void> {
    await getClient().put(`/${customerId}/preferences`, request);
  },

  /**
   * Update customer avatar
   */
  async updateAvatar(customerId: string, request: AvatarRequest): Promise<void> {
    await getClient().post(`/${customerId}/avatar`, request);
  },

  /**
   * Delete customer avatar
   */
  async deleteAvatar(customerId: string): Promise<void> {
    await getClient().delete(`/${customerId}/avatar`);
  },

  /**
   * Delete customer
   */
  async deleteCustomer(customerId: string, hardDelete: boolean = false): Promise<void> {
    await getClient().delete(`/${customerId}`, {
      params: { hardDelete },
    });
  },

  // -------- Address Query Operations --------

  /**
   * Get all addresses for a customer
   */
  async getAddresses(customerId: string): Promise<AddressResponse[]> {
    const { data } = await getClient().get<AddressResponse[]>(`/${customerId}/addresses`);
    return data;
  },

  /**
   * Get a specific address
   */
  async getAddress(customerId: string, addressId: string): Promise<AddressResponse> {
    const { data } = await getClient().get<AddressResponse>(
      `/${customerId}/addresses/${addressId}`
    );
    return data;
  },

  /**
   * Get default address
   */
  async getDefaultAddress(customerId: string): Promise<AddressResponse | null> {
    try {
      const { data } = await getClient().get<AddressResponse>(
        `/${customerId}/addresses/default`
      );
      return data;
    } catch {
      return null;
    }
  },

  /**
   * Get address count
   */
  async getAddressCount(customerId: string): Promise<number> {
    const { data } = await getClient().get<number>(`/${customerId}/addresses/count`);
    return data;
  },

  // -------- Address Command Operations --------

  /**
   * Add a new address
   */
  async addAddress(customerId: string, request: AddressRequest): Promise<string> {
    const { data } = await getClient().post<string>(`/${customerId}/addresses`, request);
    return data;
  },

  /**
   * Update an address
   */
  async updateAddress(
    customerId: string,
    addressId: string,
    request: AddressRequest
  ): Promise<void> {
    await getClient().put(`/${customerId}/addresses/${addressId}`, request);
  },

  /**
   * Delete an address
   */
  async deleteAddress(customerId: string, addressId: string): Promise<void> {
    await getClient().delete(`/${customerId}/addresses/${addressId}`);
  },

  /**
   * Set default address
   */
  async setDefaultAddress(customerId: string, addressId: string): Promise<void> {
    await getClient().put(`/${customerId}/addresses/${addressId}/default`);
  },

  // -------- Wishlist Query Operations --------

  /**
   * Get wishlist items (paginated)
   */
  async getWishlist(
    customerId: string,
    params: WishlistParams = {}
  ): Promise<PaginatedResponse<WishlistItemResponse>> {
    const { data } = await getClient().get<PaginatedResponse<WishlistItemResponse>>(
      `/${customerId}/wishlist`,
      {
        params: {
          page: params.page || 0,
          size: params.size || 20,
        },
      }
    );
    return data;
  },

  /**
   * Check if product is in wishlist
   */
  async isInWishlist(customerId: string, productId: string): Promise<boolean> {
    const { data } = await getClient().get<boolean>(
      `/${customerId}/wishlist/check/${productId}`
    );
    return data;
  },

  /**
   * Get wishlist count
   */
  async getWishlistCount(customerId: string): Promise<number> {
    const { data } = await getClient().get<number>(`/${customerId}/wishlist/count`);
    return data;
  },

  // -------- Wishlist Command Operations --------

  /**
   * Add item to wishlist
   */
  async addToWishlist(customerId: string, request: WishlistItemRequest): Promise<string> {
    const { data } = await getClient().post<string>(`/${customerId}/wishlist`, request);
    return data;
  },

  /**
   * Remove item from wishlist by ID
   */
  async removeFromWishlist(customerId: string, wishlistItemId: string): Promise<void> {
    await getClient().delete(`/${customerId}/wishlist/${wishlistItemId}`);
  },

  /**
   * Remove item from wishlist by product ID
   */
  async removeFromWishlistByProductId(customerId: string, productId: string): Promise<void> {
    await getClient().delete(`/${customerId}/wishlist/product/${productId}`);
  },

  /**
   * Clear entire wishlist
   */
  async clearWishlist(customerId: string): Promise<void> {
    await getClient().delete(`/${customerId}/wishlist`);
  },

  // -------- Utility Methods --------

  /**
   * Check if customers service is available
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

export default customersApi;
