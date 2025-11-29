import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RichTextEditor from './rich-text-editor';

// Create mock functions for the chain
const mockRun = vi.fn();
const mockToggleBold = vi.fn(() => ({ run: mockRun }));
const mockToggleItalic = vi.fn(() => ({ run: mockRun }));
const mockToggleUnderline = vi.fn(() => ({ run: mockRun }));
const mockToggleStrike = vi.fn(() => ({ run: mockRun }));
const mockToggleHeading = vi.fn(() => ({ run: mockRun }));
const mockToggleBulletList = vi.fn(() => ({ run: mockRun }));
const mockToggleOrderedList = vi.fn(() => ({ run: mockRun }));
const mockToggleBlockquote = vi.fn(() => ({ run: mockRun }));
const mockToggleCodeBlock = vi.fn(() => ({ run: mockRun }));
const mockToggleSubscript = vi.fn(() => ({ run: mockRun }));
const mockToggleSuperscript = vi.fn(() => ({ run: mockRun }));
const mockSetTextAlign = vi.fn(() => ({ run: mockRun }));
const mockSetLink = vi.fn(() => ({ run: mockRun }));
const mockSetImage = vi.fn(() => ({ run: mockRun }));
const mockSetColor = vi.fn(() => ({ run: mockRun }));
const mockSetHighlight = vi.fn(() => ({ run: mockRun }));
const mockSetHorizontalRule = vi.fn(() => ({ run: mockRun }));
const mockInsertTable = vi.fn(() => ({ run: mockRun }));
const mockAddColumnBefore = vi.fn(() => ({ run: mockRun }));
const mockAddColumnAfter = vi.fn(() => ({ run: mockRun }));
const mockDeleteColumn = vi.fn(() => ({ run: mockRun }));
const mockAddRowBefore = vi.fn(() => ({ run: mockRun }));
const mockAddRowAfter = vi.fn(() => ({ run: mockRun }));
const mockDeleteRow = vi.fn(() => ({ run: mockRun }));
const mockDeleteTable = vi.fn(() => ({ run: mockRun }));
const mockInsertContent = vi.fn(() => ({ run: mockRun }));
const mockUndo = vi.fn(() => ({ run: mockRun }));
const mockRedo = vi.fn(() => ({ run: mockRun }));

const mockFocus = vi.fn(() => ({
  toggleBold: mockToggleBold,
  toggleItalic: mockToggleItalic,
  toggleUnderline: mockToggleUnderline,
  toggleStrike: mockToggleStrike,
  toggleHeading: mockToggleHeading,
  toggleBulletList: mockToggleBulletList,
  toggleOrderedList: mockToggleOrderedList,
  toggleBlockquote: mockToggleBlockquote,
  toggleCodeBlock: mockToggleCodeBlock,
  toggleSubscript: mockToggleSubscript,
  toggleSuperscript: mockToggleSuperscript,
  setTextAlign: mockSetTextAlign,
  setLink: mockSetLink,
  setImage: mockSetImage,
  setColor: mockSetColor,
  setHighlight: mockSetHighlight,
  setHorizontalRule: mockSetHorizontalRule,
  insertTable: mockInsertTable,
  addColumnBefore: mockAddColumnBefore,
  addColumnAfter: mockAddColumnAfter,
  deleteColumn: mockDeleteColumn,
  addRowBefore: mockAddRowBefore,
  addRowAfter: mockAddRowAfter,
  deleteRow: mockDeleteRow,
  deleteTable: mockDeleteTable,
  insertContent: mockInsertContent,
  undo: mockUndo,
  redo: mockRedo,
}));

const mockChain = vi.fn(() => ({ focus: mockFocus }));

