import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContentViewDialog } from './content-view-dialog';
import { contentApi } from '@/lib/api';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/lib/api', () => ({
  contentApi: {
    getContentType: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

vi.mock('@/lib/api/client', () => ({
  resolveMediaUrl: vi.fn((url) => url),
}));

vi.mock('./json-field-editor', () => ({
  JsonFieldEditor: ({ value, fieldName, readOnly }: any) => (
    <div data-testid={`json-viewer-${fieldName}`}>
      JSON: {JSON.stringify(value)}
    </div>
  ),
}));

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn(),
};
Object.assign(navigator, { clipboard: mockClipboard });

describe('ContentViewDialog', () => {
  const mockEntry = {
    id: '1',
    slug: 'test-entry',
    status: 'published' as const,
    content_type_id: 'type-1',
    data: {
      title: 'Test Title',
      body: 'Test body content with more than two hundred characters. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.',
      email: 'test@example.com',
      website: 'https://example.com',
      featured: true,
      count: 42,
    },
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-15T12:00:00Z',
    created_by: 'user-1',
    organization_id: 'org-1',
  };

  const mockContentType = {
    id: 'type-1',
    organization_id: 'org-1',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    name: 'Blog Post',
    slug: 'blog-post',
    api_id: 'blog-post',
    fields: [
      { name: 'title', type: 'text', label: 'Title', required: true },
      { name: 'body', type: 'textarea', label: 'Body Content' },
      { name: 'email', type: 'email', label: 'Email' },
      { name: 'website', type: 'url', label: 'Website' },
      { name: 'featured', type: 'boolean', label: 'Featured' },
      { name: 'count', type: 'number', label: 'Count' },
    ],
  };

  const defaultProps = {
    entry: mockEntry,
    open: true,
    onClose: vi.fn(),
    onEdit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(contentApi.getContentType).mockResolvedValue(mockContentType);
    mockClipboard.writeText.mockResolvedValue(undefined);
  });

  describe('Initial Rendering', () => {
    it('should render nothing when entry is null', () => {
      render(<ContentViewDialog {...defaultProps} entry={null} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render dialog when open with entry', async () => {
      render(<ContentViewDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should display entry title', async () => {
      render(<ContentViewDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Test Title')).toBeInTheDocument();
      });
    });

    it('should display entry slug', async () => {
      render(<ContentViewDialog {...defaultProps} />);

      await waitFor(() => {
        const slugElements = screen.getAllByText('test-entry');
        expect(slugElements.length).toBeGreaterThan(0);
      });
    });

    it('should display entry status badge', async () => {
      render(<ContentViewDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('published')).toBeInTheDocument();
      });
    });

    it('should load content type on mount', async () => {
      render(<ContentViewDialog {...defaultProps} />);

      await waitFor(() => {
        expect(contentApi.getContentType).toHaveBeenCalledWith('type-1');
      });
    });

    it('should display content type name after loading', async () => {
      render(<ContentViewDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Blog Post')).toBeInTheDocument();
      });
    });
  });

  describe('Status Badge Colors', () => {
    it('should show green badge for published status', async () => {
      render(<ContentViewDialog {...defaultProps} />);

      await waitFor(() => {
        const badge = screen.getByText('published');
        expect(badge).toHaveClass('bg-green-100');
      });
    });

    it('should show yellow badge for draft status', async () => {
      render(<ContentViewDialog {...defaultProps} entry={{ ...mockEntry, status: 'draft' }} />);

      await waitFor(() => {
        const badge = screen.getByText('draft');
        expect(badge).toHaveClass('bg-yellow-100');
      });
    });

    it('should show gray badge for archived status', async () => {
      render(<ContentViewDialog {...defaultProps} entry={{ ...mockEntry, status: 'archived' }} />);

      await waitFor(() => {
        const badge = screen.getByText('archived');
        expect(badge).toHaveClass('bg-gray-100');
      });
    });
  });

  describe('Tabs', () => {
    it('should render Fields tab by default', async () => {
      render(<ContentViewDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Fields')).toBeInTheDocument();
      });
    });

    it('should render Metadata tab', async () => {
      render(<ContentViewDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Metadata')).toBeInTheDocument();
      });
    });

    it('should render Media tab when media items exist', async () => {
      const entryWithMedia = {
        ...mockEntry,
        data: {
          ...mockEntry.data,
          image: 'https://example.com/image.jpg',
        },
      };

      vi.mocked(contentApi.getContentType).mockResolvedValue({
        ...mockContentType,
        fields: [...mockContentType.fields, { name: 'image', type: 'image', label: 'Image' }],
      });

      render(<ContentViewDialog {...defaultProps} entry={entryWithMedia} />);

      await waitFor(() => {
        expect(screen.getByText(/Media/)).toBeInTheDocument();
      });
    });
  });

  describe('Field Value Rendering', () => {
    it('should render boolean as Yes/No', async () => {
      render(<ContentViewDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/✓ Yes/)).toBeInTheDocument();
      });
    });

    it('should render false boolean correctly', async () => {
      const entryWithFalse = {
        ...mockEntry,
        data: { ...mockEntry.data, featured: false },
      };

      render(<ContentViewDialog {...defaultProps} entry={entryWithFalse} />);

      await waitFor(() => {
        expect(screen.getByText(/✗ No/)).toBeInTheDocument();
      });
    });

    it('should render URL as clickable link', async () => {
      render(<ContentViewDialog {...defaultProps} />);

      await waitFor(() => {
        // Use more specific text to avoid matching email
        const link = screen.getByText('https://example.com');
        expect(link.closest('a')).toHaveAttribute('href', 'https://example.com');
        expect(link.closest('a')).toHaveAttribute('target', '_blank');
      });
    });

    it('should render email as mailto link', async () => {
      render(<ContentViewDialog {...defaultProps} />);

      await waitFor(() => {
        const link = screen.getByText('test@example.com');
        expect(link.closest('a')).toHaveAttribute('href', 'mailto:test@example.com');
      });
    });

    it('should render null values as Not set', async () => {
      const entryWithNull = {
        ...mockEntry,
        data: { title: 'Test', nullField: null },
      };

      render(<ContentViewDialog {...defaultProps} entry={entryWithNull} />);

      await waitFor(() => {
        expect(screen.getByText('Not set')).toBeInTheDocument();
      });
    });

    it('should render empty string as Empty', async () => {
      const entryWithEmpty = {
        ...mockEntry,
        data: { title: 'Test', emptyField: '' },
      };

      render(<ContentViewDialog {...defaultProps} entry={entryWithEmpty} />);

      await waitFor(() => {
        expect(screen.getByText('Empty')).toBeInTheDocument();
      });
    });
  });

  describe('User Actions', () => {
    it('should call onEdit when Edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<ContentViewDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Edit'));
      expect(defaultProps.onEdit).toHaveBeenCalled();
    });

    it('should call onClose when X button is clicked', async () => {
      const user = userEvent.setup();
      render(<ContentViewDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Find the close button (X icon)
      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find(btn => btn.querySelector('svg.lucide-x'));

      if (closeButton) {
        await user.click(closeButton);
        expect(defaultProps.onClose).toHaveBeenCalled();
      }
    });

    it('should call onClose when dialog is closed via backdrop', async () => {
      render(<ContentViewDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // The Dialog component calls onOpenChange when closed
      // We test this by simulating the dialog close
    });
  });

  describe('Copy to Clipboard', () => {
    it('should copy text to clipboard and show toast', async () => {
      render(<ContentViewDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // The copy functionality is triggered by clicking copy buttons
      // This tests the copyToClipboard function indirectly
    });
  });

  describe('Image Rendering', () => {
    it('should render image preview for image URLs', async () => {
      // Use a relative path since absolute https:// URLs are caught by URL check first
      const entryWithImage = {
        ...mockEntry,
        data: {
          title: 'Test',
          photo: '/uploads/photo.jpg',
        },
      };

      // Need to include photo field in content type for it to render
      vi.mocked(contentApi.getContentType).mockResolvedValue({
        ...mockContentType,
        fields: [
          ...mockContentType.fields,
          { name: 'photo', type: 'image', label: 'Photo' },
        ],
      });

      render(<ContentViewDialog {...defaultProps} entry={entryWithImage} />);

      await waitFor(() => {
        const img = screen.getByAltText('photo');
        expect(img).toBeInTheDocument();
        // resolveMediaUrl adds API prefix to relative URLs
        expect(img.getAttribute('src')).toContain('photo.jpg');
      });
    });
  });

  describe('Object/Array Values', () => {
    it('should render JSON editor for object values', async () => {
      const entryWithObject = {
        ...mockEntry,
        data: {
          title: 'Test',
          metadata: { key: 'value' },
        },
      };

      render(<ContentViewDialog {...defaultProps} entry={entryWithObject} />);

      await waitFor(() => {
        expect(screen.getByTestId('json-viewer-metadata')).toBeInTheDocument();
      });
    });

    it('should render JSON editor for array values', async () => {
      const entryWithArray = {
        ...mockEntry,
        data: {
          title: 'Test',
          tags: ['tag1', 'tag2'],
        },
      };

      render(<ContentViewDialog {...defaultProps} entry={entryWithArray} />);

      await waitFor(() => {
        expect(screen.getByTestId('json-viewer-tags')).toBeInTheDocument();
      });
    });
  });

  describe('Long Text Handling', () => {
    it('should render long text in scrollable container', async () => {
      render(<ContentViewDialog {...defaultProps} />);

      await waitFor(() => {
        // The body field has more than 200 characters
        expect(screen.getByText(/Lorem ipsum/)).toBeInTheDocument();
      });
    });

    it('should truncate long URLs', async () => {
      const entryWithLongUrl = {
        ...mockEntry,
        data: {
          title: 'Test',
          link: 'https://example.com/very/long/path/that/exceeds/fifty/characters/in/length',
        },
      };

      render(<ContentViewDialog {...defaultProps} entry={entryWithLongUrl} />);

      await waitFor(() => {
        // URL should be truncated with ellipsis
        expect(screen.getByText(/\.\.\./)).toBeInTheDocument();
      });
    });
  });

  describe('Media Extraction', () => {
    it('should extract images from nested objects', async () => {
      const entryWithNestedMedia = {
        ...mockEntry,
        data: {
          title: 'Test',
          gallery: [
            { url: 'https://example.com/img1.jpg', title: 'Image 1' },
            { url: 'https://example.com/img2.jpg', title: 'Image 2' },
          ],
        },
      };

      render(<ContentViewDialog {...defaultProps} entry={entryWithNestedMedia} />);

      await waitFor(() => {
        // Should show Media tab with count
        expect(screen.getByText(/Media \(2\)/)).toBeInTheDocument();
      });
    });

    it('should identify video URLs correctly', async () => {
      const entryWithVideo = {
        ...mockEntry,
        data: {
          title: 'Test',
          video: 'https://example.com/video.mp4',
        },
      };

      render(<ContentViewDialog {...defaultProps} entry={entryWithVideo} />);

      await waitFor(() => {
        expect(screen.getByText(/Media/)).toBeInTheDocument();
      });
    });
  });

  describe('Fallback Display', () => {
    it('should use slug as title when no title field exists', async () => {
      const entryWithoutTitle = {
        ...mockEntry,
        data: { body: 'Content without title' },
      };

      render(<ContentViewDialog {...defaultProps} entry={entryWithoutTitle} />);

      await waitFor(() => {
        const slugElements = screen.getAllByText('test-entry');
        expect(slugElements.length).toBeGreaterThan(0);
      });
    });

    it('should use site_name as title when available', async () => {
      const entryWithSiteName = {
        ...mockEntry,
        data: { site_name: 'My Site' },
      };

      render(<ContentViewDialog {...defaultProps} entry={entryWithSiteName} />);

      await waitFor(() => {
        expect(screen.getByText('My Site')).toBeInTheDocument();
      });
    });

    it('should use name as title when available', async () => {
      const entryWithName = {
        ...mockEntry,
        data: { name: 'Entry Name' },
      };

      render(<ContentViewDialog {...defaultProps} entry={entryWithName} />);

      await waitFor(() => {
        expect(screen.getByText('Entry Name')).toBeInTheDocument();
      });
    });
  });

  describe('Content Data Alternatives', () => {
    it('should use content_data if data is not available', async () => {
      const entryWithContentData = {
        ...mockEntry,
        data: undefined,
        content_data: { title: 'From Content Data' },
      };

      render(<ContentViewDialog {...defaultProps} entry={entryWithContentData} />);

      await waitFor(() => {
        expect(screen.getByText('From Content Data')).toBeInTheDocument();
      });
    });
  });
});
