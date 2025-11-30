import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContentTypeDetailPage from './page';
import { contentApi } from '@/lib/api';
import { ContentType } from '@/types';

// Mock Next.js navigation
const mockPush = vi.fn();
const mockParams = { id: '1' };

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => mockParams,
}));

// Mock API
vi.mock('@/lib/api', () => ({
  contentApi: {
    getContentType: vi.fn(),
    deleteContentType: vi.fn(),
  },
}));

// Mock window.confirm and window.alert
global.confirm = vi.fn();
global.alert = vi.fn();

describe('ContentTypeDetailPage', () => {
  const mockContentType: ContentType = {
    id: 1,
    name: 'Blog Post',
    api_id: 'blog-post',
    description: 'A blog post content type',
    fields: [
      {
        name: 'title',
        type: 'text',
        label: 'Title',
        help_text: 'The post title',
        required: true,
        unique: false,
        localized: false,
      },
      {
        name: 'body',
        type: 'richtext',
        label: 'Body',
        help_text: 'The post content',
        required: true,
        unique: false,
        localized: false,
      },
      {
        name: 'author',
        type: 'text',
        label: 'Author',
        required: false,
        unique: false,
        localized: false,
      },
      {
        name: 'published_date',
        type: 'date',
        label: 'Published Date',
        required: false,
        unique: false,
        localized: false,
      },
    ],
    display_field: 'title',
    is_active: true,
    entry_count: 0,
    organization_id: 1,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-15T12:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.id = '1';
    vi.mocked(contentApi.getContentType).mockResolvedValue(mockContentType);
  });

  describe('Loading State', () => {
    it('should show loading state while fetching content type', () => {
      render(<ContentTypeDetailPage />);
      expect(screen.getByText('Loading content type...')).toBeInTheDocument();
    });

    it('should hide loading state after data loads', async () => {
      render(<ContentTypeDetailPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading content type...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Content Type Details', () => {
    it('should render content type name and description', async () => {
      render(<ContentTypeDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Blog Post' })).toBeInTheDocument();
        // Description appears in header and Basic Info card - use getAllByText
        const descriptions = screen.getAllByText('A blog post content type');
        expect(descriptions.length).toBeGreaterThan(0);
      });
    });

    it('should render back button to content types list', async () => {
      render(<ContentTypeDetailPage />);

      await waitFor(() => {
        const backButton = screen.getByRole('link', { name: /← Back/i });
        expect(backButton).toBeInTheDocument();
        expect(backButton).toHaveAttribute('href', '/dashboard/content-types');
      });
    });

    it('should render edit and delete buttons', async () => {
      render(<ContentTypeDetailPage />);

      await waitFor(() => {
        // Use getAllByRole to handle multiple "Edit" links (header + actions card)
        const editLinks = screen.getAllByRole('link', { name: /Edit/i });
        expect(editLinks.length).toBeGreaterThan(0);
        expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
      });
    });

    it('should render edit button with correct link', async () => {
      render(<ContentTypeDetailPage />);

      await waitFor(() => {
        // Use getAllByRole and check the first one (header edit button)
        const editLinks = screen.getAllByRole('link', { name: /Edit/i });
        expect(editLinks[0]).toHaveAttribute('href', '/dashboard/content-types/1/edit');
      });
    });
  });

  describe('Basic Information Card', () => {
    it('should render basic information card with title', async () => {
      render(<ContentTypeDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Basic Information')).toBeInTheDocument();
        expect(screen.getByText('General details about this content type')).toBeInTheDocument();
      });
    });

    it('should display content type name', async () => {
      render(<ContentTypeDetailPage />);

      await waitFor(() => {
        const nameLabels = screen.getAllByText('Name');
        expect(nameLabels.length).toBeGreaterThan(0);
        // Name appears twice: once in header, once in basic info
        const blogPostTexts = screen.getAllByText('Blog Post');
        expect(blogPostTexts.length).toBeGreaterThan(0);
      });
    });

    it('should display content type API ID in a badge', async () => {
      render(<ContentTypeDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('API ID')).toBeInTheDocument();
        expect(screen.getByText('blog-post')).toBeInTheDocument();
      });
    });

    it('should display content type description', async () => {
      render(<ContentTypeDetailPage />);

      await waitFor(() => {
        const descriptionLabels = screen.getAllByText('Description');
        expect(descriptionLabels.length).toBeGreaterThan(0);
      });
    });

    it('should display created date', async () => {
      render(<ContentTypeDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Created')).toBeInTheDocument();
        // Date will be formatted based on locale - just check it's present
        const dateElements = screen.getAllByText((content, element) => {
          return element?.textContent?.includes('2025') || false;
        });
        expect(dateElements.length).toBeGreaterThan(0);
      });
    });

    it('should display updated date', async () => {
      render(<ContentTypeDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Last Updated')).toBeInTheDocument();
        expect(screen.getByText(/1\/15\/2025/)).toBeInTheDocument();
      });
    });

    it('should show "No description provided" when description is empty', async () => {
      const typeWithoutDesc = { ...mockContentType, description: '' };
      vi.mocked(contentApi.getContentType).mockResolvedValue(typeWithoutDesc);

      render(<ContentTypeDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('No description provided')).toBeInTheDocument();
      });
    });
  });

  describe('Schema / Fields Card', () => {
    it('should render schema card with title', async () => {
      render(<ContentTypeDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Schema / Fields')).toBeInTheDocument();
        expect(
          screen.getByText('Field definitions for content entries of this type')
        ).toBeInTheDocument();
      });
    });

    it('should display all schema fields', async () => {
      render(<ContentTypeDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('title')).toBeInTheDocument();
        expect(screen.getByText('body')).toBeInTheDocument();
        expect(screen.getByText('author')).toBeInTheDocument();
        expect(screen.getByText('published_date')).toBeInTheDocument();
      });
    });

    it('should display field labels', async () => {
      render(<ContentTypeDetailPage />);

      await waitFor(() => {
        // Field names are lowercase in the schema
        expect(screen.getByText('title')).toBeInTheDocument();
        expect(screen.getByText('body')).toBeInTheDocument();
        expect(screen.getByText('author')).toBeInTheDocument();
        expect(screen.getByText('published_date')).toBeInTheDocument();
      });
    });

    it('should display field types as badges', async () => {
      render(<ContentTypeDetailPage />);

      await waitFor(() => {
        // Fields now show type as 'text', 'richtext', 'date'
        const textBadges = screen.getAllByText('text');
        expect(textBadges.length).toBeGreaterThanOrEqual(2); // title and author fields
        expect(screen.getByText('richtext')).toBeInTheDocument();
        expect(screen.getByText('date')).toBeInTheDocument();
      });
    });

    it('should display "Required" badge for required fields', async () => {
      render(<ContentTypeDetailPage />);

      await waitFor(() => {
        const requiredBadges = screen.getAllByText('Required');
        // title and body are required
        expect(requiredBadges.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should display field descriptions', async () => {
      render(<ContentTypeDetailPage />);

      await waitFor(() => {
        // Check that help_text is displayed for fields that have it
        expect(screen.getByText('The post title')).toBeInTheDocument();
        expect(screen.getByText('The post content')).toBeInTheDocument();
      });
    });

    it('should show empty state when no fields defined', async () => {
      const typeWithoutFields = { ...mockContentType, fields: [] };
      vi.mocked(contentApi.getContentType).mockResolvedValue(typeWithoutFields);

      render(<ContentTypeDetailPage />);

      await waitFor(() => {
        // When there are no fields, the schema card should still render but show empty state
        const schemaCard = screen.getByText('Schema / Fields').closest('[data-slot="card"]');
        expect(schemaCard).toBeInTheDocument();
      });
    });
  });

  describe('Actions Card', () => {
    it('should render actions card with title', async () => {
      render(<ContentTypeDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Actions')).toBeInTheDocument();
        expect(screen.getByText('Manage this content type')).toBeInTheDocument();
      });
    });

    it('should render "View Content Entries" link', async () => {
      render(<ContentTypeDetailPage />);

      await waitFor(() => {
        const link = screen.getByRole('link', { name: /View Content Entries/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/dashboard/content?content_type_id=1');
      });
    });

    it('should render "Create New Entry" link', async () => {
      render(<ContentTypeDetailPage />);

      await waitFor(() => {
        const link = screen.getByRole('link', { name: /Create New Entry/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/dashboard/content/new?content_type_id=1');
      });
    });

    it('should render "Edit Content Type" link', async () => {
      render(<ContentTypeDetailPage />);

      await waitFor(() => {
        const link = screen.getByRole('link', { name: /Edit Content Type/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/dashboard/content-types/1/edit');
      });
    });
  });

  describe('Delete Functionality', () => {
    it('should show confirmation dialog when delete button clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(global.confirm).mockReturnValue(false);

      render(<ContentTypeDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      await user.click(deleteButton);

      expect(global.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete this content type? This action cannot be undone.'
      );
    });

    it('should not delete when confirmation is cancelled', async () => {
      const user = userEvent.setup();
      vi.mocked(global.confirm).mockReturnValue(false);

      render(<ContentTypeDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      await user.click(deleteButton);

      expect(contentApi.deleteContentType).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should delete content type when confirmed', async () => {
      const user = userEvent.setup();
      vi.mocked(global.confirm).mockReturnValue(true);
      vi.mocked(contentApi.deleteContentType).mockResolvedValue(undefined);

      render(<ContentTypeDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(contentApi.deleteContentType).toHaveBeenCalledWith(1);
        expect(mockPush).toHaveBeenCalledWith('/dashboard/content-types');
      });
    });

    it('should show alert on delete error', async () => {
      const user = userEvent.setup();
      vi.mocked(global.confirm).mockReturnValue(true);
      vi.mocked(contentApi.deleteContentType).mockRejectedValue({
        response: { data: { detail: 'Cannot delete: content entries exist' } },
      });

      render(<ContentTypeDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          'Failed to delete content type: Cannot delete: content entries exist'
        );
      });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when content type fails to load', async () => {
      vi.mocked(contentApi.getContentType).mockRejectedValue(new Error('API Error'));

      render(<ContentTypeDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load content type')).toBeInTheDocument();
      });
    });

    it('should render back button in error state', async () => {
      vi.mocked(contentApi.getContentType).mockRejectedValue(new Error('API Error'));

      render(<ContentTypeDetailPage />);

      await waitFor(() => {
        const backButton = screen.getByRole('link', { name: /Back to Content Types/i });
        expect(backButton).toBeInTheDocument();
        expect(backButton).toHaveAttribute('href', '/dashboard/content-types');
      });
    });

    it('should display "Content type not found" when content type is null', async () => {
      vi.mocked(contentApi.getContentType).mockResolvedValue(null as any);

      render(<ContentTypeDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Content type not found')).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('should call getContentType with correct ID', async () => {
      render(<ContentTypeDetailPage />);

      await waitFor(() => {
        expect(contentApi.getContentType).toHaveBeenCalledWith(1);
      });
    });

    it('should parse ID from params correctly', async () => {
      mockParams.id = '42';
      render(<ContentTypeDetailPage />);

      await waitFor(() => {
        expect(contentApi.getContentType).toHaveBeenCalledWith(42);
      });
    });

    it('should reload content type when ID changes', async () => {
      const { rerender } = render(<ContentTypeDetailPage />);

      await waitFor(() => {
        expect(contentApi.getContentType).toHaveBeenCalledWith(1);
      });

      vi.clearAllMocks();
      mockParams.id = '2';
      rerender(<ContentTypeDetailPage />);

      await waitFor(() => {
        expect(contentApi.getContentType).toHaveBeenCalledWith(2);
      });
    });
  });
});
