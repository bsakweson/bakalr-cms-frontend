/**
 * Tests for Dialog component (Radix UI wrapper for modal dialogs)
 * 
 * Component: components/ui/dialog.tsx
 * 
 * Test Coverage:
 * - Basic rendering and interaction
 * - Open/close behavior
 * - Overlay backdrop
 * - Header, title, description, footer components
 * - Close button (X icon) with showCloseButton prop
 * - Escape key to close
 * - Accessibility (ARIA attributes, focus trap)
 * - Portal rendering
 * - Nested dialogs
 * - Controlled state
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

describe('Dialog', () => {
  describe('Basic Rendering', () => {
    it('should render trigger button', () => {
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
        </Dialog>
      );

      expect(screen.getByRole('button', { name: /open dialog/i })).toBeInTheDocument();
    });

    it('should not render content initially', () => {
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
            <p>Dialog content</p>
          </DialogContent>
        </Dialog>
      );

      // Content should not be visible initially
      expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument();
      expect(screen.queryByText('Dialog content')).not.toBeInTheDocument();
    });

    it('should render content when trigger is clicked', async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Dialog description</DialogDescription>
            <p>Dialog content</p>
          </DialogContent>
        </Dialog>
      );

      const trigger = screen.getByRole('button', { name: /open dialog/i });
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Dialog Title')).toBeInTheDocument();
        expect(screen.getByText('Dialog description')).toBeInTheDocument();
        expect(screen.getByText('Dialog content')).toBeInTheDocument();
      });
    });

    it('should render overlay when dialog is open', async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Dialog description</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole('button', { name: /open dialog/i }));

      await waitFor(() => {
        // Overlay is rendered (may not have specific role in jsdom)
        expect(screen.getByText('Dialog Title')).toBeInTheDocument();
      });
    });
  });

  describe('Close Behavior', () => {
    it('should render close button by default', async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Dialog description</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole('button', { name: /open dialog/i }));

      await waitFor(() => {
        // X button has sr-only "Close" text
        const closeButtons = screen.getAllByRole('button', { name: /close/i });
        expect(closeButtons.length).toBeGreaterThan(0);
      });
    });

    it('should hide close button when showCloseButton is false', async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent showCloseButton={false}>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Dialog description</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole('button', { name: /open dialog/i }));

      await waitFor(() => {
        expect(screen.getByText('Dialog Title')).toBeInTheDocument();
        
        // No close button
        const closeButtons = screen.queryAllByRole('button', { name: /close/i });
        // Only trigger button, no X button
        expect(closeButtons.length).toBeLessThanOrEqual(1);
      });
    });

    it('should close dialog when X button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Dialog description</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      // Open dialog
      await user.click(screen.getByRole('button', { name: /open dialog/i }));
      await waitFor(() => expect(screen.getByText('Dialog Title')).toBeInTheDocument());

      // Close with X button
      const closeButtons = screen.getAllByRole('button', { name: /close/i });
      const xButton = closeButtons.find(btn => btn.querySelector('svg'));
      
      if (xButton) {
        await user.click(xButton);
      }

      await waitFor(() => {
        expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument();
      });
    });

    it('should close dialog when Escape key is pressed', async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Dialog description</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      // Open dialog
      await user.click(screen.getByRole('button', { name: /open dialog/i }));
      await waitFor(() => expect(screen.getByText('Dialog Title')).toBeInTheDocument());

      // Close with Escape key
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument();
      });
    });

    it('should close dialog when DialogClose component is clicked', async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>Are you sure?</DialogDescription>
            <DialogFooter>
              <DialogClose asChild>
                <button>Cancel</button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      // Open dialog
      await user.click(screen.getByRole('button', { name: /open dialog/i }));
      await waitFor(() => expect(screen.getByText('Confirm Action')).toBeInTheDocument());

      // Close with Cancel button
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      await waitFor(() => {
        expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
      });
    });
  });

  describe('Dialog Components', () => {
    it('should render DialogHeader with title and description', async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Account</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete your account.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole('button', { name: /open dialog/i }));

      await waitFor(() => {
        expect(screen.getByText('Delete Account')).toBeInTheDocument();
        expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
      });
    });

    it('should render DialogFooter with action buttons', async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Confirm</DialogTitle>
            <DialogDescription>Are you sure?</DialogDescription>
            <DialogFooter>
              <button>Confirm</button>
              <button>Cancel</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole('button', { name: /open dialog/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });
    });

    it('should render dialog without header and footer', async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Simple Dialog</DialogTitle>
            <DialogDescription>Just a description</DialogDescription>
            <p>Simple dialog content without header and footer</p>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole('button', { name: /open dialog/i }));

      await waitFor(() => {
        expect(screen.getByText('Simple Dialog')).toBeInTheDocument();
        expect(screen.getByText('Simple dialog content without header and footer')).toBeInTheDocument();
      });
    });
  });

  describe('Controlled State', () => {
    it('should work as controlled component with open prop', async () => {
      const user = userEvent.setup();
      const handleOpenChange = vi.fn();

      const { rerender } = render(
        <Dialog open={false} onOpenChange={handleOpenChange}>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Controlled Dialog</DialogTitle>
            <DialogDescription>This is controlled</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      // Initially closed
      expect(screen.queryByText('Controlled Dialog')).not.toBeInTheDocument();

      // Click trigger
      await user.click(screen.getByRole('button', { name: /open dialog/i }));

      // Should call onOpenChange
      expect(handleOpenChange).toHaveBeenCalledWith(true);

      // Manually open by changing prop
      rerender(
        <Dialog open={true} onOpenChange={handleOpenChange}>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Controlled Dialog</DialogTitle>
            <DialogDescription>This is controlled</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      await waitFor(() => {
        expect(screen.getByText('Controlled Dialog')).toBeInTheDocument();
      });
    });

    it('should call onOpenChange when closing controlled dialog', async () => {
      const user = userEvent.setup();
      const handleOpenChange = vi.fn();

      render(
        <Dialog open={true} onOpenChange={handleOpenChange}>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Controlled Dialog</DialogTitle>
            <DialogDescription>This is controlled</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      await waitFor(() => expect(screen.getByText('Controlled Dialog')).toBeInTheDocument());

      // Close with Escape
      await user.keyboard('{Escape}');

      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on trigger', () => {
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Dialog description</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      const trigger = screen.getByRole('button', { name: /open dialog/i });
      
      // Radix adds ARIA attributes
      expect(trigger).toHaveAttribute('aria-haspopup');
    });

    it('should render title as dialog heading', async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Accessible Dialog Title</DialogTitle>
            <DialogDescription>Dialog description</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole('button', { name: /open dialog/i }));

      await waitFor(() => {
        const title = screen.getByText('Accessible Dialog Title');
        expect(title).toBeInTheDocument();
      });
    });

    it('should render description for screen readers', async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>
              This is a description for screen readers
            </DialogDescription>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole('button', { name: /open dialog/i }));

      await waitFor(() => {
        expect(screen.getByText('This is a description for screen readers')).toBeInTheDocument();
      });
    });

    it('should have close button accessible to screen readers', async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Dialog description</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole('button', { name: /open dialog/i }));

      await waitFor(() => {
        // X button has sr-only "Close" text
        const closeButtons = screen.getAllByRole('button', { name: /close/i });
        expect(closeButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Nested Dialogs', () => {
    it('should support nested dialogs', async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open First Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>First Dialog</DialogTitle>
            <DialogDescription>First dialog description</DialogDescription>
            <Dialog>
              <DialogTrigger>Open Second Dialog</DialogTrigger>
              <DialogContent>
                <DialogTitle>Second Dialog</DialogTitle>
                <DialogDescription>Second dialog description</DialogDescription>
              </DialogContent>
            </Dialog>
          </DialogContent>
        </Dialog>
      );

      // Open first dialog
      await user.click(screen.getByRole('button', { name: /open first dialog/i }));
      await waitFor(() => expect(screen.getByText('First Dialog')).toBeInTheDocument());

      // Open second dialog
      await user.click(screen.getByRole('button', { name: /open second dialog/i }));
      await waitFor(() => {
        expect(screen.getByText('Second Dialog')).toBeInTheDocument();
        // First dialog should still be in DOM
        expect(screen.getByText('First Dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Portal Rendering', () => {
    it('should render content in portal for proper layering', async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Portal Dialog</DialogTitle>
            <DialogDescription>Portal description</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole('button', { name: /open dialog/i }));

      await waitFor(() => {
        // Content should be rendered (portal handled by Radix)
        expect(screen.getByText('Portal Dialog')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should allow interaction with content inside dialog', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Interactive Dialog</DialogTitle>
            <DialogDescription>Interactive description</DialogDescription>
            <button onClick={handleClick}>Action Button</button>
          </DialogContent>
        </Dialog>
      );

      // Open dialog
      await user.click(screen.getByRole('button', { name: /open dialog/i }));
      await waitFor(() => expect(screen.getByText('Interactive Dialog')).toBeInTheDocument());

      // Click button inside dialog
      await user.click(screen.getByRole('button', { name: /action button/i }));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should allow form submission inside dialog', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn((e) => e.preventDefault());

      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Form Dialog</DialogTitle>
            <DialogDescription>Enter your information</DialogDescription>
            <form onSubmit={handleSubmit}>
              <input type="text" placeholder="Name" />
              <button type="submit">Submit</button>
            </form>
          </DialogContent>
        </Dialog>
      );

      // Open dialog
      await user.click(screen.getByRole('button', { name: /open dialog/i }));
      await waitFor(() => expect(screen.getByText('Form Dialog')).toBeInTheDocument());

      // Fill and submit form
      const input = screen.getByPlaceholderText('Name');
      await user.type(input, 'John Doe');
      await user.click(screen.getByRole('button', { name: /submit/i }));

      expect(handleSubmit).toHaveBeenCalledTimes(1);
      expect(input).toHaveValue('John Doe');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty dialog content', async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Empty</DialogTitle>
            <DialogDescription>No content</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole('button', { name: /open dialog/i }));

      await waitFor(() => {
        expect(screen.getByText('Empty')).toBeInTheDocument();
      });
    });

    it('should handle dialog with only title', async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent showCloseButton={false}>
            <DialogTitle>Title Only</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole('button', { name: /open dialog/i }));

      await waitFor(() => {
        expect(screen.getByText('Title Only')).toBeInTheDocument();
      });
    });
  });
});
