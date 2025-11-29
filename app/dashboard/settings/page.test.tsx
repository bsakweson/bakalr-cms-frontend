import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsPage from './page';
import { useAuth } from '@/contexts/auth-context';
import { authApi } from '@/lib/api';

// Mock dependencies
vi.mock('@/contexts/auth-context');
vi.mock('@/lib/api');

const mockUser = {
  id: 1,
  email: 'test@example.com',
  first_name: 'John',
  last_name: 'Doe',
  full_name: 'John Doe',
  is_active: true,
  organization_id: 1,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

const mockTwoFactorStatus = {
  enabled: false,
  verified: false,
  backup_codes_remaining: 0,
  required: false,
};

const mockTwoFactorSetup = {
  secret: 'ABCD1234EFGH5678',
  qr_code: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA',
  backup_codes: ['123456', '234567', '345678', '456789', '567890', '678901', '789012', '890123', '901234', '012345'],
  message: '2FA setup initiated',
};

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      refreshUser: vi.fn(),
      isAuthenticated: true,
      isLoading: false,
    });

    // Mock fetch for 2FA status
    global.fetch = vi.fn((url: any) => {
      if (url.includes('/auth/2fa/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTwoFactorStatus),
        } as Response);
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  describe('Initial Rendering', () => {
    it('should render page title and description', async () => {
      render(<SettingsPage />);

      expect(screen.getByText('Account Settings')).toBeInTheDocument();
      expect(screen.getByText('Manage your account preferences and security')).toBeInTheDocument();
    });

    it('should render all tabs', async () => {
      render(<SettingsPage />);

      expect(screen.getByRole('tab', { name: 'Profile' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Password' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Security' })).toBeInTheDocument();
    });

    it('should display profile tab by default', async () => {
      render(<SettingsPage />);

      expect(screen.getByText('Profile Information')).toBeInTheDocument();
      expect(screen.getByText('Update your personal details')).toBeInTheDocument();
    });

    it('should load user data into profile form', async () => {
      render(<SettingsPage />);

      await waitFor(() => {
        const firstNameInput = screen.getByLabelText('First Name') as HTMLInputElement;
        const lastNameInput = screen.getByLabelText('Last Name') as HTMLInputElement;
        const emailInput = screen.getByLabelText('Email') as HTMLInputElement;

        expect(firstNameInput.value).toBe('John');
        expect(lastNameInput.value).toBe('Doe');
        expect(emailInput.value).toBe('test@example.com');
      });
    });
  });

  describe('Profile Tab', () => {
    it('should update profile form fields', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const firstNameInput = screen.getByLabelText('First Name');
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Jane');

      expect(firstNameInput).toHaveValue('Jane');
    });

    it('should call API when saving profile', async () => {
      const user = userEvent.setup();
      vi.mocked(authApi.updateProfile).mockResolvedValue(mockUser);

      render(<SettingsPage />);

      const firstNameInput = screen.getByLabelText('First Name');
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Jane');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(authApi.updateProfile).toHaveBeenCalledWith({
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'test@example.com',
        });
      });
    });

    it('should show success message after saving profile', async () => {
      const user = userEvent.setup();
      vi.mocked(authApi.updateProfile).mockResolvedValue(mockUser);

      render(<SettingsPage />);

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Profile updated successfully')).toBeInTheDocument();
      });
    });

    it('should show error message when profile update fails', async () => {
      const user = userEvent.setup();
      vi.mocked(authApi.updateProfile).mockRejectedValue({
        response: { data: { detail: 'Email already exists' } },
      });

      render(<SettingsPage />);

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument();
      });
    });

    it('should disable save button while loading', async () => {
      const user = userEvent.setup();
      vi.mocked(authApi.updateProfile).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockUser), 100))
      );

      render(<SettingsPage />);

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    });
  });

  describe('Password Tab', () => {
    it('should switch to password tab', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const passwordTab = screen.getByRole('tab', { name: 'Password' });
      await user.click(passwordTab);

      // Verify tab switched by checking for password form description
      expect(screen.getByText('Update your account password')).toBeInTheDocument();
      expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
    });

    it('should render password form fields', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const passwordTab = screen.getByRole('tab', { name: 'Password' });
      await user.click(passwordTab);

      expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
      expect(screen.getByLabelText('New Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
    });

    it('should update password form fields', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const passwordTab = screen.getByRole('tab', { name: 'Password' });
      await user.click(passwordTab);

      const currentPassword = screen.getByLabelText('Current Password');
      await user.type(currentPassword, 'oldpassword');

      expect(currentPassword).toHaveValue('oldpassword');
    });

    it('should show error when passwords do not match', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const passwordTab = screen.getByRole('tab', { name: 'Password' });
      await user.click(passwordTab);

      await user.type(screen.getByLabelText('Current Password'), 'oldpassword');
      await user.type(screen.getByLabelText('New Password'), 'newpassword123');
      await user.type(screen.getByLabelText('Confirm New Password'), 'differentpassword');

      const changeButton = screen.getByRole('button', { name: /change password/i });
      await user.click(changeButton);

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });

    it('should call API when changing password', async () => {
      const user = userEvent.setup();
      vi.mocked(authApi.changePassword).mockResolvedValue({ message: 'Password changed' });

      render(<SettingsPage />);

      const passwordTab = screen.getByRole('tab', { name: 'Password' });
      await user.click(passwordTab);

      await user.type(screen.getByLabelText('Current Password'), 'oldpassword');
      await user.type(screen.getByLabelText('New Password'), 'newpassword123');
      await user.type(screen.getByLabelText('Confirm New Password'), 'newpassword123');

      const changeButton = screen.getByRole('button', { name: /change password/i });
      await user.click(changeButton);

      await waitFor(() => {
        expect(authApi.changePassword).toHaveBeenCalledWith('oldpassword', 'newpassword123');
      });
    });

    it('should show success message after password change', async () => {
      const user = userEvent.setup();
      vi.mocked(authApi.changePassword).mockResolvedValue({ message: 'Password changed successfully' });

      render(<SettingsPage />);

      const passwordTab = screen.getByRole('tab', { name: 'Password' });
      await user.click(passwordTab);

      await user.type(screen.getByLabelText('Current Password'), 'oldpassword');
      await user.type(screen.getByLabelText('New Password'), 'newpassword123');
      await user.type(screen.getByLabelText('Confirm New Password'), 'newpassword123');

      const changeButton = screen.getByRole('button', { name: /change password/i });
      await user.click(changeButton);

      await waitFor(() => {
        expect(screen.getByText('Password changed successfully')).toBeInTheDocument();
      });
    });

    it('should clear password fields after successful change', async () => {
      const user = userEvent.setup();
      vi.mocked(authApi.changePassword).mockResolvedValue({ message: 'Password changed' });

      render(<SettingsPage />);

      const passwordTab = screen.getByRole('tab', { name: 'Password' });
      await user.click(passwordTab);

      await user.type(screen.getByLabelText('Current Password'), 'oldpassword');
      await user.type(screen.getByLabelText('New Password'), 'newpassword123');
      await user.type(screen.getByLabelText('Confirm New Password'), 'newpassword123');

      const changeButton = screen.getByRole('button', { name: /change password/i });
      await user.click(changeButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Current Password')).toHaveValue('');
        expect(screen.getByLabelText('New Password')).toHaveValue('');
        expect(screen.getByLabelText('Confirm New Password')).toHaveValue('');
      });
    });
  });

  describe('Security Tab - 2FA', () => {
    it('should switch to security tab', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const securityTab = screen.getByRole('tab', { name: 'Security' });
      await user.click(securityTab);

      await waitFor(() => {
        expect(screen.getByText('Two-Factor Authentication')).toBeInTheDocument();
      });
    });

    it('should display 2FA status when disabled', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const securityTab = screen.getByRole('tab', { name: 'Security' });
      await user.click(securityTab);

      await waitFor(() => {
        expect(screen.getByText('2FA Status')).toBeInTheDocument();
        expect(screen.getByText('Disabled')).toBeInTheDocument();
        expect(screen.getByText('Inactive')).toBeInTheDocument();
      });
    });

    it('should show enable 2FA button when disabled', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const securityTab = screen.getByRole('tab', { name: 'Security' });
      await user.click(securityTab);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /enable 2fa/i })).toBeInTheDocument();
      });
    });

    it('should open setup dialog when enabling 2FA', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn((url: any) => {
        if (url.includes('/auth/2fa/status')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockTwoFactorStatus),
          } as Response);
        }
        if (url.includes('/auth/2fa/enable')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockTwoFactorSetup),
          } as Response);
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<SettingsPage />);

      const securityTab = screen.getByRole('tab', { name: 'Security' });
      await user.click(securityTab);

      const enableButton = await screen.findByRole('button', { name: /enable 2fa/i });
      await user.click(enableButton);

      await waitFor(() => {
        expect(screen.getByText('Set Up Two-Factor Authentication')).toBeInTheDocument();
      });
    });

    it('should display QR code in setup dialog', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn((url: any) => {
        if (url.includes('/auth/2fa/status')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockTwoFactorStatus),
          } as Response);
        }
        if (url.includes('/auth/2fa/enable')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockTwoFactorSetup),
          } as Response);
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<SettingsPage />);

      const securityTab = screen.getByRole('tab', { name: 'Security' });
      await user.click(securityTab);

      const enableButton = await screen.findByRole('button', { name: /enable 2fa/i });
      await user.click(enableButton);

      await waitFor(() => {
        const qrCode = screen.getByAltText('QR Code') as HTMLImageElement;
        expect(qrCode).toBeInTheDocument();
        expect(qrCode.src).toContain('data:image/png');
      });
    });

    it('should display secret code in setup dialog', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn((url: any) => {
        if (url.includes('/auth/2fa/status')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockTwoFactorStatus),
          } as Response);
        }
        if (url.includes('/auth/2fa/enable')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockTwoFactorSetup),
          } as Response);
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<SettingsPage />);

      const securityTab = screen.getByRole('tab', { name: 'Security' });
      await user.click(securityTab);

      const enableButton = await screen.findByRole('button', { name: /enable 2fa/i });
      await user.click(enableButton);

      await waitFor(() => {
        expect(screen.getByText('ABCD1234EFGH5678')).toBeInTheDocument();
      });
    });

    it('should display backup codes in setup dialog', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn((url: any) => {
        if (url.includes('/auth/2fa/status')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockTwoFactorStatus),
          } as Response);
        }
        if (url.includes('/auth/2fa/enable')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockTwoFactorSetup),
          } as Response);
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<SettingsPage />);

      const securityTab = screen.getByRole('tab', { name: 'Security' });
      await user.click(securityTab);

      const enableButton = await screen.findByRole('button', { name: /enable 2fa/i });
      await user.click(enableButton);

      await waitFor(() => {
        expect(screen.getByText('123456')).toBeInTheDocument();
        expect(screen.getByText('234567')).toBeInTheDocument();
        // Check at least a couple backup codes
      });
    });

    it('should display 2FA status when enabled', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn((url: any) => {
        if (url.includes('/auth/2fa/status')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              enabled: true,
              verified: true,
              backup_codes_remaining: 8,
              required: false,
            }),
          } as Response);
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<SettingsPage />);

      const securityTab = screen.getByRole('tab', { name: 'Security' });
      await user.click(securityTab);

      await waitFor(() => {
        expect(screen.getByText('Enabled')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByText('Backup codes remaining: 8')).toBeInTheDocument();
      });
    });

    it('should show disable 2FA form when enabled', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn((url: any) => {
        if (url.includes('/auth/2fa/status')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              enabled: true,
              verified: true,
              backup_codes_remaining: 8,
              required: false,
            }),
          } as Response);
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<SettingsPage />);

      const securityTab = screen.getByRole('tab', { name: 'Security' });
      await user.click(securityTab);

      await waitFor(() => {
        expect(screen.getByLabelText(/enter password to disable 2fa/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /disable 2fa/i })).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 2FA status load failure gracefully', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));
      console.error = vi.fn(); // Suppress error logs

      render(<SettingsPage />);

      // Page should still render without 2FA status
      expect(screen.getByText('Account Settings')).toBeInTheDocument();
    });

    it('should show error when profile update fails', async () => {
      const user = userEvent.setup();
      vi.mocked(authApi.updateProfile).mockRejectedValue({
        response: { data: { detail: 'Server error' } },
      });

      render(<SettingsPage />);

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });

    it('should show error when password change fails', async () => {
      const user = userEvent.setup();
      vi.mocked(authApi.changePassword).mockRejectedValue({
        response: { data: { detail: 'Current password is incorrect' } },
      });

      render(<SettingsPage />);

      const passwordTab = screen.getByRole('tab', { name: 'Password' });
      await user.click(passwordTab);

      await user.type(screen.getByLabelText('Current Password'), 'wrongpassword');
      await user.type(screen.getByLabelText('New Password'), 'newpassword123');
      await user.type(screen.getByLabelText('Confirm New Password'), 'newpassword123');

      const changeButton = screen.getByRole('button', { name: /change password/i });
      await user.click(changeButton);

      await waitFor(() => {
        expect(screen.getByText('Current password is incorrect')).toBeInTheDocument();
      });
    });
  });
});
