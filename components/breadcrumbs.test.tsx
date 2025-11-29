import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { Breadcrumbs } from './breadcrumbs';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe('Breadcrumbs', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
  });

  describe('Rendering', () => {
    it('should render single breadcrumb item', () => {
      const items = [{ label: 'Dashboard' }];
      render(<Breadcrumbs items={items} />);
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('should render multiple breadcrumb items', () => {
      const items = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Content', href: '/dashboard/content' },
        { label: 'Edit' },
      ];
      render(<Breadcrumbs items={items} />);
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('should render separators between items', () => {
      const items = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Content' },
      ];
      render(<Breadcrumbs items={items} />);
      
      expect(screen.getByText('/')).toBeInTheDocument();
    });

    it('should not render separator before first item', () => {
      const items = [{ label: 'Dashboard' }];
      const { container } = render(<Breadcrumbs items={items} />);
      
      const separators = container.querySelectorAll('.mx-2');
      expect(separators.length).toBe(0);
    });

    it('should render correct number of separators', () => {
      const items = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Content', href: '/dashboard/content' },
        { label: 'Edit' },
      ];
      const { container } = render(<Breadcrumbs items={items} />);
      
      const separators = container.querySelectorAll('.mx-2');
      expect(separators.length).toBe(2); // One less than items
    });
  });

  describe('Links', () => {
    it('should render items with href as links', () => {
      const items = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Content' },
      ];
      render(<Breadcrumbs items={items} />);
      
      const dashboardLink = screen.getByText('Dashboard');
      expect(dashboardLink.closest('a')).toHaveAttribute('href', '/dashboard');
    });

    it('should not render last item as link even if it has href', () => {
      const items = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Content', href: '/dashboard/content' },
      ];
      render(<Breadcrumbs items={items} />);
      
      const contentText = screen.getByText('Content');
      expect(contentText.closest('a')).toBeNull();
    });

    it('should render items without href as spans', () => {
      const items = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Content' },
      ];
      render(<Breadcrumbs items={items} />);
      
      const contentText = screen.getByText('Content');
      expect(contentText.tagName).toBe('SPAN');
    });
  });

  describe('Styling', () => {
    it('should apply special styling to last item', () => {
      const items = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Content' },
      ];
      render(<Breadcrumbs items={items} />);
      
      const contentText = screen.getByText('Content');
      expect(contentText).toHaveClass('text-foreground', 'font-medium');
    });

    it('should not apply special styling to non-last items', () => {
      const items = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Content', href: '/dashboard/content' },
        { label: 'Edit' },
      ];
      render(<Breadcrumbs items={items} />);
      
      const dashboardLink = screen.getByText('Dashboard');
      expect(dashboardLink).not.toHaveClass('text-foreground', 'font-medium');
      
      const contentLink = screen.getByText('Content');
      expect(contentLink).not.toHaveClass('text-foreground', 'font-medium');
    });
  });

  describe('Accessibility', () => {
    it('should have nav element with proper role', () => {
      const items = [{ label: 'Dashboard' }];
      const { container } = render(<Breadcrumbs items={items} />);
      
      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();
    });

    it('should render links with proper href attributes', () => {
      const items = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Content', href: '/dashboard/content' },
        { label: 'Edit' },
      ];
      render(<Breadcrumbs items={items} />);
      
      const dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    });
  });

  describe('Empty State', () => {
    it('should handle empty items array', () => {
      const { container } = render(<Breadcrumbs items={[]} />);
      
      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();
      expect(nav?.children.length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single item with href', () => {
      const items = [{ label: 'Dashboard', href: '/dashboard' }];
      render(<Breadcrumbs items={items} />);
      
      const dashboardText = screen.getByText('Dashboard');
      // Last item should not be a link even with href
      expect(dashboardText.closest('a')).toBeNull();
      expect(dashboardText).toHaveClass('text-foreground', 'font-medium');
    });

    it('should handle items with special characters', () => {
      const items = [
        { label: 'Dashboard & Settings', href: '/dashboard' },
        { label: 'Content <Type>' },
      ];
      render(<Breadcrumbs items={items} />);
      
      expect(screen.getByText('Dashboard & Settings')).toBeInTheDocument();
      expect(screen.getByText('Content <Type>')).toBeInTheDocument();
    });

    it('should handle very long labels', () => {
      const items = [
        { label: 'This is a very long breadcrumb label that might need special handling', href: '/dashboard' },
        { label: 'Short' },
      ];
      render(<Breadcrumbs items={items} />);
      
      expect(screen.getByText('This is a very long breadcrumb label that might need special handling')).toBeInTheDocument();
    });
  });
});
