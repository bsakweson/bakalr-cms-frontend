import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Loading from './loading';

describe('Loading Page', () => {
  describe('Loading Spinner', () => {
    it('should render loading spinner', () => {
      const { container } = render(<Loading />);
      
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should have circular border on spinner', () => {
      const { container } = render(<Loading />);
      
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveClass('rounded-full');
    });

    it('should have primary color border', () => {
      const { container } = render(<Loading />);
      
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveClass('border-primary');
    });

    it('should have transparent top border for spin effect', () => {
      const { container } = render(<Loading />);
      
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveClass('border-t-transparent');
    });

    it('should have correct size (12x12)', () => {
      const { container } = render(<Loading />);
      
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveClass('h-12', 'w-12');
    });

    it('should have 4px border width', () => {
      const { container } = render(<Loading />);
      
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveClass('border-4');
    });
  });

  describe('Loading Text', () => {
    it('should render "Loading..." text', () => {
      render(<Loading />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should have muted foreground color', () => {
      render(<Loading />);
      
      const text = screen.getByText('Loading...');
      expect(text).toHaveClass('text-muted-foreground');
    });

    it('should render in paragraph element', () => {
      const { container } = render(<Loading />);
      
      const paragraph = container.querySelector('p');
      expect(paragraph).toBeInTheDocument();
      expect(paragraph).toHaveTextContent('Loading...');
    });
  });

  describe('Layout & Positioning', () => {
    it('should center content horizontally and vertically', () => {
      const { container } = render(<Loading />);
      
      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv).toHaveClass('flex', 'items-center', 'justify-center');
    });

    it('should take full screen height', () => {
      const { container } = render(<Loading />);
      
      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv).toHaveClass('h-screen');
    });

    it('should have vertical layout for inner content', () => {
      const { container } = render(<Loading />);
      
      const innerDiv = container.querySelector('.flex-col');
      expect(innerDiv).toBeInTheDocument();
    });

    it('should have gap between spinner and text', () => {
      const { container } = render(<Loading />);
      
      const innerDiv = container.querySelector('.flex-col');
      expect(innerDiv).toHaveClass('gap-4');
    });

    it('should center items in inner container', () => {
      const { container } = render(<Loading />);
      
      const innerDiv = container.querySelector('.flex-col');
      expect(innerDiv).toHaveClass('items-center');
    });
  });

  describe('Structure', () => {
    it('should have correct nesting structure', () => {
      const { container } = render(<Loading />);
      
      // Outer container
      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv).toBeInTheDocument();
      
      // Inner container with flex-col
      const innerDiv = outerDiv.querySelector('.flex-col');
      expect(innerDiv).toBeInTheDocument();
      
      // Spinner inside inner container
      const spinner = innerDiv?.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      
      // Text inside inner container
      const text = innerDiv?.querySelector('p');
      expect(text).toBeInTheDocument();
    });

    it('should render spinner before text', () => {
      const { container } = render(<Loading />);
      
      const innerDiv = container.querySelector('.flex-col');
      const children = innerDiv?.children;
      
      expect(children?.[0]).toHaveClass('animate-spin');
      expect(children?.[1].tagName).toBe('P');
    });
  });

  describe('Accessibility', () => {
    it('should have descriptive loading text', () => {
      render(<Loading />);
      
      const text = screen.getByText('Loading...');
      expect(text).toBeInTheDocument();
    });

    it('should be readable by screen readers', () => {
      render(<Loading />);
      
      // Text should be in the accessibility tree
      const text = screen.getByText('Loading...');
      expect(text).toBeVisible();
    });

    it('should have semantic HTML structure', () => {
      const { container } = render(<Loading />);
      
      // Should use divs for layout and p for text
      const divs = container.querySelectorAll('div');
      expect(divs.length).toBeGreaterThan(0);
      
      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs).toHaveLength(1);
    });
  });

  describe('Visual Appearance', () => {
    it('should have all styling classes applied', () => {
      const { container } = render(<Loading />);
      
      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv.className).toContain('flex');
      expect(outerDiv.className).toContain('h-screen');
      expect(outerDiv.className).toContain('items-center');
      expect(outerDiv.className).toContain('justify-center');
    });

    it('should render without errors', () => {
      const { container } = render(<Loading />);
      
      expect(container).toBeInTheDocument();
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
