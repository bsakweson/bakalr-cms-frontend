/**
 * Orders Service API Client
 *
 * Connects CMS frontend to boutique-platform orders services.
 * Uses the CMS JWT token for authentication.
 */
import axios, { AxiosInstance } from 'axios';
import { getRuntimeConfig } from '@/lib/runtime-config';
import { getOrganizationIdFromToken } from '@/lib/jwt';

// Orders Service Configuration
const getOrdersConfig = () => {
  const runtimeConfig = getRuntimeConfig();
  return {
    BASE_URL: runtimeConfig.platformApiUrl,
    CONTEXT_PATH: '/api/v1/orders',
  };
};

// ============= Types =============

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'READY_FOR_PICKUP'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED'
  | 'REFUNDED'
  | 'ON_HOLD';

export type OrderType =
  | 'STANDARD'
  | 'EXPRESS'
  | 'SAME_DAY'
  | 'PICKUP'
  | 'SUBSCRIPTION'
  | 'PRE_ORDER'
  | 'BACKORDER'
  | 'WHOLESALE';

export type PaymentStatus =
  | 'PENDING'
  | 'AUTHORIZED'
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'
  | 'FAILED'
  | 'CANCELLED';

export interface AddressRequest {
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
  isDefault?: boolean;
}

export interface AddressResponse extends AddressRequest {
  id?: string;
}

export interface OrderItemRequest {
  productId: string;
  productName: string;
  productSku?: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  taxAmount?: number;
  weight?: number;
  dimensions?: string;
  notes?: string;
}

export interface OrderItemResponse extends OrderItemRequest {
  id: string;
  totalPrice: number;
}

export interface Money {
  amount: number;
  currency: string;
}

export interface CreateOrderRequest {
  customerId: string;
  shopId: string;
  orderType: OrderType;
  currencyCode: string;
  items: OrderItemRequest[];
  shippingAddress: AddressRequest;
  billingAddress?: AddressRequest;
  taxAmount?: number;
  shippingAmount?: number;
  discountAmount?: number;
  notes?: string;
  shippingMethod?: string;
  paymentMethod?: string;
  expectedDeliveryDate?: string;
  priority?: number;
  correlationId?: string;
}

export interface UpdateOrderRequest {
  notes?: string;
  trackingNumber?: string;
  shippingMethod?: string;
  paymentMethod?: string;
  paymentReference?: string;
  expectedDeliveryDate?: string;
  priority?: number;
  correlationId?: string;
}

export interface CancelOrderRequest {
  reason?: string;
  cancelledBy?: string;
}

export interface ProcessPaymentRequest {
  customerId?: string;
  paymentMethod?: string;
  amount?: Money;
  status?: PaymentStatus;
  paymentReference?: string;
  billingAddress?: AddressRequest;
  correlationId?: string;
}

export interface UpdateShippingRequest {
  customerId?: string;
  carrier?: string;
  serviceLevel?: string;
  cost?: Money;
  deliveryAddress?: AddressRequest;
  correlationId?: string;
}

export interface PaymentInfoResponse {
  method: string;
  status: PaymentStatus;
  reference: string;
  paidAt?: string;
}

