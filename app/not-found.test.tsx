import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import NotFound from './not-found';

describe('Not Found Page', () => {
  describe('Page Content', () => {
    it('should render 404 status code', () => {
      render(<NotFound />);
      
      expect(screen.getByText('404')).toBeInTheDocument();
    });

    it('should render "Page not found" message', () => {
      render(<NotFound />);
      
      expect(screen.getByText('Page not found')).toBeInTheDocument();
    });

    it('should render dashboard link', () => {
      render(<NotFound />);
      
      const link = screen.getByRole('link', { name: /go to dashboard/i });
      expect(link).toBeInTheDocument();
    });
  });

  describe('Dashboard Link', () => {
    it('should link to /dashboard', () => {
      render(<NotFound />);
      
      const link = screen.getByRole('link', { name: /go to dashboard/i });
      expect(link).toHaveAttribute('href', '/dashboard');
    });

    it('should have correct text', () => {
      render(<NotFound />);
      
      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
    });

    it('should have primary button styling', () => {
      render(<NotFound />);
      
      const link = screen.getByRole('link', { name: /go to dashboard/i });
      expect(link).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it('should have hover effect', () => {
      render(<NotFound />);
      
      const link = screen.getByRole('link', { name: /go to dashboard/i });
      expect(link).toHaveClass('hover:bg-primary/90');
    });

    it('should have transition animation', () => {
      render(<NotFound />);
      
      const link = screen.getByRole('link', { name: /go to dashboard/i });
      expect(link).toHaveClass('transition-colors');
    });
  });

  describe('Layout & Styling', () => {
    it('should have centered layout with full height', () => {
      const { container } = render(<NotFound />);
      
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('flex', 'h-screen', 'items-center', 'justify-center');
    });

    it('should have vertical flex layout with gap', () => {
      const { container } = render(<NotFound />);
      
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('flex-col', 'gap-4');
    });

    it('should render 404 with large bold text', () => {
      render(<NotFound />);
      
      const heading = screen.getByText('404');
      expect(heading).toHaveClass('text-6xl', 'font-bold');
    });

    it('should have muted foreground color on 404', () => {
      render(<NotFound />);
      
      const heading = screen.getByText('404');
      expect(heading).toHaveClass('text-muted-foreground');
    });

    it('should have muted foreground color on message', () => {
      render(<NotFound />);
      
      const message = screen.getByText('Page not found');
      expect(message).toHaveClass('text-muted-foreground');
    });

    it('should have large text on message', () => {
      render(<NotFound />);
      
      const message = screen.getByText('Page not found');
      expect(message).toHaveClass('text-xl');
    });
  });

  describe('Accessibility', () => {
    it('should have h1 element for 404 status', () => {
      const { container } = render(<NotFound />);
      
      const h1 = container.querySelector('h1');
      expect(h1).toBeInTheDocument();
      expect(h1).toHaveTextContent('404');
    });

    it('should have link with descriptive text', () => {
      render(<NotFound />);
      
      const link = screen.getByRole('link');
      expect(link).toHaveAccessibleName('Go to Dashboard');
    });

    it('should have proper semantic structure', () => {
      const { container } = render(<NotFound />);
      
      // Should have one h1
      const h1Elements = container.querySelectorAll('h1');
      expect(h1Elements).toHaveLength(1);
      
      // Should have one paragraph
      const pElements = container.querySelectorAll('p');
      expect(pElements).toHaveLength(1);
      
      // Should have one link
      const links = container.querySelectorAll('a');
      expect(links).toHaveLength(1);
    });
  });

  describe('Visual Consistency', () => {
    it('should match design system spacing', () => {
      render(<NotFound />);
      
      const link = screen.getByRole('link');
      expect(link).toHaveClass('mt-4'); // Top margin
      expect(link).toHaveClass('px-4', 'py-2'); // Padding
      expect(link).toHaveClass('rounded-lg'); // Border radius
    });

    it('should render all expected elements', () => {
      render(<NotFound />);
      
      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText('Page not found')).toBeInTheDocument();
      expect(screen.getByRole('link')).toBeInTheDocument();
    });
  });
});
