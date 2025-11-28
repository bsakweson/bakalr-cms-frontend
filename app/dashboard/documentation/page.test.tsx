import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DocumentationPage from './page';

describe('DocumentationPage', () => {
  describe('Initial Rendering', () => {
    it('should display page title', () => {
      render(<DocumentationPage />);
      
      expect(screen.getByText('Documentation')).toBeInTheDocument();
    });

    it('should display page description', () => {
      render(<DocumentationPage />);
      
      expect(screen.getByText('Comprehensive guides and references for Bakalr CMS features')).toBeInTheDocument();
    });

    it('should render documentation sections grid', () => {
      const { container } = render(<DocumentationPage />);
      
      // Check for grid layout
      const grids = container.querySelectorAll('.grid');
      expect(grids.length).toBeGreaterThan(0);
    });
  });

  describe('Documentation Sections', () => {
    it('should display search documentation card', () => {
      render(<DocumentationPage />);
      
      expect(screen.getByText('search')).toBeInTheDocument();
      expect(screen.getByText('Full-text search with Meilisearch')).toBeInTheDocument();
    });

    it('should display webhooks documentation card', () => {
      render(<DocumentationPage />);
      
      expect(screen.getByText('webhooks')).toBeInTheDocument();
      expect(screen.getByText('Webhook configuration and logs')).toBeInTheDocument();
    });

    it('should display notifications documentation card', () => {
      render(<DocumentationPage />);
      
      expect(screen.getByText('notifications')).toBeInTheDocument();
      expect(screen.getByText('In-app notifications')).toBeInTheDocument();
    });

    it('should display themes documentation card', () => {
      render(<DocumentationPage />);
      
      expect(screen.getByText('themes')).toBeInTheDocument();
      expect(screen.getByText('Custom theming')).toBeInTheDocument();
    });

    it('should display audit documentation card', () => {
      render(<DocumentationPage />);
      
      expect(screen.getByText('audit')).toBeInTheDocument();
      expect(screen.getByText('Audit log viewer')).toBeInTheDocument();
    });

    it('should display analytics documentation card', () => {
      render(<DocumentationPage />);
      
      expect(screen.getByText('analytics')).toBeInTheDocument();
      expect(screen.getByText('Content and user analytics')).toBeInTheDocument();
    });

    it('should display getting started documentation card', () => {
      render(<DocumentationPage />);
      
      expect(screen.getByText('getting started')).toBeInTheDocument();
      expect(screen.getByText('Installation and first steps')).toBeInTheDocument();
    });

    it('should display authentication documentation card', () => {
      render(<DocumentationPage />);
      
      expect(screen.getByText('authentication')).toBeInTheDocument();
      expect(screen.getByText('JWT, 2FA, API keys, password reset')).toBeInTheDocument();
    });

    it('should display API reference card', () => {
      render(<DocumentationPage />);
      
      expect(screen.getByText('API reference')).toBeInTheDocument();
      expect(screen.getByText('Interactive OpenAPI documentation')).toBeInTheDocument();
    });

    it('should display developer guide card', () => {
      render(<DocumentationPage />);
      
      expect(screen.getByText('developer guide')).toBeInTheDocument();
      expect(screen.getByText('Architecture and development')).toBeInTheDocument();
    });

    it('should display deployment card', () => {
      render(<DocumentationPage />);
      
      expect(screen.getByText('deployment')).toBeInTheDocument();
      expect(screen.getByText('Docker and production setup')).toBeInTheDocument();
    });

    it('should display security card', () => {
      render(<DocumentationPage />);
      
      expect(screen.getByText('security')).toBeInTheDocument();
      expect(screen.getByText('Best practices and hardening')).toBeInTheDocument();
    });

    it('should render all 12 documentation sections', () => {
      render(<DocumentationPage />);
      
      // Count all documentation cards (12 sections)
      expect(screen.getByText('search')).toBeInTheDocument();
      expect(screen.getByText('webhooks')).toBeInTheDocument();
      expect(screen.getByText('notifications')).toBeInTheDocument();
      expect(screen.getByText('themes')).toBeInTheDocument();
      expect(screen.getByText('audit')).toBeInTheDocument();
      expect(screen.getByText('analytics')).toBeInTheDocument();
      expect(screen.getByText('getting started')).toBeInTheDocument();
      expect(screen.getByText('authentication')).toBeInTheDocument();
      expect(screen.getByText('API reference')).toBeInTheDocument();
      expect(screen.getByText('developer guide')).toBeInTheDocument();
      expect(screen.getByText('deployment')).toBeInTheDocument();
      expect(screen.getByText('security')).toBeInTheDocument();
    });
  });

  describe('External Links', () => {
    it('should have external links for most documentation sections', () => {
      const { container } = render(<DocumentationPage />);
      
      // Most sections link to external GitHub docs
      const externalLinks = container.querySelectorAll('a[target="_blank"]');
      expect(externalLinks.length).toBeGreaterThan(0);
    });

    it('should have rel="noopener noreferrer" on external links', () => {
      const { container } = render(<DocumentationPage />);
      
      const externalLinks = container.querySelectorAll('a[target="_blank"]');
      externalLinks.forEach((link) => {
        expect(link.getAttribute('rel')).toContain('noopener');
        expect(link.getAttribute('rel')).toContain('noreferrer');
      });
    });

    it('should show external link icons for external documentation', () => {
      const { container } = render(<DocumentationPage />);
      
      // ExternalLink icons are SVGs from lucide-react
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });
  });

  describe('Additional Resources', () => {
    it('should display additional resources section', () => {
      render(<DocumentationPage />);
      
      expect(screen.getByText('Additional Resources')).toBeInTheDocument();
      expect(screen.getByText('More information and community resources')).toBeInTheDocument();
    });

    it('should display GitHub repository link', () => {
      render(<DocumentationPage />);
      
      expect(screen.getByText('GitHub Repository')).toBeInTheDocument();
    });

    it('should display changelog link', () => {
      render(<DocumentationPage />);
      
      expect(screen.getByText('Changelog')).toBeInTheDocument();
    });

    it('should display contributing guide link', () => {
      render(<DocumentationPage />);
      
      expect(screen.getByText('Contributing Guide')).toBeInTheDocument();
    });

    it('should display report issue link', () => {
      render(<DocumentationPage />);
      
      expect(screen.getByText('Report an Issue')).toBeInTheDocument();
    });

    it('should have external links for all additional resources', () => {
      const { container } = render(<DocumentationPage />);
      
      // Find the Additional Resources card
      const resourcesHeading = screen.getByText('Additional Resources');
      const resourcesCard = resourcesHeading.closest('[data-slot="card"]');
      
      // All links in Additional Resources should be external
      const links = resourcesCard?.querySelectorAll('a[target="_blank"]');
      expect(links?.length).toBe(4); // GitHub, Changelog, Contributing, Issues
    });
  });

  describe('Card Styling', () => {
    it('should have hover effects on documentation cards', () => {
      const { container } = render(<DocumentationPage />);
      
      // Cards should have hover classes
      const cards = container.querySelectorAll('.hover\\:bg-accent\\/50');
      expect(cards.length).toBe(12); // All 12 documentation sections
    });

    it('should have transition classes on cards', () => {
      const { container } = render(<DocumentationPage />);
      
      const cards = container.querySelectorAll('.transition-colors');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should have cursor pointer on cards', () => {
      const { container } = render(<DocumentationPage />);
      
      const cards = container.querySelectorAll('.cursor-pointer');
      expect(cards.length).toBe(12);
    });
  });

  describe('Icons', () => {
    it('should display icons for each documentation section', () => {
      const { container } = render(<DocumentationPage />);
      
      // Icons are rendered as SVGs
      const svgs = container.querySelectorAll('svg');
      // At least 12 section icons + 4 external link icons in Additional Resources
      expect(svgs.length).toBeGreaterThanOrEqual(16);
    });

    it('should have icon wrappers with primary color', () => {
      const { container } = render(<DocumentationPage />);
      
      // Icon wrappers have bg-primary/10 class
      const iconWrappers = container.querySelectorAll('.bg-primary\\/10');
      expect(iconWrappers.length).toBe(12);
    });

    it('should have hover effects on icon wrappers', () => {
      const { container } = render(<DocumentationPage />);
      
      // Icon wrappers should have hover classes
      const iconWrappers = container.querySelectorAll('.group-hover\\:bg-primary');
      expect(iconWrappers.length).toBe(12);
    });
  });

  describe('Internal vs External Links', () => {
    it('should have internal link for analytics', () => {
      const { container } = render(<DocumentationPage />);
      
      // Analytics links to /dashboard (internal)
      const analyticsCard = screen.getByText('analytics').closest('a');
      expect(analyticsCard?.getAttribute('href')).toBe('/dashboard');
      expect(analyticsCard?.getAttribute('target')).toBeNull(); // Not _blank
    });

    it('should have external links for most documentation sections', () => {
      const { container } = render(<DocumentationPage />);
      
      // Most sections link to GitHub docs
      const searchCard = screen.getByText('search').closest('a');
      expect(searchCard?.getAttribute('href')).toContain('github.com');
      expect(searchCard?.getAttribute('target')).toBe('_blank');
    });
  });

  describe('Responsive Layout', () => {
    it('should have responsive grid classes', () => {
      const { container } = render(<DocumentationPage />);
      
      // Should have md:grid-cols-2 and lg:grid-cols-3
      const grid = container.querySelector('.md\\:grid-cols-2');
      expect(grid).toBeInTheDocument();
      
      const lgGrid = container.querySelector('.lg\\:grid-cols-3');
      expect(lgGrid).toBeInTheDocument();
    });

    it('should have gap between cards', () => {
      const { container } = render(<DocumentationPage />);
      
      const grid = container.querySelector('.gap-4');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Page Structure', () => {
    it('should have proper spacing between sections', () => {
      const { container } = render(<DocumentationPage />);
      
      const mainContainer = container.querySelector('.space-y-6');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should render all UI components', () => {
      render(<DocumentationPage />);
      
      // Should have page title
      expect(screen.getByText('Documentation')).toBeInTheDocument();
      
      // Should have documentation cards
      expect(screen.getByText('search')).toBeInTheDocument();
      
      // Should have additional resources
      expect(screen.getByText('Additional Resources')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have descriptive text for all links', () => {
      render(<DocumentationPage />);
      
      // All cards should have titles and descriptions
      expect(screen.getByText('search')).toBeInTheDocument();
      expect(screen.getByText('Full-text search with Meilisearch')).toBeInTheDocument();
      
      expect(screen.getByText('webhooks')).toBeInTheDocument();
      expect(screen.getByText('Webhook configuration and logs')).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      const { container } = render(<DocumentationPage />);
      
      // Main heading should be h1
      const h1 = container.querySelector('h1');
      expect(h1?.textContent).toBe('Documentation');
    });
  });
});
