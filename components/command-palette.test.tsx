import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, usePathname } from 'next/navigation';
import { CommandPalette } from './command-palette';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));

describe('CommandPalette', () => {
  const mockPush = vi.fn();
  const mockNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Content', href: '/dashboard/content', icon: '📝' },
    { name: 'Users', href: '/dashboard/users', icon: '👥' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
    (usePathname as any).mockReturnValue('/dashboard');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render the search button', () => {
      render(<CommandPalette navigation={mockNavigation} />);
      
      expect(screen.getByText('Search...')).toBeInTheDocument();
      expect(screen.getByText('⌘')).toBeInTheDocument();
      expect(screen.getByText('K')).toBeInTheDocument();
    });

    it('should have data-search-trigger attribute for keyboard shortcuts', () => {
      render(<CommandPalette navigation={mockNavigation} />);
      
      const searchButton = screen.getByRole('button');
      expect(searchButton).toHaveAttribute('data-search-trigger');
    });
  });

  describe('Dialog Interaction', () => {
    it('should open dialog when clicking search button', async () => {
      render(<CommandPalette navigation={mockNavigation} />);
      
      const searchButton = screen.getByRole('button');
      fireEvent.click(searchButton);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
      });
    });

    it('should open dialog with Cmd+K keyboard shortcut', async () => {
      render(<CommandPalette navigation={mockNavigation} />);
      
      // Simulate Cmd+K
      fireEvent.keyDown(document, { key: 'k', metaKey: true });
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
      });
    });

    it('should open dialog with Ctrl+K keyboard shortcut', async () => {
      render(<CommandPalette navigation={mockNavigation} />);
      
      // Simulate Ctrl+K
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
      });
    });

    it('should toggle dialog when pressing Cmd+K multiple times', async () => {
      render(<CommandPalette navigation={mockNavigation} />);
      
      // Open
      fireEvent.keyDown(document, { key: 'k', metaKey: true });
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
      });
      
      // Close
      fireEvent.keyDown(document, { key: 'k', metaKey: true });
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Type a command or search...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Navigation Items', () => {
    it('should display all navigation items in the dialog', async () => {
      render(<CommandPalette navigation={mockNavigation} />);
      
      fireEvent.keyDown(document, { key: 'k', metaKey: true });
      
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Content')).toBeInTheDocument();
        expect(screen.getByText('Users')).toBeInTheDocument();
      });
    });

    it('should navigate when clicking a navigation item', async () => {
      render(<CommandPalette navigation={mockNavigation} />);
      
      fireEvent.keyDown(document, { key: 'k', metaKey: true });
      
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });
      
      const dashboardItem = screen.getByText('Dashboard');
      fireEvent.click(dashboardItem);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Quick Actions', () => {
    it('should display quick actions group', async () => {
      render(<CommandPalette navigation={mockNavigation} />);
      
      fireEvent.keyDown(document, { key: 'k', metaKey: true });
      
      await waitFor(() => {
        expect(screen.getByText('Quick Actions')).toBeInTheDocument();
        expect(screen.getByText('Create New Content')).toBeInTheDocument();
        expect(screen.getByText('Create Content Type')).toBeInTheDocument();
        expect(screen.getByText('Upload Media')).toBeInTheDocument();
        expect(screen.getByText('Invite User')).toBeInTheDocument();
      });
    });

    it('should navigate to create content when selecting quick action', async () => {
      render(<CommandPalette navigation={mockNavigation} />);
      
      fireEvent.keyDown(document, { key: 'k', metaKey: true });
      
      await waitFor(() => {
        expect(screen.getByText('Create New Content')).toBeInTheDocument();
      });
      
      const createContentItem = screen.getByText('Create New Content');
      fireEvent.click(createContentItem);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/content/new');
      });
    });
  });

  describe('Settings Actions', () => {
    it('should display settings group', async () => {
      render(<CommandPalette navigation={mockNavigation} />);
      
      fireEvent.keyDown(document, { key: 'k', metaKey: true });
      
      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.getByText('User Settings')).toBeInTheDocument();
        expect(screen.getByText('Organization Settings')).toBeInTheDocument();
        expect(screen.getByText('Manage Themes')).toBeInTheDocument();
      });
    });

    it('should navigate to settings when selecting settings action', async () => {
      render(<CommandPalette navigation={mockNavigation} />);
      
      fireEvent.keyDown(document, { key: 'k', metaKey: true });
      
      await waitFor(() => {
        expect(screen.getByText('User Settings')).toBeInTheDocument();
      });
      
      const userSettingsItem = screen.getByText('User Settings');
      fireEvent.click(userSettingsItem);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/settings');
      });
    });
  });

  describe('Dialog Close', () => {
    it('should close dialog after selecting an item', async () => {
      render(<CommandPalette navigation={mockNavigation} />);
      
      fireEvent.keyDown(document, { key: 'k', metaKey: true });
      
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });
      
      const dashboardItem = screen.getByText('Dashboard');
      fireEvent.click(dashboardItem);
      
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Type a command or search...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      render(<CommandPalette navigation={mockNavigation} />);
      
      const searchButton = screen.getByRole('button');
      expect(searchButton).toBeInTheDocument();
      
      fireEvent.click(searchButton);
      
      await waitFor(() => {
        const input = screen.getByPlaceholderText('Type a command or search...');
        expect(input).toBeInTheDocument();
      });
    });
  });

  describe('Empty Navigation', () => {
    it('should handle empty navigation array', () => {
      render(<CommandPalette navigation={[]} />);
      
      expect(screen.getByText('Search...')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should not open dialog for other key combinations', () => {
      render(<CommandPalette navigation={mockNavigation} />);
      
      // Try different key combinations that shouldn't open dialog
      fireEvent.keyDown(document, { key: 'k' }); // Just K
      fireEvent.keyDown(document, { key: 'j', metaKey: true }); // Cmd+J
      
      expect(screen.queryByPlaceholderText('Type a command or search...')).not.toBeInTheDocument();
    });

    it('should prevent default behavior for Cmd+K', () => {
      render(<CommandPalette navigation={mockNavigation} />);
      
      const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      
      document.dispatchEvent(event);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });
});
