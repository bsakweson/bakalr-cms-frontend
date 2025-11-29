import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ForgotPasswordPage from './page';
import { passwordResetApi } from '@/lib/api/password-reset';

// Mock password reset API
vi.mock('@/lib/api/password-reset', () => ({
  passwordResetApi: {
    requestPasswordReset: vi.fn(),
  },
}));

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render forgot password form', () => {
    render(<ForgotPasswordPage />);

    expect(screen.getByText('Forgot Password')).toBeInTheDocument();
    expect(screen.getByText(/enter your email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('should show back to login link', () => {
    render(<ForgotPasswordPage />);

    const backLink = screen.getByRole('link', { name: /back to login/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/login');
  });

  it('should handle successful password reset request', async () => {
    (passwordResetApi.requestPasswordReset as any).mockResolvedValue({});

    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: /send reset link/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(passwordResetApi.requestPasswordReset).toHaveBeenCalledWith('test@example.com');
    });

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText('Check Your Email')).toBeInTheDocument();
      expect(screen.getByText(/if an account exists/i)).toBeInTheDocument();
    });
  });

  it('should show success message even on API error (security)', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (passwordResetApi.requestPasswordReset as any).mockRejectedValue(new Error('User not found'));

    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: /send reset link/i });

    fireEvent.change(emailInput, { target: { value: 'nonexistent@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(passwordResetApi.requestPasswordReset).toHaveBeenCalledWith('nonexistent@example.com');
    });

    // Should still show success message for security
    await waitFor(() => {
      expect(screen.getByText('Check Your Email')).toBeInTheDocument();
    });

    // Should log error for debugging
    expect(consoleSpy).toHaveBeenCalledWith('Password reset error:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('should show try again button after submission', async () => {
    (passwordResetApi.requestPasswordReset as any).mockResolvedValue({});

    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: /send reset link/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Check Your Email')).toBeInTheDocument();
    });

    const tryAgainButton = screen.getByRole('button', { name: /try again/i });
    expect(tryAgainButton).toBeInTheDocument();
  });

  it('should allow resending reset email', async () => {
    (passwordResetApi.requestPasswordReset as any).mockResolvedValue({});

    render(<ForgotPasswordPage />);

    // First submission
    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText('Check Your Email')).toBeInTheDocument();
    });

    // Click try again
    const tryAgainButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(tryAgainButton);

    // Should show form again
    await waitFor(() => {
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    });

    // Email should be cleared
    const newEmailInput = screen.getByLabelText('Email') as HTMLInputElement;
    expect(newEmailInput.value).toBe('');
  });

  it('should disable input during submission', async () => {
    (passwordResetApi.requestPasswordReset as any).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /send reset link/i }) as HTMLButtonElement;

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(emailInput.disabled).toBe(true);
      expect(submitButton.disabled).toBe(true);
    });
  });

  it('should require email field', () => {
    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;

    expect(emailInput.required).toBe(true);
    expect(emailInput.type).toBe('email');
    expect(emailInput.placeholder).toBe('you@example.com');
  });

  it('should show helpful instructions in success state', async () => {
    (passwordResetApi.requestPasswordReset as any).mockResolvedValue({});

    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your email inbox.*spam folder/i)).toBeInTheDocument();
      expect(screen.getByText(/link will expire in 1 hour/i)).toBeInTheDocument();
      expect(screen.getByText(/didn't receive the email/i)).toBeInTheDocument();
    });
  });

  it('should update email value when typing', () => {
    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'typing@test.com' } });
    expect(emailInput.value).toBe('typing@test.com');

    fireEvent.change(emailInput, { target: { value: 'changed@test.com' } });
    expect(emailInput.value).toBe('changed@test.com');
  });
});
