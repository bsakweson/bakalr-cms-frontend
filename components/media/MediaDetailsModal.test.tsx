import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MediaDetailsModal } from './MediaDetailsModal';
import { mediaApi } from '@/lib/api';
import { toast } from 'sonner';

// Mock the API
vi.mock('@/lib/api', () => ({
  mediaApi: {
    updateMedia: vi.fn(),
    deleteMedia: vi.fn(),
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('MediaDetailsModal', () => {
  const mockOnClose = vi.fn();
  const mockOnUpdate = vi.fn();
  const mockOnDelete = vi.fn();

  const mockImageMedia = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    filename: 'test-image.jpg',
    original_filename: 'test-image.jpg',
    file_path: 'uploads/images/test-image.jpg',
    url: 'http://example.com/test-image.jpg',
    file_type: 'image/jpeg',
    file_size: 1024000,
    mime_type: 'image/jpeg',
    media_type: 'image' as const,
    storage_path: 'uploads/images/test-image.jpg',
    public_url: 'http://example.com/test-image.jpg',
    thumbnail_url: 'http://example.com/test-image-thumb.jpg',
    alt_text: 'Test image description',
    uploaded_by_id: '550e8400-e29b-41d4-a716-446655440001',
    organization_id: '550e8400-e29b-41d4-a716-446655440001',
    created_at: '2025-01-15T10:30:00Z',
    updated_at: '2025-01-15T10:30:00Z',
  };

  const mockVideoMedia = {
    id: '550e8400-e29b-41d4-a716-446655440002',
    filename: 'test-video.mp4',
    original_filename: 'test-video.mp4',
    file_path: 'uploads/videos/test-video.mp4',
    url: 'http://example.com/test-video.mp4',
    file_type: 'video/mp4',
    file_size: 5120000,
    mime_type: 'video/mp4',
    media_type: 'video' as const,
    storage_path: 'uploads/videos/test-video.mp4',
    public_url: 'http://example.com/test-video.mp4',
    uploaded_by_id: '550e8400-e29b-41d4-a716-446655440001',
    organization_id: '550e8400-e29b-41d4-a716-446655440001',
    created_at: '2025-01-20T14:45:00Z',
    updated_at: '2025-01-20T14:45:00Z',
  };

  const mockDocumentMedia = {
    id: '550e8400-e29b-41d4-a716-446655440003',
    filename: 'document.pdf',
    original_filename: 'document.pdf',
    file_path: 'uploads/documents/document.pdf',
    url: 'http://example.com/document.pdf',
    file_type: 'application/pdf',
    file_size: 512000,
    mime_type: 'application/pdf',
    media_type: 'document' as const,
    storage_path: 'uploads/documents/document.pdf',
    public_url: 'http://example.com/document.pdf',
    uploaded_by_id: '550e8400-e29b-41d4-a716-446655440001',
    organization_id: '550e8400-e29b-41d4-a716-446655440001',
    created_at: '2025-02-01T09:15:00Z',
    updated_at: '2025-02-01T09:15:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should not render when media is null', () => {
      const { container } = render(
        <MediaDetailsModal
          media={null}
          open={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render dialog when open is true and media exists', () => {
      render(
        <MediaDetailsModal
          media={mockImageMedia}
          open={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Media Details')).toBeInTheDocument();
      expect(screen.getByText('View and edit media file information')).toBeInTheDocument();
    });

    it('should not render dialog when open is false', () => {
      render(
        <MediaDetailsModal
          media={mockImageMedia}
          open={false}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.queryByText('Media Details')).not.toBeInTheDocument();
    });
  });

  describe('Media Display', () => {
    it('should display image preview when cdn_url exists', () => {
      const mediaWithCdn = { ...mockImageMedia, cdn_url: 'http://cdn.example.com/test-image.jpg' };
      render(
        <MediaDetailsModal
          media={mediaWithCdn}
          open={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const img = screen.getByAltText('Test image description');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'http://cdn.example.com/test-image.jpg');
    });

    it('should fallback to url when cdn_url is missing', () => {
      const mediaWithoutCdn = { ...mockImageMedia, cdn_url: undefined };
      render(
        <MediaDetailsModal
          media={mediaWithoutCdn}
          open={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const img = screen.getByAltText('Test image description');
      expect(img).toHaveAttribute('src', 'http://example.com/test-image.jpg');
    });

    it('should display video icon for video files without preview', () => {
      const videoWithoutUrl = { ...mockVideoMedia, url: undefined, cdn_url: undefined };
      render(
        <MediaDetailsModal
          media={videoWithoutUrl}
          open={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('🎥')).toBeInTheDocument();
    });

    it('should display document icon for document files', () => {
      const docWithoutUrl = { ...mockDocumentMedia, url: undefined, cdn_url: undefined };
      render(
        <MediaDetailsModal
          media={docWithoutUrl}
          open={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('📄')).toBeInTheDocument();
    });

    it('should display filename', () => {
      render(
        <MediaDetailsModal
          media={mockImageMedia}
          open={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('test-image.jpg')).toBeInTheDocument();
    });

    it('should display mime type as badge', () => {
      render(
        <MediaDetailsModal
          media={mockImageMedia}
          open={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('image/jpeg')).toBeInTheDocument();
    });

    it('should display formatted file size in KB', () => {
      render(
        <MediaDetailsModal
          media={mockImageMedia}
          open={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('1000.0 KB')).toBeInTheDocument();
    });

    it('should display formatted file size in MB', () => {
      render(
        <MediaDetailsModal
          media={mockVideoMedia}
          open={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('4.9 MB')).toBeInTheDocument();
    });

    it('should display alt text when present', () => {
      render(
        <MediaDetailsModal
          media={mockImageMedia}
          open={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Test image description')).toBeInTheDocument();
    });

    it('should display "No alt text" when alt text is missing', () => {
      render(
        <MediaDetailsModal
          media={mockVideoMedia}
          open={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('No alt text')).toBeInTheDocument();
    });

    it('should display formatted upload date', () => {
      render(
        <MediaDetailsModal
          media={mockImageMedia}
          open={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      // Date formatting may vary by locale, so just check it exists
      expect(screen.getByText(/Jan 15, 2025/)).toBeInTheDocument();
    });

    it('should display public URL when present', () => {
      render(
        <MediaDetailsModal
          media={mockImageMedia}
          open={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('http://example.com/test-image.jpg')).toBeInTheDocument();
    });

    it('should not display URL section when public_url is missing', () => {
      const mediaWithoutUrl = { ...mockImageMedia, public_url: undefined };
      render(
        <MediaDetailsModal
          media={mediaWithoutUrl}
          open={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.queryByText(/http:\/\//)).not.toBeInTheDocument();
    });
  });

  describe('Dialog Actions', () => {
    it('should render Close, Edit, and Delete buttons in view mode', () => {
      render(
        <MediaDetailsModal
          media={mockImageMedia}
          open={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      // Dialog has two "Close" buttons: main button and X button
      const closeButtons = screen.getAllByRole('button', { name: /close/i });
      expect(closeButtons.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByRole('button', { name: /^edit$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument();
    });

    it('should call onClose when Close button clicked', async () => {
      const user = userEvent.setup();
      render(
        <MediaDetailsModal
          media={mockImageMedia}
          open={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      // Get the main Close button (not the X button)
      const closeButtons = screen.getAllByRole('button', { name: /close/i });
      const mainCloseButton = closeButtons.find(btn => btn.textContent === 'Close');
      await user.click(mainCloseButton!);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edit Mode', () => {
    it('should enter edit mode when Edit button clicked', async () => {
      const user = userEvent.setup();
      render(
        <MediaDetailsModal
          media={mockImageMedia}
          open={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole('button', { name: /^edit$/i });
      await user.click(editButton);

      // Should show Save and Cancel buttons
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();

      // Should not show Edit and Delete buttons in edit mode
      expect(screen.queryByRole('button', { name: /^edit$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^delete$/i })).not.toBeInTheDocument();
      // X button (Close) is still present in the dialog
    });

    it('should show filename input in edit mode', async () => {
      const user = userEvent.setup();
      render(
        <MediaDetailsModal
          media={mockImageMedia}
          open={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole('button', { name: /^edit$/i });
      await user.click(editButton);

      const filenameInput = screen.getByLabelText(/filename/i);
      expect(filenameInput).toBeInTheDocument();
      expect(filenameInput).toHaveValue('test-image.jpg');
    });

    it('should show alt text textarea in edit mode', async () => {
      const user = userEvent.setup();
      render(
        <MediaDetailsModal
          media={mockImageMedia}
          open={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole('button', { name: /^edit$/i });
      await user.click(editButton);

      const altTextInput = screen.getByLabelText(/alt text/i);
      expect(altTextInput).toBeInTheDocument();
      expect(altTextInput).toHaveValue('Test image description');
    });

    it('should allow editing filename', async () => {
      const user = userEvent.setup();
      render(
        <MediaDetailsModal
          media={mockImageMedia}
          open={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole('button', { name: /^edit$/i });
      await user.click(editButton);

      const filenameInput = screen.getByLabelText(/filename/i) as HTMLInputElement;
      await user.clear(filenameInput);
      await user.type(filenameInput, 'updated-image.jpg');

      expect(filenameInput).toHaveValue('updated-image.jpg');
    });

    it('should allow editing alt text', async () => {
      const user = userEvent.setup();
      render(
        <MediaDetailsModal
          media={mockImageMedia}
          open={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole('button', { name: /^edit$/i });
      await user.click(editButton);

      const altTextInput = screen.getByLabelText(/alt text/i) as HTMLTextAreaElement;
      await user.clear(altTextInput);
      await user.type(altTextInput, 'Updated description');

      expect(altTextInput).toHaveValue('Updated description');
    });

    it('should exit edit mode when Cancel clicked', async () => {
      const user = userEvent.setup();
      render(
        <MediaDetailsModal
          media={mockImageMedia}
          open={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole('button', { name: /^edit$/i });
      await user.click(editButton);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Should return to view mode
      expect(screen.getByRole('button', { name: /^edit$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument();
      // Verify we're back in view mode
    });

    it('should not save changes when Cancel clicked', async () => {
      const user = userEvent.setup();
      render(
        <MediaDetailsModal
          media={mockImageMedia}
          open={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole('button', { name: /^edit$/i });
      await user.click(editButton);

      const filenameInput = screen.getByLabelText(/filename/i) as HTMLInputElement;
      await user.clear(filenameInput);
      await user.type(filenameInput, 'changed.jpg');

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mediaApi.updateMedia).not.toHaveBeenCalled();
      // Original filename should still be displayed
      expect(screen.getByText('test-image.jpg')).toBeInTheDocument();
    });
  });

  describe('Save Functionality', () => {
    it('should call updateMedia API when Save clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(mediaApi.updateMedia).mockResolvedValue(mockImageMedia);

      render(
        <MediaDetailsModal
          media={mockImageMedia}
          open={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole('button', { name: /^edit$/i });
      await user.click(editButton);

      const filenameInput = screen.getByLabelText(/filename/i) as HTMLInputElement;
      await user.clear(filenameInput);
      await user.type(filenameInput, 'updated.jpg');

      const saveButton = screen.getByRole('button', { name: /^save$/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mediaApi.updateMedia).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440001', {
          alt_text: 'Test image description',
          filename: 'updated.jpg',
        });
      });
    });

    it('should call onUpdate after successful save', async () => {
      const user = userEvent.setup();
      vi.mocked(mediaApi.updateMedia).mockResolvedValue(mockImageMedia);

      render(
        <MediaDetailsModal
          media={mockImageMedia}
          open={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole('button', { name: /^edit$/i });
      await user.click(editButton);

      const saveButton = screen.getByRole('button', { name: /^save$/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledTimes(1);
      });
    });

    it('should exit edit mode after successful save', async () => {
      const user = userEvent.setup();
      vi.mocked(mediaApi.updateMedia).mockResolvedValue(mockImageMedia);

      render(
        <MediaDetailsModal
          media={mockImageMedia}
          open={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole('button', { name: /^edit$/i });
      await user.click(editButton);

      const saveButton = screen.getByRole('button', { name: /^save$/i });
      await user.click(saveButton);

      await waitFor(() => {
        // Back in view mode - check for Edit button
        expect(screen.getByRole('button', { name: /^edit$/i })).toBeInTheDocument();
      });
    });

    it('should disable Save button while saving', async () => {
      const user = userEvent.setup();
      let resolveSave: (value: any) => void;
      const savePromise = new Promise((resolve) => {
        resolveSave = resolve;
      });
      vi.mocked(mediaApi.updateMedia).mockReturnValue(savePromise as any);

      render(
        <MediaDetailsModal
          media={mockImageMedia}
          open={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole('button', { name: /^edit$/i });
      await user.click(editButton);

      const saveButton = screen.getByRole('button', { name: /^save$/i });
      await user.click(saveButton);

      // Button should be disabled and show "Saving..."
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
      });

      resolveSave!(mockImageMedia);
    });

    it('should show alert on save error', async () => {
      const user = userEvent.setup();
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(mediaApi.updateMedia).mockRejectedValue(new Error('Save failed'));

      render(
        <MediaDetailsModal
          media={mockImageMedia}
          open={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole('button', { name: /^edit$/i });
      await user.click(editButton);

      const saveButton = screen.getByRole('button', { name: /^save$/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to update media');
        expect(consoleError).toHaveBeenCalledWith('Failed to update media:', expect.any(Error));
      });

      consoleError.mockRestore();
    });

    it('should remain in edit mode after save error', async () => {
      const user = userEvent.setup();
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(mediaApi.updateMedia).mockRejectedValue(new Error('Save failed'));

      render(
        <MediaDetailsModal
          media={mockImageMedia}
          open={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole('button', { name: /^edit$/i });
      await user.click(editButton);

      const saveButton = screen.getByRole('button', { name: /^save$/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });

      // Should still be in edit mode
      expect(screen.getByRole('button', { name: /^save$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();

      consoleError.mockRestore();
    });
  });

  describe('Delete Functionality', () => {
    it('should show delete confirmation dialog when Delete clicked', async () => {
      const user = userEvent.setup();
      render(
        <MediaDetailsModal
          media={mockImageMedia}
          open={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /^delete$/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
        expect(screen.getByText(/are you sure you want to delete this file/i)).toBeInTheDocument();
      });
    });

    it('should show Cancel and Delete buttons in confirmation dialog', async () => {
      const user = userEvent.setup();
      render(
        <MediaDetailsModal
          media={mockImageMedia}
          open={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /^delete$/i });
      await user.click(deleteButton);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button', { name: /cancel/i });
        expect(buttons.length).toBeGreaterThan(0);
        const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
        expect(deleteButtons.length).toBeGreaterThan(0);
      });
    });

    it('should close confirmation dialog when Cancel clicked', async () => {
      const user = userEvent.setup();
      render(
        <MediaDetailsModal
          media={mockImageMedia}
          open={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /^delete$/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
      });

      const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
      // Click the cancel button in the confirmation dialog (last one)
      await user.click(cancelButtons[cancelButtons.length - 1]);

      await waitFor(() => {
        expect(screen.queryByText('Confirm Delete')).not.toBeInTheDocument();
      });

      // Should not call delete API
      expect(mediaApi.deleteMedia).not.toHaveBeenCalled();
    });

    it('should call deleteMedia API when confirmed', async () => {
      const user = userEvent.setup();
      vi.mocked(mediaApi.deleteMedia).mockResolvedValue(undefined);

      render(
        <MediaDetailsModal
          media={mockImageMedia}
          open={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /^delete$/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      // Click the delete button in confirmation dialog (last one)
      await user.click(deleteButtons[deleteButtons.length - 1]);

      await waitFor(() => {
        expect(mediaApi.deleteMedia).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440001');
      });
    });

    it('should call onClose and onDelete after successful deletion', async () => {
      const user = userEvent.setup();
      vi.mocked(mediaApi.deleteMedia).mockResolvedValue(undefined);

      render(
        <MediaDetailsModal
          media={mockImageMedia}
          open={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /^delete$/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[deleteButtons.length - 1]);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
        expect(mockOnDelete).toHaveBeenCalledTimes(1);
      });
    });

    it('should disable Delete button while deleting', async () => {
      const user = userEvent.setup();
      let resolveDelete: (value: any) => void;
      const deletePromise = new Promise((resolve) => {
        resolveDelete = resolve;
      });
      vi.mocked(mediaApi.deleteMedia).mockReturnValue(deletePromise as any);

      render(
        <MediaDetailsModal
          media={mockImageMedia}
          open={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /^delete$/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[deleteButtons.length - 1]);

      // Button should be disabled and show "Deleting..."
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /deleting/i })).toBeDisabled();
      });

      resolveDelete!(undefined);
    });

    it('should show alert on delete error', async () => {
      const user = userEvent.setup();
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(mediaApi.deleteMedia).mockRejectedValue(new Error('Delete failed'));

      render(
        <MediaDetailsModal
          media={mockImageMedia}
          open={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /^delete$/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[deleteButtons.length - 1]);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to delete media');
        expect(consoleError).toHaveBeenCalledWith('Failed to delete media:', expect.any(Error));
      });

      consoleError.mockRestore();
    });

    it('should not close modal on delete error', async () => {
      const user = userEvent.setup();
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(mediaApi.deleteMedia).mockRejectedValue(new Error('Delete failed'));

      render(
        <MediaDetailsModal
          media={mockImageMedia}
          open={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /^delete$/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[deleteButtons.length - 1]);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });

      // Modal should still be open
      expect(screen.getByText('Media Details')).toBeInTheDocument();
      expect(mockOnClose).not.toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });
});
