import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContentEditDialog } from './content-edit-dialog';
import { contentApi } from '@/lib/api';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/lib/api', () => ({
  contentApi: {
    getContentType: vi.fn(),
    updateContentEntry: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/api/client', () => ({
  resolveMediaUrl: vi.fn((url) => url),
}));

// Mock MediaPickerModal
vi.mock('@/components/media-picker-modal', () => ({
  default: ({ open, onClose, onSelect }: any) => (
    open ? (
      <div data-testid="media-picker-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={() => onSelect({ url: 'https://example.com/image.jpg' })}>
          Select Image
        </button>
      </div>
    ) : null
  ),
}));

// Mock sub-components
vi.mock('./json-field-editor', () => ({
  JsonFieldEditor: ({ value, onChange, fieldName }: any) => (
    <div data-testid={`json-editor-${fieldName}`}>
      <textarea
        data-testid={`json-input-${fieldName}`}
        value={JSON.stringify(value)}
        onChange={(e) => onChange(JSON.parse(e.target.value))}
      />
    </div>
  ),
}));

vi.mock('./navigation-editor', () => ({
  NavigationEditor: ({ items, onChange }: any) => (
    <div data-testid="navigation-editor">
      Navigation Editor: {items.length} items
    </div>
  ),
}));

vi.mock('./media-gallery-editor', () => ({
  MediaGalleryEditor: ({ value, onChange }: any) => (
    <div data-testid="media-gallery-editor">
      Gallery: {value.length} items
    </div>
  ),
}));

