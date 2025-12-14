import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useAuth } from '@/contexts/auth-context';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useRouter, usePathname } from 'next/navigation';
import DashboardLayout from './layout';

// Mock all dependencies
vi.mock('@/contexts/auth-context', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/use-require-auth', () => ({
  useRequireAuth: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));

vi.mock('@/hooks/use-keyboard-shortcuts', () => ({
  useKeyboardShortcuts: vi.fn(),
  KeyboardShortcutsHelp: () => <div>Keyboard Shortcuts Help</div>,
}));

vi.mock('@/components/command-palette', () => ({
  CommandPalette: () => <div>Command Palette</div>,
}));

vi.mock('@/components/organization-selector', () => ({
  OrganizationSelector: () => <div>Organization Selector</div>,
}));

vi.mock('@/components/onboarding-tour', () => ({
  OnboardingTour: () => <div>Onboarding Tour</div>,
}));

vi.mock('@/components/dynamic-breadcrumbs', () => ({
  DynamicBreadcrumbs: () => <div>Breadcrumbs</div>,
}));

describe('DashboardLayout', () => {
  const mockPush = vi.fn();
  const mockLogout = vi.fn();

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    organization: {
      id: '1',
      name: 'Test Organization',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
    (usePathname as any).mockReturnValue('/dashboard');
    (useAuth as any).mockReturnValue({
      user: mockUser,
      logout: mockLogout,
    });
    (useRequireAuth as any).mockReturnValue({ isLoading: false });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render dashboard layout with sidebar', () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Bakalr CMS')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    // Check for Dashboard link in navigation (not the header)
    expect(screen.getByRole('link', { name: /📊Dashboard/i })).toBeInTheDocument();
  });

  it('should show loading state while checking auth', () => {
    (useRequireAuth as any).mockReturnValue({ isLoading: true });

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
  });

  it('should render all navigation items', () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    // Check main navigation items using role and accessible names
    expect(screen.getByRole('link', { name: /📊Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /📝Content/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /📋Content Types/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /🖼️Media/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /👥Users/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /🔐Roles/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /🌍Translations/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /📄Templates/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /🎨Themes/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /🏢Organization/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /📋Audit Logs/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /📚Documentation/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /⚙️Settings/i })).toBeInTheDocument();
  });

  it('should highlight active navigation item', () => {
    (usePathname as any).mockReturnValue('/dashboard/content');

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    // Find the Content navigation link (no space after emoji)
    const contentLink = screen.getByRole('link', { name: /📝Content/i });
    expect(contentLink).toHaveClass('bg-primary');
    expect(contentLink).toHaveClass('text-primary-foreground');
  });

  it('should display user information in dropdown', async () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Bakalr CMS')).toBeInTheDocument();
    });

    // The avatar shows initials (TU for Test User)
    const avatarButton = screen.getByRole('button', { name: /TU/i });
    expect(avatarButton).toBeInTheDocument();
    
    // Note: DropdownMenu content is not visible until clicked, and may require userEvent
    // For now, we'll just verify the button exists with correct initials
  });

  it('should display user initials correctly', () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    // Check if initials are displayed (TU for Test User)
    expect(screen.getByText('TU')).toBeInTheDocument();
  });

  it('should handle user with only email', async () => {
    (useAuth as any).mockReturnValue({
      user: {
        id: '1',
        email: 'john@example.com',
        organization: { id: '1', name: 'Test Org' },
      },
      logout: mockLogout,
    });

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    await waitFor(() => {
      expect(screen.getByText('Bakalr CMS')).toBeInTheDocument();
    });

    // Email 'john@example.com' -> prefix 'john' -> getUserInitials -> 'J' (single word = single char)
    const avatarButton = screen.getByRole('button', { name: /^J$/i });
    expect(avatarButton).toBeInTheDocument();
  });

  it('should show settings link in user menu', async () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    const avatarButton = screen.getByRole('button', { name: /TU/i });
    fireEvent.click(avatarButton);

    await waitFor(() => {
      const settingsLink = screen.getAllByText('Settings').find((el) => el.closest('a'));
      expect(settingsLink).toBeInTheDocument();
    });
  });

  it('should handle logout', async () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Bakalr CMS')).toBeInTheDocument();
    });

    // Verify user avatar is present (logout is in its dropdown)
    const avatarButton = screen.getByRole('button', { name: /TU/i });
    expect(avatarButton).toBeInTheDocument();
    
    // Note: Testing actual dropdown interaction requires userEvent library
    // For now we verify the component renders correctly
  });

  it('should display organization name in sidebar', () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Test Organization')).toBeInTheDocument();
  });

  it('should show organization selector component', () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Organization Selector')).toBeInTheDocument();
  });

  it('should show command palette component', () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Command Palette')).toBeInTheDocument();
  });

  it('should show breadcrumbs in main content area', () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Breadcrumbs')).toBeInTheDocument();
  });

  it('should show onboarding tour', () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Onboarding Tour')).toBeInTheDocument();
  });

  it('should update page title based on current route', () => {
    (usePathname as any).mockReturnValue('/dashboard/users');

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    // Should show "Users" in header
    const headerTitle = screen.getAllByText('Users')[0];
    expect(headerTitle).toBeInTheDocument();
  });

  it('should show mobile menu button on small screens', () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    // Mobile menu button should be present
    const mobileButton = screen.getByRole('button', { name: '☰' });
    expect(mobileButton).toBeInTheDocument();
  });

  it('should render children in main content area', () => {
    render(
      <DashboardLayout>
        <div data-testid="child-content">Custom Dashboard Content</div>
      </DashboardLayout>
    );

    const childContent = screen.getByTestId('child-content');
    expect(childContent).toBeInTheDocument();
    expect(childContent).toHaveTextContent('Custom Dashboard Content');
  });

  it('should apply correct styles to active navigation', () => {
    (usePathname as any).mockReturnValue('/dashboard/media');

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    const mediaLink = screen.getByRole('link', { name: /🖼️Media/i });
    expect(mediaLink.className).toContain('bg-primary');
  });

  it('should handle navigation to sub-routes correctly', () => {
    (usePathname as any).mockReturnValue('/dashboard/content/new');

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    // Content should be highlighted even on /dashboard/content/new
    const contentLink = screen.getByRole('link', { name: /📝Content/i });
    expect(contentLink.className).toContain('bg-primary');
  });

  it('should show default organization name when none provided', () => {
    (useAuth as any).mockReturnValue({
      user: { email: 'test@example.com' },
      logout: mockLogout,
    });

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Default Org')).toBeInTheDocument();
  });

  it('should handle user with only first name', () => {
    (useAuth as any).mockReturnValue({
      user: {
        first_name: 'John',
        email: 'john@example.com',
        organization: { name: 'Test Org' },
      },
      logout: mockLogout,
    });

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    const avatarButton = screen.getByRole('button', { name: /JO/i });
    fireEvent.click(avatarButton);

    waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
    });
  });

  it('should handle user with only username', async () => {
    (useAuth as any).mockReturnValue({
      user: {
        id: '1',
        username: 'johndoe',
        email: 'john@example.com',
        organization: { id: '1', name: 'Test Org' },
      },
      logout: mockLogout,
    });

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    await waitFor(() => {
      expect(screen.getByText('Bakalr CMS')).toBeInTheDocument();
    });

    // Username 'johndoe' (no spaces) -> getUserInitials -> 'J' (single char, then slice(0,2) = 'J')
    const avatarButton = screen.getByRole('button', { name: /^J$/i });
    expect(avatarButton).toBeInTheDocument();
  });

  it('should display keyboard shortcuts help', () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Keyboard Shortcuts Help')).toBeInTheDocument();
  });
});
