import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Home from './page';

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock Button component
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, asChild, size, variant }: any) => (
    <div data-component="button" data-as-child={asChild} data-size={size} data-variant={variant}>
      {children}
    </div>
  ),
}));

describe('Home Page', () => {
  describe('Hero Section', () => {
    it('should render main heading "Bakalr CMS"', () => {
      render(<Home />);
      
      expect(screen.getByText('Bakalr CMS')).toBeInTheDocument();
    });

    it('should render tagline', () => {
      render(<Home />);
      
      expect(screen.getByText('Modern Headless Content Management System')).toBeInTheDocument();
    });

    it('should have primary color on main heading', () => {
      render(<Home />);
      
      const heading = screen.getByText('Bakalr CMS');
      expect(heading).toHaveClass('text-primary');
    });

    it('should have large text on heading', () => {
      render(<Home />);
      
      const heading = screen.getByText('Bakalr CMS');
      expect(heading).toHaveClass('text-6xl', 'font-bold');
    });

    it('should render description paragraph', () => {
      render(<Home />);
      
      const description = screen.getByText(/Build powerful content experiences/i);
      expect(description).toBeInTheDocument();
    });

    it('should mention key features in description', () => {
      render(<Home />);
      
      const description = screen.getByText(/multi-language support.*advanced theming.*GraphQL API/i);
      expect(description).toBeInTheDocument();
    });
  });

  describe('Call-to-Action Buttons', () => {
    it('should render "Sign In" button', () => {
      render(<Home />);
      
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    it('should render "Get Started" button', () => {
      render(<Home />);
      
      expect(screen.getByText('Get Started')).toBeInTheDocument();
    });

    it('should link "Sign In" to /login', () => {
      render(<Home />);
      
      const signInLink = screen.getByText('Sign In').closest('a');
      expect(signInLink).toHaveAttribute('href', '/login');
    });

    it('should link "Get Started" to /register', () => {
      render(<Home />);
      
      const getStartedLink = screen.getByText('Get Started').closest('a');
      expect(getStartedLink).toHaveAttribute('href', '/register');
    });

    it('should render Sign In as primary button', () => {
      const { container } = render(<Home />);
      
      const signInButton = container.querySelector('[data-component="button"]');
      expect(signInButton).not.toHaveAttribute('data-variant'); // Primary is default
    });

    it('should render Get Started as outline button', () => {
      const { container } = render(<Home />);
      
      const buttons = container.querySelectorAll('[data-component="button"]');
      const getStartedButton = buttons[1]; // Second button
      expect(getStartedButton).toHaveAttribute('data-variant', 'outline');
    });

    it('should have large size on both buttons', () => {
      const { container } = render(<Home />);
      
      const buttons = container.querySelectorAll('[data-component="button"]');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('data-size', 'lg');
      });
    });

    it('should render buttons side by side on desktop', () => {
      const { container } = render(<Home />);
      
      const buttonContainer = container.querySelector('.flex-col.sm\\:flex-row');
      expect(buttonContainer).toBeInTheDocument();
    });
  });

  describe('Features Section', () => {
    it('should render "Key Features" heading', () => {
      render(<Home />);
      
      expect(screen.getByText('Key Features')).toBeInTheDocument();
    });

    it('should render multi-language feature card', () => {
      render(<Home />);
      
      expect(screen.getByText('Multi-Language')).toBeInTheDocument();
      expect(screen.getByText(/Automatic translation to multiple languages/i)).toBeInTheDocument();
    });

    it('should render custom theming feature card', () => {
      render(<Home />);
      
      expect(screen.getByText('Custom Theming')).toBeInTheDocument();
      expect(screen.getByText(/Beautiful dark chocolate brown theme/i)).toBeInTheDocument();
    });

    it('should render GraphQL API feature card', () => {
      render(<Home />);
      
      expect(screen.getByText('GraphQL API')).toBeInTheDocument();
      expect(screen.getByText(/Flexible querying with REST & GraphQL/i)).toBeInTheDocument();
    });

    it('should display emoji icons for each feature', () => {
      render(<Home />);
      
      expect(screen.getByText('🌍')).toBeInTheDocument(); // Multi-language
      expect(screen.getByText('🎨')).toBeInTheDocument(); // Theming
      expect(screen.getByText('⚡')).toBeInTheDocument(); // API
    });

    it('should render three feature cards', () => {
      const { container } = render(<Home />);
      
      const featureCards = container.querySelectorAll('.border.bg-card');
      expect(featureCards).toHaveLength(3);
    });

    it('should display features in grid layout', () => {
      const { container } = render(<Home />);
      
      const grid = container.querySelector('.grid.sm\\:grid-cols-3');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Layout & Styling', () => {
    it('should have full viewport height', () => {
      const { container } = render(<Home />);
      
      const main = container.querySelector('div');
      expect(main).toHaveClass('min-h-screen');
    });

    it('should center content', () => {
      const { container } = render(<Home />);
      
      const main = container.querySelector('div');
      expect(main).toHaveClass('items-center', 'justify-center');
    });

    it('should have gradient background', () => {
      const { container } = render(<Home />);
      
      const main = container.querySelector('div');
      expect(main).toHaveClass('bg-linear-to-b');
    });

    it('should use container for content width', () => {
      const { container } = render(<Home />);
      
      const mainElement = container.querySelector('main');
      expect(mainElement).toHaveClass('container');
    });

    it('should have responsive padding', () => {
      const { container } = render(<Home />);
      
      const mainElement = container.querySelector('main');
      expect(mainElement).toHaveClass('px-4');
    });
  });

  describe('Responsive Design', () => {
    it('should stack buttons vertically on mobile', () => {
      const { container } = render(<Home />);
      
      const buttonContainer = container.querySelector('.flex-col');
      expect(buttonContainer).toBeInTheDocument();
    });

    it('should arrange buttons horizontally on desktop', () => {
      const { container } = render(<Home />);
      
      const buttonContainer = container.querySelector('.sm\\:flex-row');
      expect(buttonContainer).toBeInTheDocument();
    });

    it('should use grid columns on desktop for features', () => {
      const { container } = render(<Home />);
      
      const grid = container.querySelector('.sm\\:grid-cols-3');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have main element for landmark navigation', () => {
      const { container } = render(<Home />);
      
      const main = container.querySelector('main');
      expect(main).toBeInTheDocument();
    });

    it('should have descriptive headings hierarchy', () => {
      const { container } = render(<Home />);
      
      const h1 = container.querySelector('h1');
      expect(h1).toHaveTextContent('Bakalr CMS');
      
      const h2 = container.querySelector('h2');
      expect(h2).toHaveTextContent('Key Features');
    });

    it('should have h3 headings for each feature', () => {
      const { container } = render(<Home />);
      
      const h3Elements = container.querySelectorAll('h3');
      expect(h3Elements).toHaveLength(3);
      expect(h3Elements[0]).toHaveTextContent('Multi-Language');
      expect(h3Elements[1]).toHaveTextContent('Custom Theming');
      expect(h3Elements[2]).toHaveTextContent('GraphQL API');
    });

    it('should have descriptive link text', () => {
      render(<Home />);
      
      const links = screen.getAllByRole('link');
      expect(links[0]).toHaveTextContent('Sign In');
      expect(links[1]).toHaveTextContent('Get Started');
    });
  });

  describe('Content Quality', () => {
    it('should render all essential content', () => {
      render(<Home />);
      
      // Hero
      expect(screen.getByText('Bakalr CMS')).toBeInTheDocument();
      expect(screen.getByText('Modern Headless Content Management System')).toBeInTheDocument();
      
      // Description
      expect(screen.getByText(/Build powerful content experiences/i)).toBeInTheDocument();
      
      // CTAs
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByText('Get Started')).toBeInTheDocument();
      
      // Features
      expect(screen.getByText('Multi-Language')).toBeInTheDocument();
      expect(screen.getByText('Custom Theming')).toBeInTheDocument();
      expect(screen.getByText('GraphQL API')).toBeInTheDocument();
    });

    it('should have consistent spacing throughout', () => {
      const { container } = render(<Home />);
      
      const gaps = container.querySelectorAll('.gap-4, .gap-6, .gap-8');
      expect(gaps.length).toBeGreaterThan(0);
    });
  });
});
