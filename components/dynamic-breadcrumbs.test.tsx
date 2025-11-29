import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { DynamicBreadcrumbs } from './dynamic-breadcrumbs';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

// Mock Breadcrumbs component
vi.mock('@/components/breadcrumbs', () => ({
  Breadcrumbs: ({ items }: any) => (
    <div data-testid="breadcrumbs">
      {items.map((item: any, index: number) => (
        <span key={index} data-label={item.label} data-href={item.href}>
          {item.label}
        </span>
      ))}
    </div>
  ),
}));

describe('DynamicBreadcrumbs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render on root dashboard', () => {
      (usePathname as any).mockReturnValue('/dashboard');
      
      const { container } = render(<DynamicBreadcrumbs />);
      
      expect(container.querySelector('[data-testid="breadcrumbs"]')).not.toBeInTheDocument();
    });

    it('should not render on dashboard root with trailing slash', () => {
      (usePathname as any).mockReturnValue('/dashboard/');
      
      const { container } = render(<DynamicBreadcrumbs />);
      
      expect(container.querySelector('[data-testid="breadcrumbs"]')).not.toBeInTheDocument();
    });

    it('should render breadcrumbs for nested pages', () => {
      (usePathname as any).mockReturnValue('/dashboard/content');
      
      render(<DynamicBreadcrumbs />);
      
      expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
    });
  });

  describe('Label Generation', () => {
    it('should use route labels for known routes', () => {
      (usePathname as any).mockReturnValue('/dashboard/content');
      
      render(<DynamicBreadcrumbs />);
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should capitalize segments without route labels', () => {
      (usePathname as any).mockReturnValue('/dashboard/unknown-route');
      
      render(<DynamicBreadcrumbs />);
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Unknown Route')).toBeInTheDocument();
    });

    it('should handle kebab-case route names', () => {
      (usePathname as any).mockReturnValue('/dashboard/content-types');
      
      render(<DynamicBreadcrumbs />);
      
      expect(screen.getByText('Content Types')).toBeInTheDocument();
    });

    it('should handle audit-logs route', () => {
      (usePathname as any).mockReturnValue('/dashboard/audit-logs');
      
      render(<DynamicBreadcrumbs />);
      
      expect(screen.getByText('Audit Logs')).toBeInTheDocument();
    });
  });

  describe('Link Generation', () => {
    it('should not link the last breadcrumb item', () => {
      (usePathname as any).mockReturnValue('/dashboard/content');
      
      const { container } = render(<DynamicBreadcrumbs />);
      
      const contentItem = container.querySelector('[data-label="Content"]');
      expect(contentItem).not.toHaveAttribute('data-href');
    });

    it('should link all items except the last one', () => {
      (usePathname as any).mockReturnValue('/dashboard/content/new');
      
      const { container } = render(<DynamicBreadcrumbs />);
      
      const dashboardItem = container.querySelector('[data-label="Dashboard"]');
      expect(dashboardItem).toHaveAttribute('data-href', '/dashboard');
      
      const contentItem = container.querySelector('[data-label="Content"]');
      expect(contentItem).toHaveAttribute('data-href', '/dashboard/content');
      
      const newItem = container.querySelector('[data-label="New"]');
      expect(newItem).not.toHaveAttribute('data-href');
    });

    it('should build correct paths for nested routes', () => {
      (usePathname as any).mockReturnValue('/dashboard/content/types/builder');
      
      const { container } = render(<DynamicBreadcrumbs />);
      
      const dashboardItem = container.querySelector('[data-label="Dashboard"]');
      expect(dashboardItem).toHaveAttribute('data-href', '/dashboard');
      
      const contentItem = container.querySelector('[data-label="Content"]');
      expect(contentItem).toHaveAttribute('data-href', '/dashboard/content');
      
      const typesItem = container.querySelector('[data-label="Types"]');
      expect(typesItem).toHaveAttribute('data-href', '/dashboard/content/types');
    });
  });

  describe('Multiple Levels', () => {
    it('should handle two-level paths', () => {
      (usePathname as any).mockReturnValue('/dashboard/users');
      
      render(<DynamicBreadcrumbs />);
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Users')).toBeInTheDocument();
    });

    it('should handle three-level paths', () => {
      (usePathname as any).mockReturnValue('/dashboard/content/new');
      
      render(<DynamicBreadcrumbs />);
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('should handle four-level paths', () => {
      (usePathname as any).mockReturnValue('/dashboard/content-types/1/edit');
      
      render(<DynamicBreadcrumbs />);
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Content Types')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });
  });

  describe('Special Routes', () => {
    it('should handle settings route', () => {
      (usePathname as any).mockReturnValue('/dashboard/settings');
      
      render(<DynamicBreadcrumbs />);
      
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should handle translations route', () => {
      (usePathname as any).mockReturnValue('/dashboard/translations');
      
      render(<DynamicBreadcrumbs />);
      
      expect(screen.getByText('Translations')).toBeInTheDocument();
    });

    it('should handle templates route', () => {
      (usePathname as any).mockReturnValue('/dashboard/templates');
      
      render(<DynamicBreadcrumbs />);
      
      expect(screen.getByText('Templates')).toBeInTheDocument();
    });

    it('should handle themes route', () => {
      (usePathname as any).mockReturnValue('/dashboard/themes');
      
      render(<DynamicBreadcrumbs />);
      
      expect(screen.getByText('Themes')).toBeInTheDocument();
    });

    it('should handle organization route', () => {
      (usePathname as any).mockReturnValue('/dashboard/organization');
      
      render(<DynamicBreadcrumbs />);
      
      expect(screen.getByText('Organization')).toBeInTheDocument();
    });

    it('should handle roles route', () => {
      (usePathname as any).mockReturnValue('/dashboard/roles');
      
      render(<DynamicBreadcrumbs />);
      
      expect(screen.getByText('Roles')).toBeInTheDocument();
    });

    it('should handle media route', () => {
      (usePathname as any).mockReturnValue('/dashboard/media');
      
      render(<DynamicBreadcrumbs />);
      
      expect(screen.getByText('Media')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null pathname', () => {
      (usePathname as any).mockReturnValue(null);
      
      const { container } = render(<DynamicBreadcrumbs />);
      
      expect(container.querySelector('[data-testid="breadcrumbs"]')).not.toBeInTheDocument();
    });

    it('should handle empty pathname', () => {
      (usePathname as any).mockReturnValue('');
      
      const { container } = render(<DynamicBreadcrumbs />);
      
      expect(container.querySelector('[data-testid="breadcrumbs"]')).not.toBeInTheDocument();
    });

    it('should handle trailing slashes', () => {
      (usePathname as any).mockReturnValue('/dashboard/content/');
      
      render(<DynamicBreadcrumbs />);
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should handle multiple slashes', () => {
      (usePathname as any).mockReturnValue('//dashboard//content//');
      
      render(<DynamicBreadcrumbs />);
      
      // Should filter out empty segments
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('Dynamic IDs', () => {
    it('should handle numeric IDs in path', () => {
      (usePathname as any).mockReturnValue('/dashboard/content/123');
      
      render(<DynamicBreadcrumbs />);
      
      expect(screen.getByText('123')).toBeInTheDocument();
    });

    it('should handle UUID-style IDs', () => {
      (usePathname as any).mockReturnValue('/dashboard/content/abc-123-def');
      
      render(<DynamicBreadcrumbs />);
      
      expect(screen.getByText('Abc 123 Def')).toBeInTheDocument();
    });
  });

  describe('Container Structure', () => {
    it('should wrap breadcrumbs in div with mb-4 class', () => {
      (usePathname as any).mockReturnValue('/dashboard/content');
      
      const { container } = render(<DynamicBreadcrumbs />);
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('mb-4');
    });
  });
});
