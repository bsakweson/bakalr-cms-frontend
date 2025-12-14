import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MediaPickerModal from './media-picker-modal';
import { mediaApi } from '@/lib/api/media';
import { Media } from '@/types';

// Mock the media API
vi.mock('@/lib/api/media', () => ({
  mediaApi: {
    getMedia: vi.fn(),
    uploadMedia: vi.fn(),
  },
}));

// Mock Lucide icons
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Search: () => <div data-testid="search-icon" />,
    Upload: () => <div data-testid="upload-icon" />,
    Check: () => <div data-testid="check-icon" />,
  };
});

// Mock Radix UI Select to avoid hasPointerCapture errors
vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange }: any) => (
    <div data-testid="select-wrapper">
      <button
        data-testid="select-trigger"
        onClick={() => {
          const newValue = value === 'all' ? 'image' : value === 'image' ? 'video' : 'all';
          onValueChange?.(newValue);
        }}
      >
        {value === 'all' && 'All Files'}
        {value === 'image' && 'Images'}
        {value === 'video' && 'Videos'}
        {value === 'audio' && 'Audio'}
        {value === 'document' && 'Documents'}
      </button>
    </div>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: () => null,
  SelectItem: () => null,
}));

const mockMedia: Media[] = [
  {
    id: '1',
    filename: 'image1.jpg',
    original_filename: 'image1.jpg',
    file_type: 'image',
    file_size: 1024000,
    mime_type: 'image/jpeg',
    storage_path: '/uploads/image1.jpg',
    public_url: 'http://example.com/image1.jpg',
    alt_text: 'Test image 1',
    organization_id: '1',
    uploaded_by_id: '1',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    filename: 'document.pdf',
    original_filename: 'document.pdf',
    file_type: 'document',
    file_size: 512000,
    mime_type: 'application/pdf',
    storage_path: '/uploads/document.pdf',
    public_url: 'http://example.com/document.pdf',
    organization_id: '1',
    uploaded_by_id: '1',
    created_at: '2025-01-02T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
  },
  {
    id: '3',
    filename: 'video.mp4',
    original_filename: 'video.mp4',
    file_type: 'video',
    file_size: 5120000,
    mime_type: 'video/mp4',
    storage_path: '/uploads/video.mp4',
    public_url: 'http://example.com/video.mp4',
    alt_text: 'Test video',
    organization_id: '1',
    uploaded_by_id: '1',
    created_at: '2025-01-03T00:00:00Z',
    updated_at: '2025-01-03T00:00:00Z',
  },
];