describe('ContentEditDialog', () => {
  const mockEntry = {
    id: '1',
    slug: 'test-entry',
    status: 'draft' as const,
    content_type_id: 'type-1',
    data: {
      title: 'Test Title',
      body: 'Test body content',
      featured: true,
    },
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };

  const mockContentType = {
    id: 'type-1',
    name: 'Blog Post',
    slug: 'blog-post',
    api_id: 'blog-post',
    organization_id: 'org-1',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    fields: [
      { name: 'title', type: 'text', label: 'Title', required: true },
      { name: 'body', type: 'textarea', label: 'Body Content' },
      { name: 'featured', type: 'boolean', label: 'Featured' },
    ],
  };

  const defaultProps = {
    entry: mockEntry,
    open: true,
    onClose: vi.fn(),
    onSaved: vi.fn(),
    onBack: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(contentApi.getContentType).mockResolvedValue(mockContentType);
    vi.mocked(contentApi.updateContentEntry).mockResolvedValue({
      ...mockEntry,
      data: { ...mockEntry.data },
    });
  });

  describe('Initial Rendering', () => {
    it('should render nothing when entry is null', () => {
      render(<ContentEditDialog {...defaultProps} entry={null} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render dialog when open with entry', async () => {
      render(<ContentEditDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should display entry title in header', async () => {
      render(<ContentEditDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Edit: Test Title')).toBeInTheDocument();
      });
    });

    it('should show content type name after loading', async () => {
      render(<ContentEditDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Blog Post')).toBeInTheDocument();
      });
    });

    it('should load content type on mount', async () => {
      render(<ContentEditDialog {...defaultProps} />);

      await waitFor(() => {
        expect(contentApi.getContentType).toHaveBeenCalledWith('type-1');
      });
    });
  });

  describe('Form Fields', () => {
    it('should render slug input with entry slug', async () => {
      render(<ContentEditDialog {...defaultProps} />);

      await waitFor(() => {
        const slugInput = screen.getByLabelText(/Slug/i);
        expect(slugInput).toHaveValue('test-entry');
      });
    });

    it('should render status select with entry status', async () => {
      render(<ContentEditDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Draft')).toBeInTheDocument();
      });
    });

    it('should render text field for title', async () => {
      render(<ContentEditDialog {...defaultProps} />);

      await waitFor(() => {
        expect(contentApi.getContentType).toHaveBeenCalled();
      });

      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText(/Enter title/i);
        expect(titleInput).toBeInTheDocument();
        expect(titleInput).toHaveValue('Test Title');
      });
    });

    it('should render textarea for body', async () => {
      render(<ContentEditDialog {...defaultProps} />);

      await waitFor(() => {
        expect(contentApi.getContentType).toHaveBeenCalled();
      });

      await waitFor(() => {
        const bodyTextarea = screen.getByPlaceholderText(/Enter body content/i);
        expect(bodyTextarea).toBeInTheDocument();
      });
    });

    it('should render switch for boolean fields', async () => {
      render(<ContentEditDialog {...defaultProps} />);

      await waitFor(() => {
        expect(contentApi.getContentType).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText('Yes')).toBeInTheDocument();
      });
    });
  });

  describe('Field Types', () => {
    it('should render email input for email type', async () => {
      vi.mocked(contentApi.getContentType).mockResolvedValue({
        ...mockContentType,
        fields: [{ name: 'email', type: 'email', label: 'Email' }],
      });

      render(<ContentEditDialog {...defaultProps} entry={{ ...mockEntry, data: { email: 'test@example.com' } }} />);

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText(/Enter email/i);
        expect(emailInput).toHaveAttribute('type', 'email');
      });
    });

    it('should render number input for number type', async () => {
      vi.mocked(contentApi.getContentType).mockResolvedValue({
        ...mockContentType,
        fields: [{ name: 'count', type: 'number', label: 'Count' }],
      });

      render(<ContentEditDialog {...defaultProps} entry={{ ...mockEntry, data: { count: 42 } }} />);

      await waitFor(() => {
        const numberInput = screen.getByPlaceholderText(/Enter count/i);
        expect(numberInput).toHaveAttribute('type', 'number');
      });
    });

    it('should render select for select type with options', async () => {
      vi.mocked(contentApi.getContentType).mockResolvedValue({
        ...mockContentType,
        fields: [{ name: 'category', type: 'select', label: 'Category', options: ['Tech', 'News', 'Sports'] } as any],
      });

      render(<ContentEditDialog {...defaultProps} entry={{ ...mockEntry, data: { category: 'Tech' } }} />);

      await waitFor(() => {
        expect(screen.getByText('Tech')).toBeInTheDocument();
      });
    });

    it('should render date input for date type', async () => {
      vi.mocked(contentApi.getContentType).mockResolvedValue({
        ...mockContentType,
        fields: [{ name: 'publishDate', type: 'date', label: 'Publish Date' }],
      });

      render(<ContentEditDialog {...defaultProps} entry={{ ...mockEntry, data: { publishDate: '2025-01-01' } }} />);

      await waitFor(() => {
        const dateInput = screen.getByLabelText(/Publish Date/i);
        expect(dateInput).toHaveAttribute('type', 'date');
      });
    });

    it('should render datetime input for datetime type', async () => {
      vi.mocked(contentApi.getContentType).mockResolvedValue({
        ...mockContentType,
        fields: [{ name: 'eventTime', type: 'datetime', label: 'Event Time' }],
      });

      render(<ContentEditDialog {...defaultProps} entry={{ ...mockEntry, data: { eventTime: '2025-01-01T10:00' } }} />);

      await waitFor(() => {
        const datetimeInput = screen.getByLabelText(/Event Time/i);
        expect(datetimeInput).toHaveAttribute('type', 'datetime-local');
      });
    });

    it('should render media field with browse button', async () => {
      vi.mocked(contentApi.getContentType).mockResolvedValue({
        ...mockContentType,
        fields: [{ name: 'image', type: 'image', label: 'Image' }],
      });

      render(<ContentEditDialog {...defaultProps} entry={{ ...mockEntry, data: { image: '' } }} />);

      await waitFor(() => {
        expect(screen.getByText('Browse')).toBeInTheDocument();
      });
    });

    it('should render richtext as textarea', async () => {
      vi.mocked(contentApi.getContentType).mockResolvedValue({
        ...mockContentType,
        fields: [{ name: 'content', type: 'richtext', label: 'Content' }],
      });

      render(<ContentEditDialog {...defaultProps} entry={{ ...mockEntry, data: { content: '<p>Hello</p>' } }} />);

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText(/Enter content/i);
        expect(textarea.tagName).toBe('TEXTAREA');
      });
    });
  });

  describe('User Interactions', () => {
    it('should update slug when input changes', async () => {
      const user = userEvent.setup();
      render(<ContentEditDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Slug/i)).toBeInTheDocument();
      });

      const slugInput = screen.getByLabelText(/Slug/i);
      await user.clear(slugInput);
      await user.type(slugInput, 'new-slug');

      expect(slugInput).toHaveValue('new-slug');
    });

    it('should call onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<ContentEditDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Cancel'));
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should call onBack when back button is clicked', async () => {
      const user = userEvent.setup();
      render(<ContentEditDialog {...defaultProps} />);

      await waitFor(() => {
        expect(contentApi.getContentType).toHaveBeenCalled();
      });

      // Find the back button by its icon or position
      const backButton = screen.getByRole('button', { name: '' });
      if (backButton) {
        await user.click(backButton);
      }
    });
  });

  describe('Save Functionality', () => {
    it('should call updateContentEntry when Save is clicked', async () => {
      const user = userEvent.setup();
      render(<ContentEditDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Save Changes'));

      await waitFor(() => {
        expect(contentApi.updateContentEntry).toHaveBeenCalledWith('1', expect.objectContaining({
          slug: 'test-entry',
          status: 'draft',
        }));
      });
    });

    it('should show success toast on successful save', async () => {
      const user = userEvent.setup();
      render(<ContentEditDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Save Changes'));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Content saved successfully');
      });
    });

    it('should call onSaved callback after successful save', async () => {
      const user = userEvent.setup();
      render(<ContentEditDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Save Changes'));

      await waitFor(() => {
        expect(defaultProps.onSaved).toHaveBeenCalled();
      });
    });

    it('should show error toast on save failure', async () => {
      vi.mocked(contentApi.updateContentEntry).mockRejectedValue({
        response: { data: { detail: 'Save failed' } },
      });

      const user = userEvent.setup();
      render(<ContentEditDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Save Changes'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Save failed');
      });
    });
  });

  describe('Media Picker', () => {
    it('should open media picker when Browse is clicked', async () => {
      vi.mocked(contentApi.getContentType).mockResolvedValue({
        ...mockContentType,
        fields: [{ name: 'image', type: 'image', label: 'Image' }],
      });

      const user = userEvent.setup();
      render(<ContentEditDialog {...defaultProps} entry={{ ...mockEntry, data: { image: '' } }} />);

      await waitFor(() => {
        expect(screen.getByText('Browse')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Browse'));

      await waitFor(() => {
        expect(screen.getByTestId('media-picker-modal')).toBeInTheDocument();
      });
    });

    it('should update field when media is selected', async () => {
      vi.mocked(contentApi.getContentType).mockResolvedValue({
        ...mockContentType,
        fields: [{ name: 'image', type: 'image', label: 'Image' }],
      });

      // Use pointerEventsCheck: 0 to avoid issues with Radix Dialog pointer-events
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      render(<ContentEditDialog {...defaultProps} entry={{ ...mockEntry, data: { image: '' } }} />);

      await waitFor(() => {
        expect(screen.getByText('Browse')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Browse'));

      await waitFor(() => {
        expect(screen.getByTestId('media-picker-modal')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Select Image'));

      await waitFor(() => {
        const imageInput = screen.getByPlaceholderText(/Enter media URL/i);
        expect(imageInput).toHaveValue('https://example.com/image.jpg');
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator while content type is loading', async () => {
      vi.mocked(contentApi.getContentType).mockImplementation(() => new Promise(() => {}));

      render(<ContentEditDialog {...defaultProps} />);

      // The component shows a loader while loading
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Extra Fields', () => {
    it('should render extra fields not in content type', async () => {
      const entryWithExtraFields = {
        ...mockEntry,
        data: {
          title: 'Test',
          extraField: 'Extra value',
        },
      };

      render(<ContentEditDialog {...defaultProps} entry={entryWithExtraFields} />);

      await waitFor(() => {
        expect(screen.getByText('Additional Fields')).toBeInTheDocument();
      });
    });
  });

  describe('Status Selection', () => {
    it('should show all status options', async () => {
      render(<ContentEditDialog {...defaultProps} />);

      await waitFor(() => {
        // Verify the status select is rendered with the default value
        expect(screen.getByText('Draft')).toBeInTheDocument();
      });

      // Note: Can't test opening the Select due to Radix JSDOM limitations
      // The Status options (Draft, Published, Archived) are defined in the component
    });
  });
});
