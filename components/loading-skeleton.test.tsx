import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { LoadingSkeleton } from './loading-skeleton';

describe('LoadingSkeleton', () => {
  describe('Card Type', () => {
    it('should render card skeleton by default', () => {
      const { container } = render(<LoadingSkeleton />);
      
      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('gap-4', 'md:grid-cols-2', 'lg:grid-cols-3');
    });

    it('should render card skeleton when type is card', () => {
      const { container } = render(<LoadingSkeleton type="card" />);
      
      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });

    it('should render 6 card placeholders', () => {
      const { container } = render(<LoadingSkeleton type="card" />);
      
      const cards = container.querySelectorAll('.rounded-lg.border.bg-card.p-6');
      expect(cards.length).toBe(6);
    });

    it('should have animate-pulse on cards', () => {
      const { container } = render(<LoadingSkeleton type="card" />);
      
      const cards = container.querySelectorAll('.animate-pulse');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should have skeleton lines in each card', () => {
      const { container } = render(<LoadingSkeleton type="card" />);
      
      const cards = container.querySelectorAll('.rounded-lg.border.bg-card.p-6');
      cards.forEach((card) => {
        const skeletonLines = card.querySelectorAll('.bg-muted.rounded');
        expect(skeletonLines.length).toBe(3); // Title + 2 lines
      });
    });
  });

  describe('List Type', () => {
    it('should render list skeleton when type is list', () => {
      const { container } = render(<LoadingSkeleton type="list" />);
      
      const listContainer = container.querySelector('.space-y-4');
      expect(listContainer).toBeInTheDocument();
    });

    it('should render 5 list items', () => {
      const { container } = render(<LoadingSkeleton type="list" />);
      
      const items = container.querySelectorAll('.flex.items-center.gap-4');
      expect(items.length).toBe(5);
    });

    it('should have circular avatar placeholder in list items', () => {
      const { container } = render(<LoadingSkeleton type="list" />);
      
      const avatars = container.querySelectorAll('.h-12.w-12.rounded-full.bg-muted');
      expect(avatars.length).toBe(5);
    });

    it('should have text lines in list items', () => {
      const { container } = render(<LoadingSkeleton type="list" />);
      
      const items = container.querySelectorAll('.flex.items-center.gap-4');
      items.forEach((item) => {
        const textLines = item.querySelectorAll('.flex-1 .bg-muted.rounded');
        expect(textLines.length).toBe(2); // Title + subtitle
      });
    });

    it('should have animate-pulse on list items', () => {
      const { container } = render(<LoadingSkeleton type="list" />);
      
      const items = container.querySelectorAll('.animate-pulse');
      expect(items.length).toBe(5);
    });
  });

  describe('Table Type', () => {
    it('should render table skeleton when type is table', () => {
      const { container } = render(<LoadingSkeleton type="table" />);
      
      const table = container.querySelector('.rounded-lg.border.bg-card');
      expect(table).toBeInTheDocument();
    });

    it('should have table header', () => {
      const { container } = render(<LoadingSkeleton type="table" />);
      
      const header = container.querySelector('.p-4.border-b .h-4.bg-muted.rounded.w-48');
      expect(header).toBeInTheDocument();
    });

    it('should render 5 table rows', () => {
      const { container } = render(<LoadingSkeleton type="table" />);
      
      // Find rows (excluding header)
      const table = container.querySelector('.rounded-lg.border.bg-card');
      const rows = table?.querySelectorAll(':scope > div:not(:first-child)');
      expect(rows?.length).toBe(5);
    });

    it('should have 4 columns in each row', () => {
      const { container } = render(<LoadingSkeleton type="table" />);
      
      const rows = container.querySelectorAll('.grid.grid-cols-4');
      expect(rows.length).toBe(5);
      
      rows.forEach((row) => {
        const columns = row.querySelectorAll('.h-4.bg-muted.rounded');
        expect(columns.length).toBe(4);
      });
    });

    it('should have animate-pulse on rows', () => {
      const { container } = render(<LoadingSkeleton type="table" />);
      
      const table = container.querySelector('.rounded-lg.border.bg-card');
      const animatedRows = table?.querySelectorAll('.animate-pulse');
      expect(animatedRows && animatedRows.length).toBeGreaterThan(0);
    });

    it('should not have border on last row', () => {
      const { container } = render(<LoadingSkeleton type="table" />);
      
      const rows = container.querySelectorAll('.p-4.border-b.last\\:border-b-0');
      expect(rows.length).toBe(5);
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive grid columns for card type', () => {
      const { container } = render(<LoadingSkeleton type="card" />);
      
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('md:grid-cols-2', 'lg:grid-cols-3');
    });
  });

  describe('Styling', () => {
    it('should have consistent styling across all card skeletons', () => {
      const { container } = render(<LoadingSkeleton type="card" />);
      
      const cards = container.querySelectorAll('.rounded-lg.border.bg-card.p-6.animate-pulse');
      expect(cards.length).toBe(6);
      
      cards.forEach((card) => {
        expect(card).toHaveClass('rounded-lg', 'border', 'bg-card', 'p-6', 'animate-pulse');
      });
    });

    it('should have consistent styling across all list items', () => {
      const { container } = render(<LoadingSkeleton type="list" />);
      
      const items = container.querySelectorAll('.flex.items-center.gap-4.rounded-lg.border.bg-card.p-4.animate-pulse');
      expect(items.length).toBe(5);
    });

    it('should use muted background for skeleton elements', () => {
      const { container } = render(<LoadingSkeleton type="card" />);
      
      const skeletonElements = container.querySelectorAll('.bg-muted');
      expect(skeletonElements.length).toBeGreaterThan(0);
      
      skeletonElements.forEach((element) => {
        expect(element).toHaveClass('bg-muted');
      });
    });
  });

  describe('Animation', () => {
    it('should have pulse animation on card skeletons', () => {
      const { container } = render(<LoadingSkeleton type="card" />);
      
      const animatedElements = container.querySelectorAll('.animate-pulse');
      expect(animatedElements.length).toBe(6);
    });

    it('should have pulse animation on list skeletons', () => {
      const { container } = render(<LoadingSkeleton type="list" />);
      
      const animatedElements = container.querySelectorAll('.animate-pulse');
      expect(animatedElements.length).toBe(5);
    });

    it('should have pulse animation on table skeleton rows', () => {
      const { container } = render(<LoadingSkeleton type="table" />);
      
      const animatedRows = container.querySelectorAll('.p-4.border-b.last\\:border-b-0.animate-pulse');
      expect(animatedRows.length).toBe(5);
    });

    it('should have pulse animation on table header', () => {
      const { container } = render(<LoadingSkeleton type="table" />);
      
      const header = container.querySelector('.p-4.border-b .animate-pulse');
      expect(header).toBeInTheDocument();
    });
  });

  describe('Width Variations', () => {
    it('should have varied widths in card skeleton', () => {
      const { container } = render(<LoadingSkeleton type="card" />);
      
      const cards = container.querySelectorAll('.rounded-lg.border.bg-card.p-6');
      const firstCard = cards[0];
      
      expect(firstCard.querySelector('.w-3\\/4')).toBeInTheDocument(); // Title
      expect(firstCard.querySelector('.w-1\\/2')).toBeInTheDocument(); // Line 1
      expect(firstCard.querySelector('.w-2\\/3')).toBeInTheDocument(); // Line 2
    });

    it('should have varied widths in list skeleton', () => {
      const { container } = render(<LoadingSkeleton type="list" />);
      
      const items = container.querySelectorAll('.flex.items-center.gap-4');
      const firstItem = items[0];
      
      expect(firstItem.querySelector('.w-1\\/4')).toBeInTheDocument(); // Title
      expect(firstItem.querySelector('.w-1\\/3')).toBeInTheDocument(); // Subtitle
    });
  });

  describe('Content Structure', () => {
    it('should have proper spacing in card layout', () => {
      const { container } = render(<LoadingSkeleton type="card" />);
      
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('gap-4');
    });

    it('should have proper spacing in list layout', () => {
      const { container } = render(<LoadingSkeleton type="list" />);
      
      const list = container.querySelector('.space-y-4');
      expect(list).toBeInTheDocument();
    });

    it('should have proper padding in table cells', () => {
      const { container } = render(<LoadingSkeleton type="table" />);
      
      const rows = container.querySelectorAll('.p-4.border-b');
      expect(rows.length).toBeGreaterThan(0);
      
      rows.forEach((row) => {
        expect(row).toHaveClass('p-4');
      });
    });
  });

  describe('Accessibility', () => {
    it('should render without accessibility violations for card type', () => {
      const { container } = render(<LoadingSkeleton type="card" />);
      expect(container).toBeInTheDocument();
    });

    it('should render without accessibility violations for list type', () => {
      const { container } = render(<LoadingSkeleton type="list" />);
      expect(container).toBeInTheDocument();
    });

    it('should render without accessibility violations for table type', () => {
      const { container } = render(<LoadingSkeleton type="table" />);
      expect(container).toBeInTheDocument();
    });
  });
});
