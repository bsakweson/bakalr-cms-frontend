import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ErrorPage from './error';

// Mock Button component
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant }: any) => (
    <button onClick={onClick} data-variant={variant}>
      {children}
    </button>
  ),
}));

// Helper to create error with optional digest
const createError = (message?: string, digest?: string): Error & { digest?: string } => {
  const error = Object.assign(new window.Error(message || ''), { digest });
  return error;
};

describe('Error Page', () => {
  const mockReset = vi.fn();
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  describe('Error Display', () => {
    it('should render 500 status code', () => {
      const error = createError('Test error');
      render(<ErrorPage error={error} reset={mockReset} />);
      
      expect(screen.getByText('500')).toBeInTheDocument();
    });

    it('should render error heading', () => {
      const error = createError('Test error');
      render(<ErrorPage error={error} reset={mockReset} />);
      
      expect(screen.getByText('Something went wrong!')).toBeInTheDocument();
    });

    it('should display custom error message', () => {
      const error = createError('Custom error message');
      render(<ErrorPage error={error} reset={mockReset} />);
      
      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });

    it('should display default error message when no message provided', () => {
      const error = createError();
      render(<ErrorPage error={error} reset={mockReset} />);
      
      expect(
        screen.getByText('An unexpected error occurred. Please try again.')
      ).toBeInTheDocument();
    });

    it('should display default message for empty string error', () => {
      const error = createError('');
      render(<ErrorPage error={error} reset={mockReset} />);
      
      expect(
        screen.getByText('An unexpected error occurred. Please try again.')
      ).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should render "Try again" button', () => {
      const error = createError('Test error');
      render(<ErrorPage error={error} reset={mockReset} />);
      
      expect(screen.getByText('Try again')).toBeInTheDocument();
    });

    it('should render "Go to Dashboard" button', () => {
      const error = createError('Test error');
      render(<ErrorPage error={error} reset={mockReset} />);
      
      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
    });

    it('should call reset function when "Try again" is clicked', async () => {
      const user = userEvent.setup();
      const error = createError('Test error');
      render(<ErrorPage error={error} reset={mockReset} />);
      
      const tryAgainButton = screen.getByText('Try again');
      await user.click(tryAgainButton);
      
      expect(mockReset).toHaveBeenCalledTimes(1);
    });

    it('should navigate to dashboard when "Go to Dashboard" is clicked', async () => {
      const user = userEvent.setup();
      const error = createError('Test error');
      render(<ErrorPage error={error} reset={mockReset} />);
      
      const dashboardButton = screen.getByText('Go to Dashboard');
      await user.click(dashboardButton);
      
      expect(window.location.href).toBe('/dashboard');
    });

    it('should have outline variant on dashboard button', () => {
      const error = createError('Test error');
      const { container } = render(<ErrorPage error={error} reset={mockReset} />);
      
      const dashboardButton = screen.getByText('Go to Dashboard');
      expect(dashboardButton).toHaveAttribute('data-variant', 'outline');
    });
  });

  describe('Error Logging', () => {
    it('should log error to console on mount', () => {
      const error = createError('Test error for logging');
      render(<ErrorPage error={error} reset={mockReset} />);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    });

    it('should log error with digest if provided', () => {
      const error = Object.assign(createError('Error with digest'), {
        digest: 'abc123',
      });
      render(<ErrorPage error={error} reset={mockReset} />);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    });

    it('should only log error once on initial render', () => {
      const error = createError('Test error');
      const { rerender } = render(<ErrorPage error={error} reset={mockReset} />);
      
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      
      // Rerender with same props
      rerender(<ErrorPage error={error} reset={mockReset} />);
      
      // Should still only be called once
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('should log new error when error changes', () => {
      const error1 = createError('First error');
      const { rerender } = render(<ErrorPage error={error1} reset={mockReset} />);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(error1);
      
      const error2 = createError('Second error');
      rerender(<ErrorPage error={error2} reset={mockReset} />);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(error2);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Layout & Styling', () => {
    it('should have centered layout with full height', () => {
      const error = createError('Test error');
      const { container } = render(<ErrorPage error={error} reset={mockReset} />);
      
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('flex', 'h-screen', 'items-center', 'justify-center');
    });

    it('should have vertical flex layout with gap', () => {
      const error = createError('Test error');
      const { container } = render(<ErrorPage error={error} reset={mockReset} />);
      
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('flex-col', 'gap-4');
    });

    it('should have destructive color on status code', () => {
      const error = createError('Test error');
      render(<ErrorPage error={error} reset={mockReset} />);
      
      const statusCode = screen.getByText('500');
      expect(statusCode).toHaveClass('text-destructive');
    });

    it('should have muted foreground color on error message', () => {
      const error = createError('Test error message');
      render(<ErrorPage error={error} reset={mockReset} />);
      
      const message = screen.getByText('Test error message');
      expect(message).toHaveClass('text-muted-foreground');
    });

    it('should center align error message text', () => {
      const error = createError('Test error');
      render(<ErrorPage error={error} reset={mockReset} />);
      
      const message = screen.getByText('Test error');
      expect(message).toHaveClass('text-center');
    });

    it('should constrain message width', () => {
      const error = createError('Test error');
      render(<ErrorPage error={error} reset={mockReset} />);
      
      const message = screen.getByText('Test error');
      expect(message).toHaveClass('max-w-md');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long error messages', () => {
      const longMessage = 'A'.repeat(500);
      const error = createError(longMessage);
      render(<ErrorPage error={error} reset={mockReset} />);
      
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle error with special characters', () => {
      const error = createError('Error: <script>alert("xss")</script>');
      render(<ErrorPage error={error} reset={mockReset} />);
      
      expect(screen.getByText('Error: <script>alert("xss")</script>')).toBeInTheDocument();
    });

    it('should handle error with newline characters', () => {
      const error = createError('Line 1\nLine 2\nLine 3');
      render(<ErrorPage error={error} reset={mockReset} />);
      
      // Use container query for multiline text
      const message = screen.getByText((content, element) => {
        return element?.textContent === 'Line 1\nLine 2\nLine 3';
      });
      expect(message).toBeInTheDocument();
    });

    it('should handle multiple rapid clicks on reset button', async () => {
      const user = userEvent.setup();
      const error = createError('Test error');
      render(<ErrorPage error={error} reset={mockReset} />);
      
      const tryAgainButton = screen.getByText('Try again');
      await user.click(tryAgainButton);
      await user.click(tryAgainButton);
      await user.click(tryAgainButton);
      
      expect(mockReset).toHaveBeenCalledTimes(3);
    });
  });
});
