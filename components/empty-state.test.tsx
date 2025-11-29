import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  describe('Rendering', () => {
    it('should render with required props', () => {
      render(
        <EmptyState
          title="No items found"
          description="There are no items to display"
        />
      );
      
      expect(screen.getByText('No items found')).toBeInTheDocument();
      expect(screen.getByText('There are no items to display')).toBeInTheDocument();
    });

    it('should render default icon when no icon provided', () => {
      render(
        <EmptyState
          title="No items"
          description="Empty state"
        />
      );
      
      expect(screen.getByText('📭')).toBeInTheDocument();
    });

    it('should render custom icon when provided', () => {
      render(
        <EmptyState
          icon="🎉"
          title="Congratulations"
          description="You did it!"
        />
      );
      
      expect(screen.getByText('🎉')).toBeInTheDocument();
      expect(screen.queryByText('📭')).not.toBeInTheDocument();
    });
  });

  describe('Action Button', () => {
    it('should not render action button when not provided', () => {
      render(
        <EmptyState
          title="No items"
          description="Empty state"
        />
      );
      
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should render action button when provided', () => {
      const mockAction = vi.fn();
      
      render(
        <EmptyState
          title="No items"
          description="Empty state"
          action={{
            label: 'Add Item',
            onClick: mockAction,
          }}
        />
      );
      
      const button = screen.getByRole('button', { name: 'Add Item' });
      expect(button).toBeInTheDocument();
    });

    it('should call onClick when action button is clicked', () => {
      const mockAction = vi.fn();
      
      render(
        <EmptyState
          title="No items"
          description="Empty state"
          action={{
            label: 'Add Item',
            onClick: mockAction,
          }}
        />
      );
      
      const button = screen.getByRole('button', { name: 'Add Item' });
      fireEvent.click(button);
      
      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('should call onClick multiple times when clicked multiple times', () => {
      const mockAction = vi.fn();
      
      render(
        <EmptyState
          title="No items"
          description="Empty state"
          action={{
            label: 'Add Item',
            onClick: mockAction,
          }}
        />
      );
      
      const button = screen.getByRole('button', { name: 'Add Item' });
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      
      expect(mockAction).toHaveBeenCalledTimes(3);
    });
  });

  describe('Styling', () => {
    it('should have centered layout classes', () => {
      const { container } = render(
        <EmptyState
          title="No items"
          description="Empty state"
        />
      );
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center');
    });

    it('should have text-center class', () => {
      const { container } = render(
        <EmptyState
          title="No items"
          description="Empty state"
        />
      );
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('text-center');
    });

    it('should style title as heading', () => {
      render(
        <EmptyState
          title="No items"
          description="Empty state"
        />
      );
      
      const title = screen.getByText('No items');
      expect(title.tagName).toBe('H3');
      expect(title).toHaveClass('text-lg', 'font-semibold', 'mb-2');
    });

    it('should style description with muted foreground', () => {
      render(
        <EmptyState
          title="No items"
          description="Empty state"
        />
      );
      
      const description = screen.getByText('Empty state');
      expect(description).toHaveClass('text-muted-foreground', 'mb-6', 'max-w-sm');
    });

    it('should style icon with large text size', () => {
      render(
        <EmptyState
          icon="🎉"
          title="No items"
          description="Empty state"
        />
      );
      
      const icon = screen.getByText('🎉');
      expect(icon).toHaveClass('text-6xl', 'mb-4');
    });

    it('should style action button', () => {
      render(
        <EmptyState
          title="No items"
          description="Empty state"
          action={{
            label: 'Add Item',
            onClick: vi.fn(),
          }}
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('rounded-lg', 'bg-primary', 'px-4', 'py-2');
      expect(button).toHaveClass('text-primary-foreground', 'hover:bg-primary/90', 'transition-colors');
    });
  });

  describe('Content', () => {
    it('should handle long titles', () => {
      const longTitle = 'This is a very long title that might need to wrap to multiple lines';
      
      render(
        <EmptyState
          title={longTitle}
          description="Description"
        />
      );
      
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle long descriptions', () => {
      const longDescription = 'This is a very long description that contains a lot of text and might need to wrap to multiple lines to fit properly on the screen';
      
      render(
        <EmptyState
          title="Title"
          description={longDescription}
        />
      );
      
      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it('should handle special characters in content', () => {
      render(
        <EmptyState
          title="No items found <>&"
          description="Try searching for something else!"
        />
      );
      
      expect(screen.getByText('No items found <>&')).toBeInTheDocument();
      expect(screen.getByText('Try searching for something else!')).toBeInTheDocument();
    });

    it('should handle emoji icons properly', () => {
      const emojis = ['📭', '🎉', '🚀', '💡', '⚠️', '✅'];
      
      emojis.forEach((emoji) => {
        const { unmount } = render(
          <EmptyState
            icon={emoji}
            title="Title"
            description="Description"
          />
        );
        
        expect(screen.getByText(emoji)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(
        <EmptyState
          title="No items"
          description="Empty state"
        />
      );
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('No items');
    });

    it('should have accessible button', () => {
      render(
        <EmptyState
          title="No items"
          description="Empty state"
          action={{
            label: 'Add Item',
            onClick: vi.fn(),
          }}
        />
      );
      
      const button = screen.getByRole('button', { name: 'Add Item' });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Use Cases', () => {
    it('should render empty content list state', () => {
      render(
        <EmptyState
          icon="📝"
          title="No content yet"
          description="Get started by creating your first content entry"
          action={{
            label: 'Create Content',
            onClick: vi.fn(),
          }}
        />
      );
      
      expect(screen.getByText('📝')).toBeInTheDocument();
      expect(screen.getByText('No content yet')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create Content' })).toBeInTheDocument();
    });

    it('should render empty media library state', () => {
      render(
        <EmptyState
          icon="🖼️"
          title="No media files yet"
          description="Upload your first media file"
          action={{
            label: 'Upload File',
            onClick: vi.fn(),
          }}
        />
      );
      
      expect(screen.getByText('🖼️')).toBeInTheDocument();
      expect(screen.getByText('No media files yet')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Upload File' })).toBeInTheDocument();
    });

    it('should render empty users list state', () => {
      render(
        <EmptyState
          icon="👥"
          title="No users yet"
          description="Invite your first team member"
          action={{
            label: 'Invite User',
            onClick: vi.fn(),
          }}
        />
      );
      
      expect(screen.getByText('👥')).toBeInTheDocument();
      expect(screen.getByText('No users yet')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Invite User' })).toBeInTheDocument();
    });

    it('should render search no results state without action', () => {
      render(
        <EmptyState
          icon="🔍"
          title="No results found"
          description="Try adjusting your search terms"
        />
      );
      
      expect(screen.getByText('🔍')).toBeInTheDocument();
      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });
});