// Mock TipTap editor
const mockEditor = {
  getHTML: vi.fn(() => '<p>Test content</p>'),
  isActive: vi.fn((type, attrs) => {
    if (type === 'heading' && attrs?.level === 1) return false;
    if (type === 'heading' && attrs?.level === 2) return false;
    if (type === 'bold') return false;
    if (type === 'italic') return false;
    if (type === 'underline') return false;
    if (type === 'strike') return false;
    if (type === 'bulletList') return false;
    if (type === 'orderedList') return false;
    if (type === 'blockquote') return false;
    if (type === 'codeBlock') return false;
    if (type === 'link') return false;
    if (type === 'subscript') return false;
    if (type === 'superscript') return false;
    if (type === 'table') return false;
    if (attrs?.textAlign === 'left') return true;
    if (attrs?.textAlign === 'center') return false;
    if (attrs?.textAlign === 'right') return false;
    if (attrs?.textAlign === 'justify') return false;
    return false;
  }),
  can: vi.fn(() => ({
    undo: vi.fn(() => true),
    redo: vi.fn(() => true),
  })),
  chain: mockChain,
};

vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn(() => mockEditor),
  EditorContent: ({ editor }: any) => (
    <div data-testid="editor-content" className="ProseMirror">
      {editor ? 'Editor loaded' : null}
    </div>
  ),
}));

// Mock TipTap extensions
vi.mock('@tiptap/starter-kit', () => ({
  default: {
    configure: vi.fn(() => ({})),
  },
}));

vi.mock('@tiptap/extension-link', () => ({
  default: {
    configure: vi.fn(() => ({})),
  },
}));

vi.mock('@tiptap/extension-image', () => ({
  default: {},
}));

vi.mock('@tiptap/extension-placeholder', () => ({
  default: {
    configure: vi.fn(() => ({})),
  },
}));

vi.mock('@tiptap/extension-text-align', () => ({
  default: {
    configure: vi.fn(() => ({})),
  },
}));

vi.mock('@tiptap/extension-text-style', () => ({
  TextStyle: {},
}));

vi.mock('@tiptap/extension-color', () => ({
  Color: {},
}));

vi.mock('@tiptap/extension-highlight', () => ({
  default: {
    configure: vi.fn(() => ({})),
  },
}));

vi.mock('@tiptap/extension-underline', () => ({
  default: {},
}));

vi.mock('@tiptap/extension-strike', () => ({
  Strike: {},
}));

vi.mock('@tiptap/extension-subscript', () => ({
  default: {},
}));

vi.mock('@tiptap/extension-superscript', () => ({
  default: {},
}));

vi.mock('@tiptap/extension-code-block-lowlight', () => ({
  default: {
    configure: vi.fn(() => ({})),
  },
}));

vi.mock('@tiptap/extension-table', () => ({
  Table: {
    configure: vi.fn(() => ({})),
  },
}));

vi.mock('@tiptap/extension-table-row', () => ({
  TableRow: {},
}));

vi.mock('@tiptap/extension-table-cell', () => ({
  TableCell: {},
}));

vi.mock('@tiptap/extension-table-header', () => ({
  TableHeader: {},
}));

vi.mock('@tiptap/extension-horizontal-rule', () => ({
  default: {},
}));

vi.mock('@tiptap/extension-typography', () => ({
  default: {},
}));

vi.mock('lowlight', () => ({
  common: {},
  createLowlight: vi.fn(() => ({})),
}));

vi.mock('@/lib/tiptap-extensions', () => ({
  Callout: {},
  Details: {},
}));

