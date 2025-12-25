import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TranslationsRedirectPage from './page';

// Mock useRouter
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe('TranslationsRedirectPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initial Rendering', () => {
    it('should render page moved message', () => {
      render(<TranslationsRedirectPage />);

      expect(screen.getByText('Page Moved')).toBeInTheDocument();
      expect(screen.getByText(/Translations management has been consolidated/)).toBeInTheDocument();
    });

    it('should render redirect button', () => {
      render(<TranslationsRedirectPage />);

      expect(screen.getByRole('button', { name: /go to organization settings/i })).toBeInTheDocument();
    });

    it('should show auto-redirect message', () => {
      render(<TranslationsRedirectPage />);

      expect(screen.getByText(/automatically redirected/i)).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should redirect to organization settings when button clicked', async () => {
      vi.useRealTimers(); // Use real timers for user interaction
      const user = userEvent.setup();
      render(<TranslationsRedirectPage />);

      const button = screen.getByRole('button', { name: /go to organization settings/i });
      await user.click(button);

      expect(mockPush).toHaveBeenCalledWith('/dashboard/organization?tab=translations');
    });

    it('should auto-redirect after 3 seconds', async () => {
      render(<TranslationsRedirectPage />);

      expect(mockPush).not.toHaveBeenCalled();

      // Fast-forward 3 seconds
      vi.advanceTimersByTime(3000);

      expect(mockPush).toHaveBeenCalledWith('/dashboard/organization?tab=translations');
    });

    it('should not auto-redirect before 3 seconds', () => {
      render(<TranslationsRedirectPage />);

      vi.advanceTimersByTime(2999);

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should clear timeout on unmount', () => {
      const { unmount } = render(<TranslationsRedirectPage />);

      unmount();

      // Advance time to ensure timeout was cleared
      vi.advanceTimersByTime(5000);

      // Should not have called push since component unmounted
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