export interface ShippingInfoResponse {
  method: string;
  carrier?: string;
  trackingNumber?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

export interface OrderResponse {
  id: string;
  orderNumber: string;
  tenantId: string;
  customerId: string;
  shopId: string;
  status: OrderStatus;
  orderType: OrderType;
  paymentStatus: PaymentStatus;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  currencyCode: string;
  notes?: string;
  trackingNumber?: string;
  shippingMethod?: string;
  paymentMethod?: string;
  paymentReference?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  refundedAt?: string;
  expectedDeliveryDate?: string;
  priority: number;
  correlationId?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItemResponse[];
  shippingAddress: AddressResponse;
  billingAddress?: AddressResponse;
  paymentInfo?: PaymentInfoResponse;
  shippingInfo?: ShippingInfoResponse;
}

export interface OrderStatsResponse {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  paidOrders: number;
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

export interface OrderListParams {
  page?: number;
  size?: number;
  sort?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  customerId?: string;
  shopId?: string;
}

// ============= API Client Factory =============

function createOrdersClient(baseURL: string): AxiosInstance {
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
    const config = getOrdersConfig();
    _client = createOrdersClient(`${config.BASE_URL}${config.CONTEXT_PATH}`);
  }
  return _client;
}

// ============= API Methods =============

export const ordersApi = {
  // -------- Query Operations (Read) --------

  /**
   * Get paginated list of orders
   */
  async getOrders(params: OrderListParams = {}): Promise<PaginatedResponse<OrderResponse>> {
    const { data } = await getClient().get<PaginatedResponse<OrderResponse>>('', {
      params: {
        page: params.page || 0,
        size: params.size || 20,
        sort: params.sort,
        status: params.status,
        paymentStatus: params.paymentStatus,
      },
    });
    return data;
  },

  /**
   * Get a single order by ID
   */
  async getOrder(orderId: string): Promise<OrderResponse> {
    const { data } = await getClient().get<OrderResponse>(`/${orderId}`);
    return data;
  },

  /**
   * Get orders by customer ID
   */
  async getOrdersByCustomer(
    customerId: string,
    params: Omit<OrderListParams, 'customerId'> = {}
  ): Promise<PaginatedResponse<OrderResponse>> {
    const { data } = await getClient().get<PaginatedResponse<OrderResponse>>(
      `/customer/${customerId}`,
      { params }
    );
    return data;
  },

  /**
   * Get orders by shop ID
   */
  async getOrdersByShop(
    shopId: string,
    params: Omit<OrderListParams, 'shopId'> = {}
  ): Promise<PaginatedResponse<OrderResponse>> {
    const { data } = await getClient().get<PaginatedResponse<OrderResponse>>(
      `/shop/${shopId}`,
      { params }
    );
    return data;
  },

  /**
   * Get orders by status
   */
  async getOrdersByStatus(
    status: OrderStatus,
    params: Omit<OrderListParams, 'status'> = {}
  ): Promise<PaginatedResponse<OrderResponse>> {
    const { data } = await getClient().get<PaginatedResponse<OrderResponse>>(
      `/status/${status}`,
      { params }
    );
    return data;
  },

  /**
   * Get orders by payment status
   */
  async getOrdersByPaymentStatus(
    paymentStatus: PaymentStatus,
    params: Omit<OrderListParams, 'paymentStatus'> = {}
  ): Promise<PaginatedResponse<OrderResponse>> {
    const { data } = await getClient().get<PaginatedResponse<OrderResponse>>(
      `/payment-status/${paymentStatus}`,
      { params }
    );
    return data;
  },

  /**
   * Get orders ready for shipping
   */
  async getReadyForShipping(): Promise<OrderResponse[]> {
    const { data } = await getClient().get<OrderResponse[]>('/ready-for-shipping');
    return data;
  },

  /**
   * Get orders ready for delivery
   */
  async getReadyForDelivery(): Promise<OrderResponse[]> {
    const { data } = await getClient().get<OrderResponse[]>('/ready-for-delivery');
    return data;
  },

  /**
   * Get overdue orders
   */
  async getOverdueOrders(): Promise<OrderResponse[]> {
    const { data } = await getClient().get<OrderResponse[]>('/overdue');
    return data;
  },

  /**
   * Get high-value orders
   */
  async getHighValueOrders(minAmount: number): Promise<OrderResponse[]> {
    const { data } = await getClient().get<OrderResponse[]>('/high-value', {
      params: { minAmount },
    });
    return data;
  },

  /**
   * Get total revenue
   */
  async getTotalRevenue(): Promise<number> {
    const { data } = await getClient().get<number>('/revenue/total');
    return data;
  },

  /**
   * Get customer revenue
   */
  async getCustomerRevenue(customerId: string): Promise<number> {
    const { data } = await getClient().get<number>(`/revenue/customer/${customerId}`);
    return data;
  },

  /**
   * Get shop revenue
   */
  async getShopRevenue(shopId: string): Promise<number> {
    const { data } = await getClient().get<number>(`/revenue/shop/${shopId}`);
    return data;
  },

  /**
   * Get order statistics
   */
  async getStats(): Promise<OrderStatsResponse> {
    const { data } = await getClient().get<OrderStatsResponse>('/stats');
    return data;
  },

  // -------- Command Operations (Write) --------

  /**
   * Create a new order
   */
  async createOrder(request: CreateOrderRequest): Promise<string> {
    const { data } = await getClient().post<string>('', request);
    return data;
  },

  /**
   * Update an order
   */
  async updateOrder(orderId: string, request: UpdateOrderRequest): Promise<void> {
    await getClient().put(`/${orderId}`, request);
  },

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string, request: CancelOrderRequest = {}): Promise<void> {
    await getClient().post(`/${orderId}/cancel`, request);
  },

  /**
   * Process payment for an order
   */
  async processPayment(orderId: string, request: ProcessPaymentRequest): Promise<void> {
    await getClient().post(`/${orderId}/payment`, request);
  },

  /**
   * Update shipping information
   */
  async updateShipping(orderId: string, request: UpdateShippingRequest): Promise<void> {
    await getClient().post(`/${orderId}/shipping`, request);
  },

  // -------- Utility Methods --------

  /**
   * Check if orders service is available
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

export default ordersApi;