describe('RichTextEditor', () => {
  const mockOnChange = vi.fn();
  const mockOnImageAdd = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockRun.mockClear();
    mockToggleBold.mockClear();
    mockToggleItalic.mockClear();
    mockToggleUnderline.mockClear();
    mockToggleStrike.mockClear();
    mockToggleHeading.mockClear();
    mockToggleBulletList.mockClear();
    mockToggleOrderedList.mockClear();
    mockToggleBlockquote.mockClear();
    mockToggleCodeBlock.mockClear();
    mockToggleSubscript.mockClear();
    mockToggleSuperscript.mockClear();
    mockSetTextAlign.mockClear();
    mockSetLink.mockClear();
    mockSetImage.mockClear();
    mockSetColor.mockClear();
    mockSetHighlight.mockClear();
    mockSetHorizontalRule.mockClear();
    mockInsertTable.mockClear();
    mockAddColumnBefore.mockClear();
    mockAddColumnAfter.mockClear();
    mockDeleteColumn.mockClear();
    mockAddRowBefore.mockClear();
    mockAddRowAfter.mockClear();
    mockDeleteRow.mockClear();
    mockDeleteTable.mockClear();
    mockInsertContent.mockClear();
    mockUndo.mockClear();
    mockRedo.mockClear();
    mockFocus.mockClear();
    mockChain.mockClear();
  });

  describe('Initial Rendering', () => {
    it('should render editor with toolbar', () => {
      render(
        <RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />
      );

      expect(screen.getByTestId('editor-content')).toBeInTheDocument();
      expect(screen.getByText('Editor loaded')).toBeInTheDocument();
    });

    it('should render with placeholder prop', () => {
      render(
        <RichTextEditor
          content=""
          onChange={mockOnChange}
          placeholder="Custom placeholder"
        />
      );

      expect(screen.getByTestId('editor-content')).toBeInTheDocument();
    });

    it('should render editor content div', () => {
      render(
        <RichTextEditor content="" onChange={mockOnChange} />
      );

      expect(screen.getByTestId('editor-content')).toBeInTheDocument();
    });
  });

  describe('Text Formatting Buttons', () => {
    it('should render bold button and toggle bold', async () => {
      const user = userEvent.setup();
      render(
        <RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />
      );

      const boldButton = screen.getByTitle('Bold (Ctrl+B)');
      expect(boldButton).toBeInTheDocument();

      await user.click(boldButton);

      expect(mockToggleBold).toHaveBeenCalled();
      expect(mockRun).toHaveBeenCalled();
    });

    it('should render italic button and toggle italic', async () => {
      const user = userEvent.setup();
      render(
        <RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />
      );

      const italicButton = screen.getByTitle('Italic (Ctrl+I)');
      await user.click(italicButton);

      expect(mockToggleItalic).toHaveBeenCalled();
    });

    it('should render underline button and toggle underline', async () => {
      const user = userEvent.setup();
      render(
        <RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />
      );

      const underlineButton = screen.getByTitle('Underline (Ctrl+U)');
      await user.click(underlineButton);

      expect(mockToggleUnderline).toHaveBeenCalled();
    });

    it('should render strikethrough button and toggle strike', async () => {
      const user = userEvent.setup();
      render(
        <RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />
      );

      const strikeButton = screen.getByTitle('Strikethrough');
      await user.click(strikeButton);

      expect(mockToggleStrike).toHaveBeenCalled();
    });
  });

  describe('Heading Buttons', () => {
    it('should toggle heading level 1', async () => {
      const user = userEvent.setup();
      render(
        <RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />
      );

      const h1Button = screen.getByTitle('Heading 1');
      await user.click(h1Button);

      expect(mockToggleHeading).toHaveBeenCalledWith({
        level: 1,
      });
    });

    it('should toggle heading level 2', async () => {
      const user = userEvent.setup();
      render(
        <RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />
      );

      const h2Button = screen.getByTitle('Heading 2');
      await user.click(h2Button);

      expect(mockToggleHeading).toHaveBeenCalledWith({
        level: 2,
      });
    });
  });

  describe('List Buttons', () => {
    it('should toggle bullet list', async () => {
      const user = userEvent.setup();
      render(
        <RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />
      );

      const bulletListButton = screen.getByTitle('Bullet List');
      await user.click(bulletListButton);

      expect(mockToggleBulletList).toHaveBeenCalled();
    });

    it('should toggle ordered list', async () => {
      const user = userEvent.setup();
      render(
        <RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />
      );

      const orderedListButton = screen.getByTitle('Numbered List');
      await user.click(orderedListButton);

      expect(mockToggleOrderedList).toHaveBeenCalled();
    });

    it('should toggle blockquote', async () => {
      const user = userEvent.setup();
      render(
        <RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />
      );

      const quoteButton = screen.getByTitle('Quote');
      await user.click(quoteButton);

      expect(mockToggleBlockquote).toHaveBeenCalled();
    });

    it('should toggle code block', async () => {
      const user = userEvent.setup();
      render(
        <RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />
      );

      const codeButton = screen.getByTitle('Code Block');
      await user.click(codeButton);

      expect(mockToggleCodeBlock).toHaveBeenCalled();
    });
  });

  describe('Text Alignment', () => {
    it('should set text align left', async () => {
      const user = userEvent.setup();
      render(
        <RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />
      );

      const alignLeftButton = screen.getByTitle('Align Left');
      await user.click(alignLeftButton);

      expect(mockSetTextAlign).toHaveBeenCalledWith(
        'left'
      );
    });

    it('should set text align center', async () => {
      const user = userEvent.setup();
      render(
        <RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />
      );

      const alignCenterButton = screen.getByTitle('Align Center');
      await user.click(alignCenterButton);

      expect(mockSetTextAlign).toHaveBeenCalledWith(
        'center'
      );
    });

    it('should set text align right', async () => {
      const user = userEvent.setup();
      render(
        <RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />
      );

      const alignRightButton = screen.getByTitle('Align Right');
      await user.click(alignRightButton);

      expect(mockSetTextAlign).toHaveBeenCalledWith(
        'right'
      );
    });

    it('should set text align justify', async () => {
      const user = userEvent.setup();
      render(
        <RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />
      );

      const justifyButton = screen.getByTitle('Justify');
      await user.click(justifyButton);

      expect(mockSetTextAlign).toHaveBeenCalledWith(
        'justify'
      );
    });
  });

  describe('Color and Highlight', () => {
    it('should show color picker when palette button clicked', async () => {
      const user = userEvent.setup();
      render(
        <RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />
      );

      const colorButton = screen.getByTitle('Text Color');
      await user.click(colorButton);

      // Color picker should be visible
      await waitFor(() => {
        const colorButtons = document.querySelectorAll(
          'button[style*="background-color"]'
        );
        expect(colorButtons.length).toBeGreaterThan(0);
      });
    });

    it('should apply text color when color selected', async () => {
      const user = userEvent.setup();
      render(
        <RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />
      );

      const colorButton = screen.getByTitle('Text Color');
      await user.click(colorButton);

      await waitFor(() => {
        const colorButtons = document.querySelectorAll(
          'button[style*="background-color"]'
        );
        expect(colorButtons.length).toBeGreaterThan(0);
      });

      const firstColorButton = document.querySelector(
        'button[style*="background-color"]'
      ) as HTMLElement;
      await user.click(firstColorButton);

      expect(mockSetColor).toHaveBeenCalled();
    });

    it('should show highlight picker when highlighter button clicked', async () => {
      const user = userEvent.setup();
      render(
        <RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />
      );

      const highlightButton = screen.getByTitle('Highlight Color');
      await user.click(highlightButton);

      await waitFor(() => {
        const colorButtons = document.querySelectorAll(
          'button[style*="background-color"]'
        );
        expect(colorButtons.length).toBeGreaterThan(0);
      });
    });

    it('should apply highlight color when color selected', async () => {
      const user = userEvent.setup();
      render(
        <RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />
      );

      const highlightButton = screen.getByTitle('Highlight Color');
      await user.click(highlightButton);

      await waitFor(async () => {
        const colorButtons = document.querySelectorAll(
          'button[style*="background-color"]'
        );
        if (colorButtons.length > 0) {
          await user.click(colorButtons[0] as HTMLElement);
        }
      });

      expect(mockSetHighlight).toHaveBeenCalled();
    });
  });

  describe('Special Characters', () => {
    it('should toggle subscript', async () => {
      const user = userEvent.setup();
      render(
        <RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />
      );

      const subscriptButton = screen.getByTitle('Subscript');
      await user.click(subscriptButton);

      expect(mockToggleSubscript).toHaveBeenCalled();
    });

    it('should toggle superscript', async () => {
      const user = userEvent.setup();
      render(
        <RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />
      );

      const superscriptButton = screen.getByTitle('Superscript');
      await user.click(superscriptButton);

      expect(mockToggleSuperscript).toHaveBeenCalled();
    });
  });

  describe('Table Operations', () => {
    it('should insert table', async () => {
      const user = userEvent.setup();
      render(
        <RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />
      );

      const tableButton = screen.getByTitle('Insert Table');
      await user.click(tableButton);

      expect(mockInsertTable).toHaveBeenCalledWith({
        rows: 3,
        cols: 3,
        withHeaderRow: true,
      });
    });

    it('should not show table controls when table not active', () => {
      render(
        <RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />
      );

      expect(screen.queryByTitle('Add Column Before')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Delete Table')).not.toBeInTheDocument();
    });

    it('should show table controls when table is active', () => {
      mockEditor.isActive.mockImplementation((type) => type === 'table');

      render(
        <RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />
      );

      expect(screen.getByTitle('Add Column Before')).toBeInTheDocument();
      expect(screen.getByTitle('Add Column After')).toBeInTheDocument();
      expect(screen.getByTitle('Delete Column')).toBeInTheDocument();
      expect(screen.getByTitle('Add Row Before')).toBeInTheDocument();
      expect(screen.getByTitle('Add Row After')).toBeInTheDocument();
      expect(screen.getByTitle('Delete Row')).toBeInTheDocument();
      expect(screen.getByTitle('Delete Table')).toBeInTheDocument();

      mockEditor.isActive.mockReset();
    });
  });

  describe('Link and Image', () => {
    it('should prompt for URL and insert link', async () => {
      const user = userEvent.setup();
      const promptSpy = vi.spyOn(window, 'prompt');
      promptSpy.mockReturnValue('https://example.com');

      render(
        <RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />
      );

      const linkButton = screen.getByTitle('Insert Link');
      await user.click(linkButton);

      expect(promptSpy).toHaveBeenCalledWith('Enter URL:');
      expect(mockSetLink).toHaveBeenCalledWith({
        href: 'https://example.com',
      });

      promptSpy.mockRestore();
    });

    it('should not insert link if prompt cancelled', async () => {
      const user = userEvent.setup();
      const promptSpy = vi.spyOn(window, 'prompt');
      promptSpy.mockReturnValue(null);

      render(
        <RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />
      );

      const linkButton = screen.getByTitle('Insert Link');
      await user.click(linkButton);

      expect(mockSetLink).not.toHaveBeenCalled();

      promptSpy.mockRestore();
    });

    it('should call onImageAdd callback when provided', async () => {
      const user = userEvent.setup();
      render(
        <RichTextEditor
          content="<p>Test</p>"
          onChange={mockOnChange}
          onImageAdd={mockOnImageAdd}
        />
      );

      const imageButton = screen.getByTitle('Insert Image');
      await user.click(imageButton);

      expect(mockOnImageAdd).toHaveBeenCalled();
    });

    it('should prompt for image URL when onImageAdd not provided', async () => {
      const user = userEvent.setup();
      const promptSpy = vi.spyOn(window, 'prompt');
      promptSpy.mockReturnValue('https://example.com/image.jpg');

      render(
        <RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />
      );

      const imageButton = screen.getByTitle('Insert Image');
      await user.click(imageButton);

      expect(promptSpy).toHaveBeenCalledWith('Enter image URL:');
      expect(mockSetImage).toHaveBeenCalledWith({
        src: 'https://example.com/image.jpg',
      });

      promptSpy.mockRestore();
    });
  });

  describe('Other Insertions', () => {
    it('should insert horizontal rule', async () => {
      const user = userEvent.setup();
      render(
        <RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />
      );

      const hrButton = screen.getByTitle('Horizontal Rule');
      await user.click(hrButton);

      expect(mockSetHorizontalRule).toHaveBeenCalled();
    });

    it('should insert info callout', async () => {
      const user = userEvent.setup();
      render(
        <RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />
      );

      const infoButton = screen.getByTitle('Insert Info Callout');
      await user.click(infoButton);

      expect(mockInsertContent).toHaveBeenCalled();
      expect(mockInsertContent.mock.calls.length).toBeGreaterThan(0);
      const callArg = (mockInsertContent.mock.calls as any)[0][0];
      expect(callArg).toContain('data-type="info"');
    });

    it('should insert warning callout', async () => {
      const user = userEvent.setup();
      render(
        <RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />
      );

      const warningButton = screen.getByTitle('Insert Warning Callout');
      await user.click(warningButton);

      expect(mockInsertContent).toHaveBeenCalled();
      expect(mockInsertContent.mock.calls.length).toBeGreaterThan(0);
      const callArg = (mockInsertContent.mock.calls as any)[0][0];
      expect(callArg).toContain('data-type="warning"');
    });
  });

  describe('History Controls', () => {
    it('should undo when undo button clicked', async () => {
      const user = userEvent.setup();
      render(
        <RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />
      );

      const undoButton = screen.getByTitle('Undo');
      await user.click(undoButton);

      expect(mockUndo).toHaveBeenCalled();
    });

    it('should redo when redo button clicked', async () => {
      const user = userEvent.setup();
      render(
        <RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />
      );

      const redoButton = screen.getByTitle('Redo');
      await user.click(redoButton);

      expect(mockRedo).toHaveBeenCalled();
    });

    it('should disable undo when cannot undo', () => {
      mockEditor.can.mockReturnValue({
        undo: vi.fn(() => false),
        redo: vi.fn(() => true),
      });

      render(
        <RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />
      );

      const undoButton = screen.getByTitle('Undo');
      expect(undoButton).toBeDisabled();

      mockEditor.can.mockReset();
    });

    it('should disable redo when cannot redo', () => {
      mockEditor.can.mockReturnValue({
        undo: vi.fn(() => true),
        redo: vi.fn(() => false),
      });

      render(
        <RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />
      );

      const redoButton = screen.getByTitle('Redo');
      expect(redoButton).toBeDisabled();

      mockEditor.can.mockReset();
    });
  });

  describe('Active State Styling', () => {
    it('should apply active class to bold button when bold is active', () => {
      mockEditor.isActive.mockImplementation((type) => type === 'bold');

      render(
        <RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />
      );

      const boldButton = screen.getByTitle('Bold (Ctrl+B)');
      expect(boldButton).toHaveClass('bg-muted');

      mockEditor.isActive.mockReset();
    });

    it('should apply active class to heading 1 when active', () => {
      mockEditor.isActive.mockImplementation(
        (type, attrs) => type === 'heading' && attrs?.level === 1
      );

      render(
        <RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />
      );

      const h1Button = screen.getByTitle('Heading 1');
      expect(h1Button).toHaveClass('bg-muted');

      mockEditor.isActive.mockReset();
    });

    it('should apply active class to link button when link is active', () => {
      mockEditor.isActive.mockImplementation((type) => type === 'link');

      render(
        <RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />
      );

      const linkButton = screen.getByTitle('Insert Link');
      expect(linkButton).toHaveClass('bg-muted');

      mockEditor.isActive.mockReset();
    });
  });

  describe('Content Updates', () => {
    it('should render with initial content', () => {
      render(
        <RichTextEditor content="<p>Test</p>" onChange={mockOnChange} />
      );

      expect(screen.getByTestId('editor-content')).toBeInTheDocument();
    });
  });
});
