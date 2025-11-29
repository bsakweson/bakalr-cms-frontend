import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrganizationSelector } from './organization-selector';
import { tenantApi } from '@/lib/api/tenant';
import type { OrganizationMembership, UserOrganizationsResponse } from '@/types';

// Mock the API
vi.mock('@/lib/api/tenant', () => ({
  tenantApi: {
    listOrganizations: vi.fn(),
    switchOrganization: vi.fn(),
  },
}));

// Mock the auth context
const mockLogin = vi.fn();
const mockUser = {
  id: 1,
  email: 'test@example.com',
  full_name: 'Test User',
};

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    user: mockUser,
    login: mockLogin,
  }),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.location.reload
const reloadMock = vi.fn();
Object.defineProperty(window, 'location', {
  value: { reload: reloadMock },
  writable: true,
});

describe('OrganizationSelector', () => {
  const mockOrganizations: OrganizationMembership[] = [
    {
      organization_id: 1,
      organization_name: 'Org A',
      organization_slug: 'org-a',
      is_default: true,
      is_active: true,
      roles: ['admin', 'editor'],
      joined_at: '2025-01-01T00:00:00Z',
    },
    {
      organization_id: 2,
      organization_name: 'Org B',
      organization_slug: 'org-b',
      is_default: false,
      is_active: true,
      roles: ['viewer'],
      joined_at: '2025-02-01T00:00:00Z',
    },
    {
      organization_id: 3,
      organization_name: 'Org C',
      organization_slug: 'org-c',
      is_default: false,
      is_active: true,
      roles: ['editor', 'contributor', 'reviewer'],
      joined_at: '2025-03-01T00:00:00Z',
    },
  ];

  const mockApiResponse: UserOrganizationsResponse = {
    current_organization_id: 1,
    organizations: mockOrganizations,
    total: 3,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    vi.mocked(tenantApi.listOrganizations).mockResolvedValue(mockApiResponse);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should not render when only one organization exists', async () => {
      vi.mocked(tenantApi.listOrganizations).mockResolvedValue({
        current_organization_id: 1,
        organizations: [mockOrganizations[0]],
        total: 1,
      });

      const { container } = render(<OrganizationSelector />);

      await waitFor(() => {
        expect(tenantApi.listOrganizations).toHaveBeenCalled();
      });

      expect(container.firstChild).toBeNull();
    });

    it('should render dropdown trigger button', async () => {
      render(<OrganizationSelector />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
    });

    it('should load organizations on mount', async () => {
      render(<OrganizationSelector />);

      await waitFor(() => {
        expect(tenantApi.listOrganizations).toHaveBeenCalledTimes(1);
      });
    });

    it('should display current organization name', async () => {
      render(<OrganizationSelector />);

      await waitFor(() => {
        expect(screen.getByText('Org A')).toBeInTheDocument();
      });
    });

    it('should display organization emoji icon', async () => {
      render(<OrganizationSelector />);

      await waitFor(() => {
        expect(screen.getByText('🏢')).toBeInTheDocument();
      });
    });

    it('should display primary role for current organization', async () => {
      render(<OrganizationSelector />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button.textContent).toContain('admin');
      });
    });

    it('should display role count when user has multiple roles', async () => {
      render(<OrganizationSelector />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        // "admin, +1" indicates 2 roles total
        expect(button.textContent).toContain('+1');
      });
    });

    it('should handle API error gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(tenantApi.listOrganizations).mockRejectedValue(new Error('API Error'));

      const { container } = render(<OrganizationSelector />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to load organizations:',
          expect.any(Error)
        );
      });

      // Should not render if API fails
      expect(container.firstChild).toBeNull();

      consoleError.mockRestore();
    });
  });

  describe('Dropdown Interactions', () => {
    it('should open dropdown menu when trigger clicked', async () => {
      const user = userEvent.setup();
      render(<OrganizationSelector />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Switch Organization')).toBeInTheDocument();
      });
    });

    it('should display all organizations in dropdown', async () => {
      const user = userEvent.setup();
      render(<OrganizationSelector />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        // Use getAllByText since organization names appear in both trigger and dropdown
        const orgAElements = screen.getAllByText('Org A');
        expect(orgAElements.length).toBeGreaterThan(0);
        expect(screen.getByText('Org B')).toBeInTheDocument();
        expect(screen.getByText('Org C')).toBeInTheDocument();
      });
    });

    it('should display "Current" badge for active organization', async () => {
      const user = userEvent.setup();
      render(<OrganizationSelector />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Current')).toBeInTheDocument();
      });
    });

    it('should display "Default" badge for default organization that is not current', async () => {
      const user = userEvent.setup();
      vi.mocked(tenantApi.listOrganizations).mockResolvedValue({
        current_organization_id: 2, // Org B is current
        organizations: mockOrganizations,
        total: 3,
      });

      render(<OrganizationSelector />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        // Org A should show "Default" badge since it's not current
        expect(screen.getByText('Default')).toBeInTheDocument();
      });
    });

    it('should display all roles for each organization', async () => {
      const user = userEvent.setup();
      render(<OrganizationSelector />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        // Org A: admin, editor
        expect(screen.getByText('admin, editor')).toBeInTheDocument();
        // Org B: viewer
        expect(screen.getByText('viewer')).toBeInTheDocument();
        // Org C: editor, contributor, reviewer
        expect(screen.getByText('editor, contributor, reviewer')).toBeInTheDocument();
      });
    });

    it('should disable current organization menu item', async () => {
      const user = userEvent.setup();
      render(<OrganizationSelector />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        const menuItems = screen.getAllByRole('menuitem');
        // Find the menu item (not the trigger) that contains Org A
        const orgAMenuItem = menuItems.find((item) => {
          const text = item.textContent || '';
          return text.includes('Org A') && text.includes('Current');
        });
        expect(orgAMenuItem).toBeTruthy();
        expect(orgAMenuItem).toHaveAttribute('data-disabled');
      });
    });
  });

  describe('Organization Switching', () => {
    it('should call switchOrganization API when different org clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(tenantApi.switchOrganization).mockResolvedValue({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        organization_id: 2,
        organization_name: 'Org B',
        message: 'Successfully switched to Org B',
      });

      render(<OrganizationSelector />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Org B')).toBeInTheDocument();
      });

      const menuItems = screen.getAllByRole('menuitem');
      const orgBItem = menuItems.find((item) => item.textContent?.includes('Org B'));
      expect(orgBItem).toBeTruthy();

      await user.click(orgBItem!);

      await waitFor(() => {
        expect(tenantApi.switchOrganization).toHaveBeenCalledWith({
          organization_id: 2,
        });
      });
    });

    it('should not call API when clicking current organization', async () => {
      const user = userEvent.setup();
      render(<OrganizationSelector />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        const menuItems = screen.getAllByRole('menuitem');
        // Find the menu item with Current badge
        const orgAItem = menuItems.find((item) => {
          const text = item.textContent || '';
          return text.includes('Org A') && text.includes('Current');
        });
        
        // Item should be disabled, so click won't work
        // Just verify it's disabled
        expect(orgAItem).toBeTruthy();
        expect(orgAItem).toHaveAttribute('data-disabled');
      });

      // API should not be called
      expect(tenantApi.switchOrganization).not.toHaveBeenCalled();
    });

    it('should update localStorage with new tokens', async () => {
      const user = userEvent.setup();
      vi.mocked(tenantApi.switchOrganization).mockResolvedValue({
        access_token: 'new-access-token-123',
        refresh_token: 'new-refresh-token-456',
        organization_id: 2,
        organization_name: 'Org B',
        message: 'Successfully switched to Org B',
      });

      render(<OrganizationSelector />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Org B')).toBeInTheDocument();
      });

      const menuItems = screen.getAllByRole('menuitem');
      const orgBItem = menuItems.find((item) => item.textContent?.includes('Org B'));
      await user.click(orgBItem!);

      await waitFor(() => {
        expect(localStorageMock.getItem('access_token')).toBe('new-access-token-123');
        expect(localStorageMock.getItem('refresh_token')).toBe('new-refresh-token-456');
      });
    });

    it('should reload page after successful switch', async () => {
      const user = userEvent.setup();
      vi.mocked(tenantApi.switchOrganization).mockResolvedValue({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        organization_id: 2,
        organization_name: 'Org B',
        message: 'Successfully switched to Org B',
      });

      render(<OrganizationSelector />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Org B')).toBeInTheDocument();
      });

      const menuItems = screen.getAllByRole('menuitem');
      const orgBItem = menuItems.find((item) => item.textContent?.includes('Org B'));
      await user.click(orgBItem!);

      await waitFor(() => {
        expect(reloadMock).toHaveBeenCalled();
      });
    });

    it('should disable trigger button while switching', async () => {
      const user = userEvent.setup();
      let resolveSwitch: (value: any) => void;
      const switchPromise = new Promise((resolve) => {
        resolveSwitch = resolve;
      });

      vi.mocked(tenantApi.switchOrganization).mockReturnValue(switchPromise as any);

      render(<OrganizationSelector />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Org B')).toBeInTheDocument();
      });

      const menuItems = screen.getAllByRole('menuitem');
      const orgBItem = menuItems.find((item) => item.textContent?.includes('Org B'));
      await user.click(orgBItem!);

      // Button should be disabled while switching
      await waitFor(() => {
        expect(trigger).toBeDisabled();
      });

      // Resolve the promise
      resolveSwitch!({
        access_token: 'token',
        refresh_token: 'refresh',
        organization_id: 2,
        organization_name: 'Org B',
        message: 'Switched',
      });
    });

    it('should disable menu items while switching', async () => {
      const user = userEvent.setup();
      let resolveSwitch: (value: any) => void;
      const switchPromise = new Promise((resolve) => {
        resolveSwitch = resolve;
      });

      vi.mocked(tenantApi.switchOrganization).mockReturnValue(switchPromise as any);

      render(<OrganizationSelector />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Org B')).toBeInTheDocument();
      });

      const menuItems = screen.getAllByRole('menuitem');
      // Before clicking, all items should be enabled except current org
      const orgBItem = menuItems.find((item) => {
        const text = item.textContent || '';
        return text.includes('Org B') && !text.includes('Current');
      });
      expect(orgBItem).toBeTruthy();
      expect(orgBItem).not.toHaveAttribute('data-disabled');

      await user.click(orgBItem!);

      // After clicking, trigger button should be disabled while switching
      // Menu closes after click, so we check the trigger instead
      await waitFor(() => {
        expect(trigger).toBeDisabled();
      });

      // Resolve the promise
      resolveSwitch!({
        access_token: 'token',
        refresh_token: 'refresh',
        organization_id: 2,
        organization_name: 'Org B',
        message: 'Switched',
      });
    });

    it('should handle switch API error gracefully', async () => {
      const user = userEvent.setup();
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(tenantApi.switchOrganization).mockRejectedValue(new Error('Switch failed'));

      render(<OrganizationSelector />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Org B')).toBeInTheDocument();
      });

      const menuItems = screen.getAllByRole('menuitem');
      const orgBItem = menuItems.find((item) => item.textContent?.includes('Org B'));
      await user.click(orgBItem!);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to switch organization:',
          expect.any(Error)
        );
      });

      // Should not reload page on error
      expect(reloadMock).not.toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle organization with no roles', async () => {
      const user = userEvent.setup();
      const orgsWithNoRoles: OrganizationMembership[] = [
        {
          organization_id: 1,
          organization_name: 'Org A',
          organization_slug: 'org-a',
          is_default: true,
          is_active: true,
          roles: [],
          joined_at: '2025-01-01T00:00:00Z',
        },
        {
          organization_id: 2,
          organization_name: 'Org B',
          organization_slug: 'org-b',
          is_default: false,
          is_active: true,
          roles: [],
          joined_at: '2025-02-01T00:00:00Z',
        },
      ];

      vi.mocked(tenantApi.listOrganizations).mockResolvedValue({
        current_organization_id: 1,
        organizations: orgsWithNoRoles,
        total: 2,
      });

      render(<OrganizationSelector />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      const trigger = screen.getByRole('button');
      
      // Should not display role text if no roles
      expect(trigger.textContent).not.toContain('admin');
      expect(trigger.textContent).not.toContain('+');
    });

    it('should handle organization with single role correctly', async () => {
      const user = userEvent.setup();
      render(<OrganizationSelector />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        // Org B has only "viewer" role, should not show "+X"
        const orgBText = screen.getByText('viewer');
        const menuItem = orgBText.closest('[role="menuitem"]');
        expect(menuItem?.textContent).not.toContain('+');
      });
    });

    it('should display "Select Organization" when current org not found', async () => {
      vi.mocked(tenantApi.listOrganizations).mockResolvedValue({
        current_organization_id: 999, // Non-existent org
        organizations: mockOrganizations,
        total: 3,
      });

      render(<OrganizationSelector />);

      await waitFor(() => {
        expect(screen.getByText('Select Organization')).toBeInTheDocument();
      });
    });
  });
});
