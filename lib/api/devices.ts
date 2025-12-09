/**
 * Device Management API client
 * Supports device registration, verification, push tokens, and management
 */

import { apiClient } from './client';

// Types
export interface Device {
  id: string;
  device_id: string;
  name: string;
  device_type: string;
  platform: string;
  os: string;
  os_version: string | null;
  model: string | null;
  browser: string | null;
  browser_version: string | null;
  app_version: string | null;
  status: 'active' | 'inactive' | 'suspended' | 'revoked';
  verified: boolean;
  verified_at: string | null;
  is_trusted: boolean;
  push_enabled: boolean;
  last_used_at: string | null;
  last_ip_address: string | null;
  last_location: string | null;
  created_at: string;
  display_name: string;
  is_mobile: boolean;
  can_receive_push: boolean;
}

export interface DeviceListResponse {
  devices: Device[];
  total: number;
}

export interface DeviceRegisterRequest {
  device_id?: string;
  name?: string;
  device_type: string;
  platform: string;
  os?: string;
  os_version?: string;
  model?: string;
  browser?: string;
  browser_version?: string;
  app_version?: string;
  push_token?: string;
  push_provider?: string;
}

export interface DeviceRegistrationResponse {
  device: Device;
  requires_verification: boolean;
  message: string;
}

export interface DeviceVerifyRequest {
  device_id: string;
  code: string;
}

export interface DeviceVerificationResponse {
  verified: boolean;
  device: Device;
  message: string;
}

export interface DeviceUpdateRequest {
  name?: string;
  push_token?: string;
  push_provider?: string;
}

export interface DevicePushTokenRequest {
  push_token: string;
  push_provider: string;
}

export interface DeviceTrustRequest {
  device_id: string;
  trust: boolean;
}

export interface DeviceSuspendRequest {
  device_id: string;
  reason?: string;
}

export interface MessageResponse {
  message: string;
}

// API Client
export const deviceApi = {
  /**
   * List all devices for the current user
   */
  async listDevices(): Promise<DeviceListResponse> {
    const response = await apiClient.get<DeviceListResponse>('/devices');
    return response.data;
  },

  /**
   * Get a specific device by ID
   */
  async getDevice(deviceId: string): Promise<Device> {
    const response = await apiClient.get<Device>(`/devices/${deviceId}`);
    return response.data;
  },

  /**
   * Register a new device
   */
  async registerDevice(data: DeviceRegisterRequest): Promise<DeviceRegistrationResponse> {
    const response = await apiClient.post<DeviceRegistrationResponse>('/devices/register', data);
    return response.data;
  },

  /**
   * Send verification code to device
   */
  async sendVerificationCode(deviceId: string): Promise<MessageResponse> {
    const response = await apiClient.post<MessageResponse>(`/devices/${deviceId}/send-verification`);
    return response.data;
  },

  /**
   * Verify a device with code
   */
  async verifyDevice(data: DeviceVerifyRequest): Promise<DeviceVerificationResponse> {
    const response = await apiClient.post<DeviceVerificationResponse>('/devices/verify', data);
    return response.data;
  },

  /**
   * Update device information
   */
  async updateDevice(deviceId: string, data: DeviceUpdateRequest): Promise<Device> {
    const response = await apiClient.patch<Device>(`/devices/${deviceId}`, data);
    return response.data;
  },

  /**
   * Update device push token
   */
  async updatePushToken(deviceId: string, data: DevicePushTokenRequest): Promise<Device> {
    const response = await apiClient.post<Device>(`/devices/${deviceId}/push-token`, data);
    return response.data;
  },

  /**
   * Set device trust status
   */
  async setTrust(data: DeviceTrustRequest): Promise<Device> {
    const response = await apiClient.post<Device>('/devices/trust', data);
    return response.data;
  },

  /**
   * Suspend a device
   */
  async suspendDevice(data: DeviceSuspendRequest): Promise<Device> {
    const response = await apiClient.post<Device>('/devices/suspend', data);
    return response.data;
  },

  /**
   * Reactivate a suspended device
   */
  async reactivateDevice(deviceId: string): Promise<Device> {
    const response = await apiClient.post<Device>(`/devices/${deviceId}/reactivate`);
    return response.data;
  },

  /**
   * Revoke/remove a device
   */
  async revokeDevice(deviceId: string): Promise<MessageResponse> {
    const response = await apiClient.delete<MessageResponse>(`/devices/${deviceId}`);
    return response.data;
  },

  /**
   * Get current device info (from X-Device-ID header)
   */
  async getCurrentDevice(): Promise<Device> {
    const response = await apiClient.get<Device>('/devices/current');
    return response.data;
  },
};

export default deviceApi;