describe('MediaPickerModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mediaApi.getMedia).mockResolvedValue({
      items: mockMedia,
      total: mockMedia.length,
      page: 1,
      page_size: 12,
      pages: 1,
    });
  });

  describe('Initial Rendering', () => {
    it('should not render when open is false', () => {
      render(
        <MediaPickerModal
          open={false}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.queryByText('Select Media')).not.toBeInTheDocument();
    });

    it('should render dialog when open is true', () => {
      render(
        <MediaPickerModal
          open={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText('Select Media')).toBeInTheDocument();
      expect(
        screen.getByText('Choose a file from your media library or upload a new one')
      ).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      render(
        <MediaPickerModal
          open={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText('Loading media...')).toBeInTheDocument();
    });

    it('should load media on open', async () => {
      render(
        <MediaPickerModal
          open={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
        />
      );

      await waitFor(() => {
        expect(mediaApi.getMedia).toHaveBeenCalledWith({
          page: 1,
          page_size: 12,
        });
      });
    });
  });

  describe('Media Display', () => {
    it('should display all media items after loading', async () => {
      render(
        <MediaPickerModal
          open={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('image1.jpg')).toBeInTheDocument();
        expect(screen.getByText('document.pdf')).toBeInTheDocument();
        expect(screen.getByText('video.mp4')).toBeInTheDocument();
      });
    });

    it('should display images with img tag', async () => {
      render(
        <MediaPickerModal
          open={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
        />
      );

      await waitFor(() => {
        const img = screen.getByAltText('Test image 1');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', 'http://example.com/image1.jpg');
      });
    });

    it('should display non-images with type label', async () => {
      render(
        <MediaPickerModal
          open={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('document')).toBeInTheDocument();
        expect(screen.getByText('video')).toBeInTheDocument();
      });
    });

    it('should display file sizes correctly', async () => {
      render(
        <MediaPickerModal
          open={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('1000.0 KB')).toBeInTheDocument(); // 1024000 bytes
        expect(screen.getByText('500.0 KB')).toBeInTheDocument(); // 512000 bytes
        expect(screen.getByText('4.9 MB')).toBeInTheDocument(); // 5120000 bytes
      });
    });

    it('should show empty state when no media found', async () => {
      vi.mocked(mediaApi.getMedia).mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        page_size: 12,
        pages: 0,
      });

      render(
        <MediaPickerModal
          open={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText('No media files found. Upload one to get started.')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Media Selection', () => {
    it('should highlight selected media', async () => {
      const user = userEvent.setup();
      render(
        <MediaPickerModal
          open={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('image1.jpg')).toBeInTheDocument();
      });

      // Find the card container (the div with cursor-pointer class)
      const mediaItem = screen.getByText('image1.jpg').closest('.cursor-pointer');
      await user.click(mediaItem!);

      await waitFor(() => {
        expect(mediaItem).toHaveClass('ring-2');
        expect(screen.getByTestId('check-icon')).toBeInTheDocument();
      });
    });

    it('should enable select button when media is selected', async () => {
      const user = userEvent.setup();
      render(
        <MediaPickerModal
          open={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('image1.jpg')).toBeInTheDocument();
      });

      const selectButton = screen.getByRole('button', { name: /select$/i });
      expect(selectButton).toBeDisabled();

      const mediaItem = screen.getByText('image1.jpg').closest('div');
      await user.click(mediaItem!);

      await waitFor(() => {
        expect(selectButton).not.toBeDisabled();
      });
    });

    it('should call onSelect and onClose when select button clicked', async () => {
      const user = userEvent.setup();
      render(
        <MediaPickerModal
          open={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('image1.jpg')).toBeInTheDocument();
      });

      const mediaItem = screen.getByText('image1.jpg').closest('div');
      await user.click(mediaItem!);

      const selectButton = screen.getByRole('button', { name: /select$/i });
      await user.click(selectButton);

      expect(mockOnSelect).toHaveBeenCalledWith(mockMedia[0]);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should switch selection when clicking different media', async () => {
      const user = userEvent.setup();
      render(
        <MediaPickerModal
          open={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('image1.jpg')).toBeInTheDocument();
      });

      const firstItem = screen.getByText('image1.jpg').closest('.cursor-pointer');
      await user.click(firstItem!);

      await waitFor(() => {
        expect(firstItem).toHaveClass('ring-2');
      });

      const secondItem = screen.getByText('document.pdf').closest('.cursor-pointer');
      await user.click(secondItem!);

      await waitFor(() => {
        expect(secondItem).toHaveClass('ring-2');
        expect(firstItem).not.toHaveClass('ring-2');
      });
    });
  });

  describe('Search Functionality', () => {
    it('should render search input', () => {
      render(
        <MediaPickerModal
          open={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByPlaceholderText('Search media...')).toBeInTheDocument();
    });

    it('should update search value on input', async () => {
      const user = userEvent.setup();
      render(
        <MediaPickerModal
          open={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search media...');
      await user.type(searchInput, 'image');

      expect(searchInput).toHaveValue('image');
    });

    it('should call API with search params', async () => {
      const user = userEvent.setup();
      render(
        <MediaPickerModal
          open={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
        />
      );

      await waitFor(() => {
        expect(mediaApi.getMedia).toHaveBeenCalled();
      });

      vi.clearAllMocks();

      const searchInput = screen.getByPlaceholderText('Search media...');
      await user.type(searchInput, 'test');

      await waitFor(() => {
        expect(mediaApi.getMedia).toHaveBeenCalledWith({
          page: 1,
          page_size: 12,
          search: 'test',
        });
      });
    });

    it('should reset page to 1 when searching', async () => {
      const user = userEvent.setup();
      render(
        <MediaPickerModal
          open={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
        />
      );

      await waitFor(() => {
        expect(mediaApi.getMedia).toHaveBeenCalled();
      });

      const searchInput = screen.getByPlaceholderText('Search media...');
      await user.type(searchInput, 'test');

      await waitFor(() => {
        const calls = vi.mocked(mediaApi.getMedia).mock.calls;
        const lastCall = calls[calls.length - 1]?.[0];
        expect(lastCall?.page).toBe(1);
      });
    });
  });

  describe('Filter Functionality', () => {
    it('should render filter select with default "All Files"', async () => {
      render(
        <MediaPickerModal
          open={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('All Files')).toBeInTheDocument();
      });
    });

    it('should filter by file type', async () => {
      const user = userEvent.setup();
      render(
        <MediaPickerModal
          open={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
        />
      );

      await waitFor(() => {
        expect(mediaApi.getMedia).toHaveBeenCalled();
      });

      vi.clearAllMocks();

      // Click the mocked select trigger to cycle filter value (all -> image)
      const selectTrigger = screen.getByTestId('select-trigger');
      await user.click(selectTrigger);

      await waitFor(() => {
        expect(mediaApi.getMedia).toHaveBeenCalledWith({
          page: 1,
          page_size: 12,
          file_type: 'image',
        });
      });
    });

    it('should reset page to 1 when changing filter', async () => {
      const user = userEvent.setup();
      render(
        <MediaPickerModal
          open={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
        />
      );

      await waitFor(() => {
        expect(mediaApi.getMedia).toHaveBeenCalled();
      });

      // Click the mocked select trigger to cycle filter value (all -> image)
      const selectTrigger = screen.getByTestId('select-trigger');
      await user.click(selectTrigger);

      await waitFor(() => {
        const calls = vi.mocked(mediaApi.getMedia).mock.calls;
        const lastCall = calls[calls.length - 1]?.[0];
        expect(lastCall?.page).toBe(1);
      });
    });

    it('should use fileType prop as initial filter', () => {
      render(
        <MediaPickerModal
          open={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          fileType="image"
        />
      );

      waitFor(() => {
        expect(mediaApi.getMedia).toHaveBeenCalledWith({
          page: 1,
          page_size: 12,
          file_type: 'image',
        });
      });
    });
  });

  describe('File Upload', () => {
    it('should render upload button', async () => {
      render(
        <MediaPickerModal
          open={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Upload')).toBeInTheDocument();
      });
    });

    it('should have hidden file input', async () => {
      render(
        <MediaPickerModal
          open={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
        />
      );

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(screen.getByText('image1.jpg')).toBeInTheDocument();
      });

      // Find the file input by traversing from the Upload button
      const uploadButton = screen.getByText('Upload');
      const label = uploadButton.parentElement?.parentElement;
      const fileInput = label?.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveClass('hidden');
      expect(fileInput).not.toBeDisabled();
    });

    it('should upload file and add to media list', async () => {
      const newMedia: Media = {
        id: '4',
        filename: 'new-image.jpg',
        original_filename: 'new-image.jpg',
        file_type: 'image',
        file_size: 2048000,
        mime_type: 'image/jpeg',
        storage_path: '/uploads/new-image.jpg',
        public_url: 'http://example.com/new-image.jpg',
        organization_id: '1',
        uploaded_by_id: '1',
        created_at: '2025-01-04T00:00:00Z',
        updated_at: '2025-01-04T00:00:00Z',
      };

      vi.mocked(mediaApi.uploadMedia).mockResolvedValue(newMedia);

      const { container } = render(
        <MediaPickerModal
          open={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
        />
      );

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(screen.getByText('image1.jpg')).toBeInTheDocument();
      });

      // Find the file input by traversing from the Upload button
      const uploadButton = screen.getByText('Upload');
      const label = uploadButton.closest('label');
      const fileInput = label?.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).not.toBeNull();
      expect(fileInput).not.toBeDisabled();
      
      const file = new File(['content'], 'new-image.jpg', { type: 'image/jpeg' });

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(mediaApi.uploadMedia).toHaveBeenCalled();
        expect(screen.getByText('new-image.jpg')).toBeInTheDocument();
      });
    });

    it('should auto-select uploaded media', async () => {
      const newMedia: Media = {
        id: '4',
        filename: 'new-image.jpg',
        original_filename: 'new-image.jpg',
        file_type: 'image',
        file_size: 2048000,
        mime_type: 'image/jpeg',
        storage_path: '/uploads/new-image.jpg',
        public_url: 'http://example.com/new-image.jpg',
        organization_id: '1',
        uploaded_by_id: '1',
        created_at: '2025-01-04T00:00:00Z',
        updated_at: '2025-01-04T00:00:00Z',
      };

      vi.mocked(mediaApi.uploadMedia).mockResolvedValue(newMedia);

      render(
        <MediaPickerModal
          open={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
        />
      );

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(screen.getByText('image1.jpg')).toBeInTheDocument();
      });

      // Find the file input by traversing from the Upload button
      const uploadButton = screen.getByText('Upload');
      const label = uploadButton.closest('label');
      const fileInput = label?.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).not.toBeNull();
      expect(fileInput).not.toBeDisabled();
      
      const file = new File(['content'], 'new-image.jpg', { type: 'image/jpeg' });

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        const selectButton = screen.getByRole('button', { name: /select$/i });
        expect(selectButton).not.toBeDisabled();
      });
    });

    it('should disable upload button while loading', async () => {
      // Mock a slow API call to catch the loading state
      vi.mocked(mediaApi.getMedia).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          items: mockMedia,
          total: 3,
          page: 1,
          page_size: 12,
          pages: 1,
        }), 100))
      );

      render(
        <MediaPickerModal
          open={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
        />
      );

      // Immediately check - should be loading and disabled
      const uploadButton = screen.getByText('Upload');
      const label = uploadButton.closest('label');
      const fileInput = label?.querySelector('input[type="file"]');
      expect(fileInput).toBeDisabled();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText('image1.jpg')).toBeInTheDocument();
      });

      // After loading - file input should be enabled
      expect(fileInput).not.toBeDisabled();
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      vi.mocked(mediaApi.getMedia).mockResolvedValue({
        items: mockMedia,
        total: 25,
        page: 1,
        page_size: 12,
        pages: 3,
      });
    });

    it('should show pagination when multiple pages exist', async () => {
      render(
        <MediaPickerModal
          open={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      });
    });

    it('should have previous button disabled on first page', async () => {
      render(
        <MediaPickerModal
          open={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
        />
      );

      await waitFor(() => {
        const prevButton = screen.getByRole('button', { name: /previous/i });
        expect(prevButton).toBeDisabled();
      });
    });

    it('should enable next button when more pages exist', async () => {
      render(
        <MediaPickerModal
          open={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
        />
      );

      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /next/i });
        expect(nextButton).not.toBeDisabled();
      });
    });

    it('should load next page when next button clicked', async () => {
      const user = userEvent.setup();
      render(
        <MediaPickerModal
          open={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      });

      vi.clearAllMocks();

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(mediaApi.getMedia).toHaveBeenCalledWith({
          page: 2,
          page_size: 12,
        });
      });
    });

    it('should load previous page when previous button clicked', async () => {
      const user = userEvent.setup();
      
      // Initially return page 1
      vi.mocked(mediaApi.getMedia).mockResolvedValue({
        items: mockMedia,
        total: 25,
        page: 1,
        page_size: 12,
        pages: 3,
      });

      render(
        <MediaPickerModal
          open={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      });

      // Navigate to page 2
      vi.mocked(mediaApi.getMedia).mockResolvedValue({
        items: mockMedia,
        total: 25,
        page: 2,
        page_size: 12,
        pages: 3,
      });

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      await waitFor(() => {
        const paginationDiv = screen.getByText(/Page/i).closest('div');
        expect(paginationDiv?.textContent).toContain('2');
        expect(paginationDiv?.textContent).toContain('3');
      });

      vi.clearAllMocks();

      // Now test going back to page 1
      const prevButton = screen.getByRole('button', { name: /previous/i });
      await user.click(prevButton);

      await waitFor(() => {
        expect(mediaApi.getMedia).toHaveBeenCalledWith({
          page: 1,
          page_size: 12,
        });
      });
    });

    it('should not show pagination for single page', async () => {
      vi.mocked(mediaApi.getMedia).mockResolvedValue({
        items: mockMedia,
        total: 3,
        page: 1,
        page_size: 12,
        pages: 1,
      });

      render(
        <MediaPickerModal
          open={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('image1.jpg')).toBeInTheDocument();
      });

      expect(screen.queryByText(/page \d+ of \d+/i)).not.toBeInTheDocument();
    });
  });

  describe('Dialog Actions', () => {
    it('should render cancel and select buttons', () => {
      render(
        <MediaPickerModal
          open={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /select$/i })).toBeInTheDocument();
    });

    it('should call onClose when cancel button clicked', async () => {
      const user = userEvent.setup();
      render(
        <MediaPickerModal
          open={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should have select button disabled by default', () => {
      render(
        <MediaPickerModal
          open={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
        />
      );

      const selectButton = screen.getByRole('button', { name: /select$/i });
      expect(selectButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should handle API error gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(mediaApi.getMedia).mockRejectedValue(new Error('API Error'));

      render(
        <MediaPickerModal
          open={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
        />
      );

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to load media:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });

    it('should show alert on upload error', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(mediaApi.uploadMedia).mockRejectedValue(new Error('Upload failed'));

      render(
        <MediaPickerModal
          open={true}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
        />
      );

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(screen.getByText('image1.jpg')).toBeInTheDocument();
      });

      // Find the file input by traversing from the Upload button
      const uploadButton = screen.getByText('Upload');
      const label = uploadButton.closest('label');
      const fileInput = label?.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).not.toBeNull();
      expect(fileInput).not.toBeDisabled();
      
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to upload file');
        expect(consoleError).toHaveBeenCalled();
      });

      alertSpy.mockRestore();
      consoleError.mockRestore();
    });
  });
});
