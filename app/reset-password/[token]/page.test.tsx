import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useParams, useRouter } from 'next/navigation';
import ResetPasswordPage from './page';
import { passwordResetApi } from '@/lib/api/password-reset';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
  useRouter: vi.fn(),
}));

// Mock password reset API
vi.mock('@/lib/api/password-reset', () => ({
  passwordResetApi: {
    validateResetToken: vi.fn(),
    confirmPasswordReset: vi.fn(),
  },
}));

describe('ResetPasswordPage', () => {
  const mockPush = vi.fn();
  const mockToken = 'test-reset-token';

  beforeEach(() => {
    vi.clearAllMocks();
    (useParams as any).mockReturnValue({ token: mockToken });
    (useRouter as any).mockReturnValue({ push: mockPush });
  });

  it('should show loading state while validating token', () => {
    (passwordResetApi.validateResetToken as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<ResetPasswordPage />);

    expect(screen.getByText('Validating Reset Link')).toBeInTheDocument();
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('should render reset form with valid token', async () => {
    (passwordResetApi.validateResetToken as any).mockResolvedValue({ valid: true });

    render(<ResetPasswordPage />);

    // Wait for validation to complete and form to appear
    await waitFor(() => {
      expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
    });

    // Should show the form
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
  });

  it('should show error for invalid token', async () => {
    (passwordResetApi.validateResetToken as any).mockResolvedValue({
      valid: false,
      message: 'Token has expired',
    });

    render(<ResetPasswordPage />);

    await waitFor(
      () => {
        expect(screen.getByText('Invalid Reset Link')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('should handle token validation error', async () => {
    (passwordResetApi.validateResetToken as any).mockRejectedValue(new Error('Network error'));

    render(<ResetPasswordPage />);

    await waitFor(
      () => {
        expect(screen.getByText('Invalid Reset Link')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    expect(screen.getByText(/failed to validate reset link/i)).toBeInTheDocument();
  });

  it('should validate password length', async () => {
    (passwordResetApi.validateResetToken as any).mockResolvedValue({ valid: true });

    render(<ResetPasswordPage />);

    await waitFor(
      () => {
        expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    const passwordInput = screen.getByLabelText('New Password');
    const confirmInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /reset password/i });

    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.change(confirmInput, { target: { value: 'short' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });

    expect(passwordResetApi.confirmPasswordReset).not.toHaveBeenCalled();
  });

  it('should validate password match', async () => {
    (passwordResetApi.validateResetToken as any).mockResolvedValue({ valid: true });

    render(<ResetPasswordPage />);

    await waitFor(
      () => {
        expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    const passwordInput = screen.getByLabelText('New Password');
    const confirmInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /reset password/i });

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmInput, { target: { value: 'different123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    expect(passwordResetApi.confirmPasswordReset).not.toHaveBeenCalled();
  });

  it('should handle successful password reset', async () => {
    (passwordResetApi.validateResetToken as any).mockResolvedValue({ valid: true });
    (passwordResetApi.confirmPasswordReset as any).mockResolvedValue({});

    render(<ResetPasswordPage />);

    await waitFor(() => {
      expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText('New Password');
    const confirmInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /reset password/i });

    fireEvent.change(passwordInput, { target: { value: 'NewSecurePass123!' } });
    fireEvent.change(confirmInput, { target: { value: 'NewSecurePass123!' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(passwordResetApi.confirmPasswordReset).toHaveBeenCalledWith(
        mockToken,
        'NewSecurePass123!'
      );
    });

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText(/password has been successfully reset/i)).toBeInTheDocument();
    });

    // Should redirect after 2 second timeout
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login?reset=success');
    }, { timeout: 3000 });
  });

  it('should display error on reset failure', async () => {
    (passwordResetApi.validateResetToken as any).mockResolvedValue({ valid: true });
    (passwordResetApi.confirmPasswordReset as any).mockRejectedValue({
      response: { data: { detail: 'Token has expired' } },
    });

    render(<ResetPasswordPage />);

    await waitFor(
      () => {
        expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    const passwordInput = screen.getByLabelText('New Password');
    const confirmInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /reset password/i });

    fireEvent.change(passwordInput, { target: { value: 'NewPass123!' } });
    fireEvent.change(confirmInput, { target: { value: 'NewPass123!' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Token has expired')).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should show default error message when no detail provided', async () => {
    (passwordResetApi.validateResetToken as any).mockResolvedValue({ valid: true });
    (passwordResetApi.confirmPasswordReset as any).mockRejectedValue({});

    render(<ResetPasswordPage />);

    await waitFor(
      () => {
        expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    const passwordInput = screen.getByLabelText('New Password');
    const confirmInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /reset password/i });

    fireEvent.change(passwordInput, { target: { value: 'NewPass123!' } });
    fireEvent.change(confirmInput, { target: { value: 'NewPass123!' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to reset password.*may have expired/i)).toBeInTheDocument();
    });
  });

  it('should disable inputs during submission', async () => {
    (passwordResetApi.validateResetToken as any).mockResolvedValue({ valid: true });
    (passwordResetApi.confirmPasswordReset as any).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<ResetPasswordPage />);

    await waitFor(
      () => {
        expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    const passwordInput = screen.getByLabelText('New Password') as HTMLInputElement;
    const confirmInput = screen.getByLabelText('Confirm Password') as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /reset password/i }) as HTMLButtonElement;

    fireEvent.change(passwordInput, { target: { value: 'NewPass123!' } });
    fireEvent.change(confirmInput, { target: { value: 'NewPass123!' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(passwordInput.disabled).toBe(true);
      expect(confirmInput.disabled).toBe(true);
      expect(submitButton.disabled).toBe(true);
    });
  });

  it('should require both password fields', async () => {
    (passwordResetApi.validateResetToken as any).mockResolvedValue({ valid: true });

    render(<ResetPasswordPage />);

    await waitFor(
      () => {
        expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    const passwordInput = screen.getByLabelText('New Password') as HTMLInputElement;
    const confirmInput = screen.getByLabelText('Confirm Password') as HTMLInputElement;

    expect(passwordInput.required).toBe(true);
    expect(confirmInput.required).toBe(true);
    expect(passwordInput.type).toBe('password');
    expect(confirmInput.type).toBe('password');
  });

  it('should show request new link button on invalid token', async () => {
    (passwordResetApi.validateResetToken as any).mockResolvedValue({
      valid: false,
      message: 'Token expired',
    });

    render(<ResetPasswordPage />);

    await waitFor(
      () => {
        expect(screen.getByText('Invalid Reset Link')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    const requestNewLink = screen.getByRole('link', { name: /request new reset link/i });
    expect(requestNewLink).toBeInTheDocument();
    expect(requestNewLink).toHaveAttribute('href', '/forgot-password');
  });
});
