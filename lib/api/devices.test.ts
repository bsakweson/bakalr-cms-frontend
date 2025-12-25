import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  deviceApi,
  Device,
  DeviceListResponse,
  DeviceRegistrationResponse,
  DeviceVerificationResponse,
  MessageResponse,
} from './devices';

// Mock the apiClient
vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from './client';

describe('deviceApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockDevice: Device = {
    id: 'device-123',
    device_id: 'uuid-device-123',
    name: 'MacBook Pro',
    device_type: 'desktop',
    platform: 'macos',
    os: 'macOS',
    os_version: '14.0',
    model: 'MacBook Pro',
    browser: 'Chrome',
    browser_version: '120.0',
    app_version: null,
    status: 'active',
    verified: true,
    verified_at: '2025-01-01T00:00:00Z',
    is_trusted: true,
    push_enabled: false,
    last_used_at: '2025-01-15T10:30:00Z',
    last_ip_address: '192.168.1.100',
    last_location: 'New York, US',
    created_at: '2025-01-01T00:00:00Z',
    display_name: 'MacBook Pro - Chrome',
    is_mobile: false,
    can_receive_push: false,
  };

  describe('listDevices', () => {
    it('should list all devices for current user', async () => {
      const mockResponse: DeviceListResponse = {
        devices: [mockDevice],
        total: 1,
      };
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockResponse });

      const result = await deviceApi.listDevices();

      expect(apiClient.get).toHaveBeenCalledWith('/devices');
      expect(result).toEqual(mockResponse);
      expect(result.devices).toHaveLength(1);
    });
  });

  describe('getDevice', () => {
    it('should get a specific device by ID', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDevice });

      const result = await deviceApi.getDevice('device-123');

      expect(apiClient.get).toHaveBeenCalledWith('/devices/device-123');
      expect(result).toEqual(mockDevice);
    });
  });

  describe('registerDevice', () => {
    it('should register a new device', async () => {
      const mockResponse: DeviceRegistrationResponse = {
        device: mockDevice,
        requires_verification: true,
        message: 'Device registered successfully. Verification code sent.',
      };
      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

      const result = await deviceApi.registerDevice({
        device_type: 'desktop',
        platform: 'macos',
        os: 'macOS',
        os_version: '14.0',
        browser: 'Chrome',
        browser_version: '120.0',
      });

      expect(apiClient.post).toHaveBeenCalledWith('/devices/register', {
        device_type: 'desktop',
        platform: 'macos',
        os: 'macOS',
        os_version: '14.0',
        browser: 'Chrome',
        browser_version: '120.0',
      });
      expect(result.requires_verification).toBe(true);
    });

    it('should register device with push token', async () => {
      const mockResponse: DeviceRegistrationResponse = {
        device: { ...mockDevice, push_enabled: true },
        requires_verification: false,
        message: 'Device registered successfully.',
      };
      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

      await deviceApi.registerDevice({
        device_type: 'mobile',
        platform: 'ios',
        push_token: 'fcm-token-123',
        push_provider: 'fcm',
      });

      expect(apiClient.post).toHaveBeenCalledWith('/devices/register', {
        device_type: 'mobile',
        platform: 'ios',
        push_token: 'fcm-token-123',
        push_provider: 'fcm',
      });
    });
  });

  describe('sendVerificationCode', () => {
    it('should send verification code to device', async () => {
      const mockResponse: MessageResponse = { message: 'Verification code sent' };
      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

      const result = await deviceApi.sendVerificationCode('device-123');

      expect(apiClient.post).toHaveBeenCalledWith('/devices/device-123/send-verification');
      expect(result.message).toBe('Verification code sent');
    });
  });

  describe('verifyDevice', () => {
    it('should verify a device with code', async () => {
      const mockResponse: DeviceVerificationResponse = {
        verified: true,
        device: { ...mockDevice, verified: true },
        message: 'Device verified successfully',
      };
      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

      const result = await deviceApi.verifyDevice({
        device_id: 'uuid-device-123',
        code: '123456',
      });

      expect(apiClient.post).toHaveBeenCalledWith('/devices/verify', {
        device_id: 'uuid-device-123',
        code: '123456',
      });
      expect(result.verified).toBe(true);
    });
  });

  describe('updateDevice', () => {
    it('should update device name', async () => {
      const updatedDevice = { ...mockDevice, name: 'Work Laptop' };
      vi.mocked(apiClient.patch).mockResolvedValue({ data: updatedDevice });

      const result = await deviceApi.updateDevice('device-123', { name: 'Work Laptop' });

      expect(apiClient.patch).toHaveBeenCalledWith('/devices/device-123', { name: 'Work Laptop' });
      expect(result.name).toBe('Work Laptop');
    });
  });

  describe('updatePushToken', () => {
    it('should update device push token', async () => {
      const updatedDevice = { ...mockDevice, push_enabled: true };
      vi.mocked(apiClient.post).mockResolvedValue({ data: updatedDevice });

      const result = await deviceApi.updatePushToken('device-123', {
        push_token: 'new-fcm-token',
        push_provider: 'fcm',
      });

      expect(apiClient.post).toHaveBeenCalledWith('/devices/device-123/push-token', {
        push_token: 'new-fcm-token',
        push_provider: 'fcm',
      });
      expect(result.push_enabled).toBe(true);
    });
  });

  describe('setTrust', () => {
    it('should set device as trusted', async () => {
      const trustedDevice = { ...mockDevice, is_trusted: true };
      vi.mocked(apiClient.post).mockResolvedValue({ data: trustedDevice });

      const result = await deviceApi.setTrust({
        device_id: 'uuid-device-123',
        trust: true,
      });

      expect(apiClient.post).toHaveBeenCalledWith('/devices/trust', {
        device_id: 'uuid-device-123',
        trust: true,
      });
      expect(result.is_trusted).toBe(true);
    });

    it('should remove trust from device', async () => {
      const untrustedDevice = { ...mockDevice, is_trusted: false };
      vi.mocked(apiClient.post).mockResolvedValue({ data: untrustedDevice });

      const result = await deviceApi.setTrust({
        device_id: 'uuid-device-123',
        trust: false,
      });

      expect(result.is_trusted).toBe(false);
    });
  });

  describe('suspendDevice', () => {
    it('should suspend a device', async () => {
      const suspendedDevice = { ...mockDevice, status: 'suspended' as const };
      vi.mocked(apiClient.post).mockResolvedValue({ data: suspendedDevice });

      const result = await deviceApi.suspendDevice({
        device_id: 'uuid-device-123',
        reason: 'Suspicious activity detected',
      });

      expect(apiClient.post).toHaveBeenCalledWith('/devices/suspend', {
        device_id: 'uuid-device-123',
        reason: 'Suspicious activity detected',
      });
      expect(result.status).toBe('suspended');
    });
  });

  describe('reactivateDevice', () => {
    it('should reactivate a suspended device', async () => {
      const reactivatedDevice = { ...mockDevice, status: 'active' as const };
      vi.mocked(apiClient.post).mockResolvedValue({ data: reactivatedDevice });

      const result = await deviceApi.reactivateDevice('device-123');

      expect(apiClient.post).toHaveBeenCalledWith('/devices/device-123/reactivate');
      expect(result.status).toBe('active');
    });
  });

  describe('revokeDevice', () => {
    it('should revoke/remove a device', async () => {
      const mockResponse: MessageResponse = { message: 'Device revoked successfully' };
      vi.mocked(apiClient.delete).mockResolvedValue({ data: mockResponse });

      const result = await deviceApi.revokeDevice('device-123');

      expect(apiClient.delete).toHaveBeenCalledWith('/devices/device-123');
      expect(result.message).toBe('Device revoked successfully');
    });
  });

  describe('getCurrentDevice', () => {
    it('should get current device info', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDevice });

      const result = await deviceApi.getCurrentDevice();

      expect(apiClient.get).toHaveBeenCalledWith('/devices/current');
      expect(result).toEqual(mockDevice);
    });
  });

  describe('API path consistency', () => {
    it('should use /devices base path for all endpoints', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDevice });
      vi.mocked(apiClient.post).mockResolvedValue({ data: { device: mockDevice, requires_verification: false, message: 'ok' } });
      vi.mocked(apiClient.patch).mockResolvedValue({ data: mockDevice });
      vi.mocked(apiClient.delete).mockResolvedValue({ data: { message: 'ok' } });

      await deviceApi.listDevices();
      await deviceApi.getDevice('device-123');
      await deviceApi.getCurrentDevice();
      await deviceApi.registerDevice({ device_type: 'desktop', platform: 'web' });
      await deviceApi.verifyDevice({ device_id: 'uuid', code: '123456' });
      await deviceApi.updateDevice('device-123', { name: 'New Name' });
      await deviceApi.revokeDevice('device-123');

      // All paths should be relative (baseURL handles /api/v1)
      expect(vi.mocked(apiClient.get).mock.calls[0][0]).toBe('/devices');
      expect(vi.mocked(apiClient.get).mock.calls[1][0]).toBe('/devices/device-123');
      expect(vi.mocked(apiClient.get).mock.calls[2][0]).toBe('/devices/current');
      expect(vi.mocked(apiClient.post).mock.calls[0][0]).toBe('/devices/register');
      expect(vi.mocked(apiClient.post).mock.calls[1][0]).toBe('/devices/verify');
      expect(vi.mocked(apiClient.patch).mock.calls[0][0]).toBe('/devices/device-123');
      expect(vi.mocked(apiClient.delete).mock.calls[0][0]).toBe('/devices/device-123');
    });
  });
});
