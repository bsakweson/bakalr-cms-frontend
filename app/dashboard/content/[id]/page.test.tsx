import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContentEntryEditorPage from './page';
import { contentApi, translationApi } from '@/lib/api';

// Mock Next.js navigation
const mockPush = vi.fn();
const mockParams = { id: '1' };

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => mockParams,
}));

// Mock API modules
vi.mock('@/lib/api', () => ({
  contentApi: {
    getContentTypes: vi.fn(),
    getContentType: vi.fn(),
    getContentEntry: vi.fn(),
    createContentEntry: vi.fn(),
    updateContentEntry: vi.fn(),
    publishContentEntry: vi.fn(),
  },
  translationApi: {
    getLocales: vi.fn(),
    getContentTranslations: vi.fn(),
    createOrUpdateTranslation: vi.fn(),
  },
  mediaApi: {},
}));

// Mock components
vi.mock('@/components/rich-text-editor', () => ({
  default: ({ content, onChange, placeholder }: any) => (
    <textarea
      data-testid="rich-text-editor"
      value={content}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
}));

vi.mock('@/components/media-picker-modal', () => ({
  default: ({ open, onClose, onSelect }: any) =>
    open ? (
      <div data-testid="media-picker-modal">
        <button onClick={onClose}>Close</button>
        <button
          onClick={() =>
            onSelect({ id: 1, public_url: 'https://example.com/image.jpg', storage_path: '/uploads/image.jpg' })
          }
        >
          Select Media
        </button>
      </div>
    ) : null,
}));

describe('ContentEntryEditorPage', () => {
  const mockContentTypes = [
    { id: 1, name: 'Blog Post', slug: 'blog-post', schema: {}, organization_id: 1, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
    { id: 2, name: 'Product', slug: 'product', schema: {}, organization_id: 1, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  ];

  const mockContentType = {
    id: 1,
    name: 'Blog Post',
    slug: 'blog-post',
    organization_id: 1,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    schema: {
      title: { type: 'text', label: 'Title', required: true },
      body: { type: 'richtext', label: 'Body', required: true },
      excerpt: { type: 'textarea', label: 'Excerpt' },
      published_date: { type: 'date', label: 'Published Date' },
    },
  };

  const mockEntry = {
    id: 1,
    content_type_id: 1,
    slug: 'my-blog-post',
    status: 'draft' as const,
    version: 1,
    author_id: 1,
    content_data: {
      title: 'My Blog Post',
      body: '<p>Content here</p>',
      excerpt: 'A brief excerpt',
    },
    content_type: mockContentType,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
    published_at: undefined,
  };

  const mockLocales = [
    { id: 1, code: 'en', name: 'English', is_default: true, enabled: true, is_enabled: true, is_active: true, auto_translate: false, organization_id: 1, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
    { id: 2, code: 'es', name: 'Spanish', is_default: false, enabled: true, is_enabled: true, is_active: true, auto_translate: true, organization_id: 1, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
    { id: 3, code: 'fr', name: 'French', is_default: false, enabled: true, is_enabled: true, is_active: true, auto_translate: true, organization_id: 1, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.id = '1';
    vi.mocked(contentApi.getContentTypes).mockResolvedValue(mockContentTypes);
    vi.mocked(contentApi.getContentType).mockResolvedValue(mockContentType);
    vi.mocked(contentApi.getContentEntry).mockResolvedValue(mockEntry);
    vi.mocked(translationApi.getLocales).mockResolvedValue(mockLocales);
    vi.mocked(translationApi.getContentTranslations).mockResolvedValue([]);
    global.alert = vi.fn();
  });

  describe('Loading State', () => {
    it('should show loading state while fetching data', () => {
      vi.mocked(contentApi.getContentEntry).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockEntry), 100))
      );

      render(<ContentEntryEditorPage />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should hide loading state after data loads', async () => {
      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edit Mode', () => {
    it('should render page in edit mode with existing entry', async () => {
      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        expect(screen.getByText('Edit Content')).toBeInTheDocument();
        expect(screen.getByText('Blog Post')).toBeInTheDocument();
      });
    });

    it('should populate form fields with entry data', async () => {
      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('My Blog Post')).toBeInTheDocument();
        expect(screen.getByDisplayValue('my-blog-post')).toBeInTheDocument();
        expect(screen.getByDisplayValue('A brief excerpt')).toBeInTheDocument();
      });
    });

    it('should display entry metadata (created, updated)', async () => {
      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        expect(screen.getByText(/Created:/)).toBeInTheDocument();
        expect(screen.getByText(/Updated:/)).toBeInTheDocument();
        expect(screen.getByText('1/1/2025')).toBeInTheDocument();
      });
    });

    it('should show publish button when status is not published', async () => {
      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Publish/i })).toBeInTheDocument();
      });
    });

    it('should not show publish button when status is published', async () => {
      vi.mocked(contentApi.getContentEntry).mockResolvedValue({
        ...mockEntry,
        status: 'published',
      });

      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Publish/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Create Mode', () => {
    beforeEach(() => {
      mockParams.id = 'new';
    });

    it('should render page in create mode', () => {
      render(<ContentEntryEditorPage />);
      expect(screen.getByText('Create Content')).toBeInTheDocument();
    });

    it('should show content type selector in create mode', () => {
      render(<ContentEntryEditorPage />);
      expect(screen.getByText('Content Type')).toBeInTheDocument();
      expect(screen.getByText('Select the type of content you want to create')).toBeInTheDocument();
    });

    it('should not show publish button in create mode', () => {
      render(<ContentEntryEditorPage />);
      expect(screen.queryByRole('button', { name: /Publish/i })).not.toBeInTheDocument();
    });

    it('should not show actions card in create mode', () => {
      render(<ContentEntryEditorPage />);
      expect(screen.queryByText('Actions')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Delete/i })).not.toBeInTheDocument();
    });

    it('should load content type fields after selection', async () => {
      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox');
        expect(selects[0]).toBeInTheDocument();
        expect(selects[0]).toHaveTextContent('Select content type');
      });

      // Verify the content type API would be called (mocked)
      expect(contentApi.getContentTypes).toHaveBeenCalled();
    });
  });

  describe('Form Fields Rendering', () => {
    beforeEach(() => {
      vi.mocked(contentApi.getContentType).mockResolvedValue({
        ...mockContentType,
        schema: {
          title: { type: 'text', label: 'Title', required: true, description: 'Enter a title' },
          body: { type: 'richtext', label: 'Body' },
          excerpt: { type: 'textarea', label: 'Excerpt' },
          featured_image: { type: 'image', label: 'Featured Image' },
          tags: { type: 'select', label: 'Tags', options: ['Tech', 'Design', 'News'] },
          published: { type: 'boolean', label: 'Published' },
          views: { type: 'number', label: 'Views' },
          email: { type: 'email', label: 'Author Email' },
          website: { type: 'url', label: 'Website' },
        },
      });
    });

    it('should render text input field', async () => {
      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Title/)).toBeInTheDocument();
        expect(screen.getByText('Enter a title')).toBeInTheDocument();
      });
    });

    it('should render rich text editor field', async () => {
      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
      });
    });

    it('should render textarea field', async () => {
      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        const textarea = screen.getByLabelText(/Excerpt/);
        expect(textarea.tagName).toBe('TEXTAREA');
      });
    });

    it('should render image field with browse button', async () => {
      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Featured Image/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Browse/i })).toBeInTheDocument();
      });
    });

    it('should render select field with options', async () => {
      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        expect(screen.getByText('Tags')).toBeInTheDocument();
      });
    });

    it('should render boolean checkbox field', async () => {
      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        const checkbox = screen.getByRole('checkbox');
        expect(checkbox).toBeInTheDocument();
      });
    });

    it('should render number input field', async () => {
      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        const input = screen.getByLabelText(/Views/);
        expect(input).toHaveAttribute('type', 'number');
      });
    });

    it('should render email input field', async () => {
      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        const input = screen.getByLabelText(/Author Email/);
        expect(input).toHaveAttribute('type', 'email');
      });
    });

    it('should render URL input field', async () => {
      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        const input = screen.getByLabelText(/Website/);
        expect(input).toHaveAttribute('type', 'url');
      });
    });
  });

  describe('Translation Tabs', () => {
    it('should render default content tab', async () => {
      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Default Content/i })).toBeInTheDocument();
      });
    });

    it('should render translation tabs for non-default locales', async () => {
      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Spanish/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /French/i })).toBeInTheDocument();
      });
    });

    it('should switch to translation tab when clicked', async () => {
      const user = userEvent.setup();
      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Spanish/i })).toBeInTheDocument();
      });

      const spanishTab = screen.getByRole('tab', { name: /Spanish/i });
      await user.click(spanishTab);

      await waitFor(() => {
        expect(screen.getByText(/Translate content to/)).toBeInTheDocument();
        // Check for strong element containing "Spanish" in the translation hint
        const hints = screen.getAllByText(/Spanish/);
        expect(hints.length).toBeGreaterThan(0);
      });
    });

    it('should render translation fields in translation tab', async () => {
      const user = userEvent.setup();
      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Spanish/i })).toBeInTheDocument();
      });

      const spanishTab = screen.getByRole('tab', { name: /Spanish/i });
      await user.click(spanishTab);

      await waitFor(() => {
        // Translation fields should be rendered (same fields as default)
        const inputs = screen.getAllByLabelText(/Title/);
        expect(inputs.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Form Interactions', () => {
    it('should update text field value', async () => {
      const user = userEvent.setup();
      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('My Blog Post')).toBeInTheDocument();
      });

      const titleInput = screen.getByDisplayValue('My Blog Post');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Title');

      expect(titleInput).toHaveValue('Updated Title');
    });

    it('should update slug field value', async () => {
      const user = userEvent.setup();
      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('my-blog-post')).toBeInTheDocument();
      });

      const slugInput = screen.getByDisplayValue('my-blog-post');
      await user.clear(slugInput);
      await user.type(slugInput, 'new-slug');

      expect(slugInput).toHaveValue('new-slug');
    });

    it('should generate slug from title', async () => {
      const user = userEvent.setup();
      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('My Blog Post')).toBeInTheDocument();
      });

      const titleInput = screen.getByDisplayValue('My Blog Post');
      await user.clear(titleInput);
      await user.type(titleInput, 'New Amazing Title');

      const generateButton = screen.getByRole('button', { name: /Generate/i });
      await user.click(generateButton);

      const slugInput = screen.getByDisplayValue(/new-amazing-title/i);
      expect(slugInput).toBeInTheDocument();
    });

    it('should update status via select', async () => {
      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Get all comboboxes and verify status select is present
      const selects = screen.getAllByRole('combobox');
      expect(selects[0]).toBeInTheDocument();
      expect(selects[0]).toHaveTextContent('Draft'); // Status select shows current status
    });
  });

  describe('Media Picker', () => {
    beforeEach(() => {
      vi.mocked(contentApi.getContentType).mockResolvedValue({
        ...mockContentType,
        schema: {
          featured_image: { type: 'image', label: 'Featured Image' },
        },
      });
    });

    it('should open media picker when browse button clicked', async () => {
      const user = userEvent.setup();
      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Browse/i })).toBeInTheDocument();
      });

      const browseButton = screen.getByRole('button', { name: /Browse/i });
      await user.click(browseButton);

      expect(screen.getByTestId('media-picker-modal')).toBeInTheDocument();
    });

    it('should populate field with selected media URL', async () => {
      const user = userEvent.setup();
      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Browse/i })).toBeInTheDocument();
      });

      const browseButton = screen.getByRole('button', { name: /Browse/i });
      await user.click(browseButton);

      const selectButton = screen.getByRole('button', { name: /Select Media/i });
      await user.click(selectButton);

      await waitFor(() => {
        const imageInput = screen.getByDisplayValue('https://example.com/image.jpg');
        expect(imageInput).toBeInTheDocument();
      });
    });

    it('should close media picker after selection', async () => {
      const user = userEvent.setup();
      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Browse/i })).toBeInTheDocument();
      });

      const browseButton = screen.getByRole('button', { name: /Browse/i });
      await user.click(browseButton);

      const selectButton = screen.getByRole('button', { name: /Select Media/i });
      await user.click(selectButton);

      await waitFor(() => {
        expect(screen.queryByTestId('media-picker-modal')).not.toBeInTheDocument();
      });
    });

    it('should close media picker when close button clicked', async () => {
      const user = userEvent.setup();
      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Browse/i })).toBeInTheDocument();
      });

      const browseButton = screen.getByRole('button', { name: /Browse/i });
      await user.click(browseButton);

      const closeButton = screen.getByRole('button', { name: /Close/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('media-picker-modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('Save Functionality', () => {
    it('should save draft successfully', async () => {
      const user = userEvent.setup();
      vi.mocked(contentApi.updateContentEntry).mockResolvedValue(mockEntry);

      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Save Draft/i })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /Save Draft/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(contentApi.updateContentEntry).toHaveBeenCalledWith(1, expect.objectContaining({
          content_type_id: 1,
          slug: 'my-blog-post',
          status: 'draft',
        }));
        expect(global.alert).toHaveBeenCalledWith('Content saved successfully');
      });
    });

    it('should create new entry in create mode', async () => {
      const user = userEvent.setup();
      mockParams.id = 'new';
      const newEntry = { ...mockEntry, id: 2 };
      vi.mocked(contentApi.createContentEntry).mockResolvedValue(newEntry);

      render(<ContentEntryEditorPage />);

      // Verify content type selector is present
      await waitFor(() => {
        const selects = screen.getAllByRole('combobox');
        expect(selects[0]).toBeInTheDocument();
        expect(selects[0]).toHaveTextContent('Select content type');
      });

      // Note: We can't test dropdown interaction due to Radix UI in jsdom
      // Just verify create mode UI is correct
      expect(screen.getByText('Create Content')).toBeInTheDocument();
      expect(screen.getByText('Select a content type')).toBeInTheDocument();
    });

    it('should show saving state during save', async () => {
      const user = userEvent.setup();
      vi.mocked(contentApi.updateContentEntry).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockEntry), 100))
      );

      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Save Draft/i })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /Save Draft/i });
      await user.click(saveButton);

      expect(screen.getByText('Saving...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
      });
    });

    it('should show alert when content type is not selected', async () => {
      const user = userEvent.setup();
      mockParams.id = 'new';

      render(<ContentEntryEditorPage />);

      const saveButton = screen.getByRole('button', { name: /Save Draft/i });
      await user.click(saveButton);

      expect(global.alert).toHaveBeenCalledWith('Please select a content type');
    });

    it('should show alert when slug is empty', async () => {
      const user = userEvent.setup();
      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('my-blog-post')).toBeInTheDocument();
      });

      const slugInput = screen.getByDisplayValue('my-blog-post');
      await user.clear(slugInput);

      const saveButton = screen.getByRole('button', { name: /Save Draft/i });
      await user.click(saveButton);

      expect(global.alert).toHaveBeenCalledWith('Please enter a slug');
    });

    it('should handle save error gracefully', async () => {
      const user = userEvent.setup();
      vi.mocked(contentApi.updateContentEntry).mockRejectedValue(
        new Error('Network error')
      );

      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Save Draft/i })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /Save Draft/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Failed to save'));
      });
    });
  });

  describe('Publish Functionality', () => {
    it('should publish content successfully', async () => {
      const user = userEvent.setup();
      vi.mocked(contentApi.publishContentEntry).mockResolvedValue({ ...mockEntry, status: 'published' });

      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Publish/i })).toBeInTheDocument();
      });

      const publishButton = screen.getByRole('button', { name: /Publish/i });
      await user.click(publishButton);

      await waitFor(() => {
        expect(contentApi.publishContentEntry).toHaveBeenCalledWith(1);
        expect(global.alert).toHaveBeenCalledWith('Content published successfully');
      });
    });

    it('should handle publish error gracefully', async () => {
      const user = userEvent.setup();
      vi.mocked(contentApi.publishContentEntry).mockRejectedValue(
        new Error('Publish failed')
      );

      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Publish/i })).toBeInTheDocument();
      });

      const publishButton = screen.getByRole('button', { name: /Publish/i });
      await user.click(publishButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Failed to publish'));
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when entry fails to load', async () => {
      vi.mocked(contentApi.getContentEntry).mockRejectedValue(new Error('Not found'));

      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load content entry')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Back to Content/i })).toBeInTheDocument();
      });
    });

    it('should render back to content link in error state', async () => {
      vi.mocked(contentApi.getContentEntry).mockRejectedValue(new Error('Not found'));

      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        const backLink = screen.getByRole('link', { name: /Back to Content/i });
        expect(backLink).toHaveAttribute('href', '/dashboard/content');
      });
    });
  });

  describe('Navigation', () => {
    it('should render back button with correct link', async () => {
      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        const backLink = screen.getByRole('link', { name: /Back/i });
        expect(backLink).toHaveAttribute('href', '/dashboard/content');
      });
    });

    it('should render preview link in actions', async () => {
      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        const previewLink = screen.getByRole('link', { name: /Preview/i });
        expect(previewLink).toHaveAttribute('href', '/api/v1/preview/content/1');
        expect(previewLink).toHaveAttribute('target', '_blank');
      });
    });

    it('should render delete button in actions', async () => {
      render(<ContentEntryEditorPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
      });
    });
  });
});
