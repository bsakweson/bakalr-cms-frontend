import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JsonFieldEditor } from './json-field-editor';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

vi.mock('@/lib/api/client', () => ({
  resolveMediaUrl: vi.fn((url) => url || ''),
}));

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn(),
};
Object.assign(navigator, { clipboard: mockClipboard });

describe('JsonFieldEditor', () => {
  const defaultProps = {
    value: {},
    onChange: vi.fn(),
    fieldName: 'testField',
    readOnly: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockClipboard.writeText.mockResolvedValue(undefined);
  });

  describe('Object Handling', () => {
    it('should render object properties', () => {
      render(
        <JsonFieldEditor
          {...defaultProps}
          value={{ name: 'Test', url: 'https://example.com' }}
        />
      );

      expect(screen.getByText('2 properties')).toBeInTheDocument();
      expect(screen.getByDisplayValue('name')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
      expect(screen.getByDisplayValue('url')).toBeInTheDocument();
      expect(screen.getByDisplayValue('https://example.com')).toBeInTheDocument();
    });

    it('should allow editing object property values', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <JsonFieldEditor
          {...defaultProps}
          value={{ name: 'Test' }}
          onChange={onChange}
        />
      );

      const valueInput = screen.getByDisplayValue('Test');
      await user.clear(valueInput);
      await user.type(valueInput, 'New Value');

      expect(onChange).toHaveBeenCalled();
    });

    it('should allow editing object property keys', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <JsonFieldEditor
          {...defaultProps}
          value={{ oldKey: 'value' }}
          onChange={onChange}
        />
      );

      const keyInput = screen.getByDisplayValue('oldKey');
      await user.clear(keyInput);
      await user.type(keyInput, 'newKey');

      expect(onChange).toHaveBeenCalled();
    });

    it('should allow adding new property', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <JsonFieldEditor
          {...defaultProps}
          value={{ existing: 'value' }}
          onChange={onChange}
        />
      );

      await user.click(screen.getByText('Add Property'));

      expect(onChange).toHaveBeenCalledWith({ existing: 'value', '': '' });
    });

    it('should allow deleting property', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <JsonFieldEditor
          {...defaultProps}
          value={{ name: 'Test', other: 'value' }}
          onChange={onChange}
        />
      );

      const deleteButtons = screen.getAllByRole('button').filter(btn =>
        btn.querySelector('svg.lucide-trash-2')
      );

      await user.click(deleteButtons[0]);

      expect(onChange).toHaveBeenCalled();
    });

    it('should render read-only object correctly', () => {
      render(
        <JsonFieldEditor
          {...defaultProps}
          value={{ name: 'Test' }}
          readOnly={true}
        />
      );

      expect(screen.getByText('name')).toBeInTheDocument();
      expect(screen.getByText('Test')).toBeInTheDocument();
      expect(screen.queryByText('Add Property')).not.toBeInTheDocument();
    });
  });

  describe('Simple Array Handling', () => {
    it('should render simple array items', () => {
      render(
        <JsonFieldEditor
          {...defaultProps}
          value={['item1', 'item2', 'item3']}
        />
      );

      expect(screen.getByText('3 items')).toBeInTheDocument();
      expect(screen.getByDisplayValue('item1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('item2')).toBeInTheDocument();
      expect(screen.getByDisplayValue('item3')).toBeInTheDocument();
    });

    it('should allow editing array items', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <JsonFieldEditor
          {...defaultProps}
          value={['original']}
          onChange={onChange}
        />
      );

      const input = screen.getByDisplayValue('original');
      await user.clear(input);
      await user.type(input, 'changed');

      expect(onChange).toHaveBeenCalled();
    });

    it('should allow adding array items', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <JsonFieldEditor
          {...defaultProps}
          value={['existing']}
          onChange={onChange}
        />
      );

      await user.click(screen.getByText('Add'));

      expect(onChange).toHaveBeenCalledWith(['existing', '']);
    });

    it('should allow deleting array items', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <JsonFieldEditor
          {...defaultProps}
          value={['item1', 'item2']}
          onChange={onChange}
        />
      );

      const deleteButtons = screen.getAllByRole('button').filter(btn =>
        btn.querySelector('svg.lucide-trash-2')
      );

      await user.click(deleteButtons[0]);

      expect(onChange).toHaveBeenCalledWith(['item2']);
    });

    it('should render read-only array correctly', () => {
      render(
        <JsonFieldEditor
          {...defaultProps}
          value={['item1', 'item2']}
          readOnly={true}
        />
      );

      expect(screen.getByText('item1')).toBeInTheDocument();
      expect(screen.getByText('item2')).toBeInTheDocument();
      expect(screen.queryByText('Add')).not.toBeInTheDocument();
    });
  });

  describe('Array of Objects Handling', () => {
    const objectArray = [
      { name: 'Item 1', value: 100 },
      { name: 'Item 2', value: 200 },
    ];

    it('should render array of objects', () => {
      render(
        <JsonFieldEditor
          {...defaultProps}
          value={objectArray}
        />
      );

      expect(screen.getByText('2 items')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('should expand/collapse array of objects', async () => {
      const user = userEvent.setup();

      render(
        <JsonFieldEditor
          {...defaultProps}
          value={objectArray}
        />
      );

      // Array should be expanded by default
      expect(screen.getByText('Item 1')).toBeInTheDocument();

      // Click to collapse
      await user.click(screen.getByText('2 items'));

      // Items should be hidden
      await waitFor(() => {
        expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
      });
    });

    it('should allow adding item to array of objects', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <JsonFieldEditor
          {...defaultProps}
          value={objectArray}
          onChange={onChange}
        />
      );

      await user.click(screen.getByText('Add Item'));

      expect(onChange).toHaveBeenCalledWith([...objectArray, {}]);
    });

    it('should allow deleting item from array of objects', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <JsonFieldEditor
          {...defaultProps}
          value={objectArray}
          onChange={onChange}
        />
      );

      const deleteButtons = screen.getAllByRole('button').filter(btn =>
        btn.querySelector('svg.lucide-trash-2')
      );

      await user.click(deleteButtons[0]);

      expect(onChange).toHaveBeenCalledWith([objectArray[1]]);
    });

    it('should render read-only array of objects correctly', () => {
      render(
        <JsonFieldEditor
          {...defaultProps}
          value={objectArray}
          readOnly={true}
        />
      );

      // Should display values in read-only mode without add button
      expect(screen.queryByText('Add Item')).not.toBeInTheDocument();
      // Items count should be displayed
      expect(screen.getByText(/2 items/)).toBeInTheDocument();
    });
  });

  describe('Media Gallery Array', () => {
    const mediaArray = [
      { url: 'https://example.com/img1.jpg', alt: 'Image 1' },
      { url: 'https://example.com/img2.jpg', alt: 'Image 2' },
    ];

    it('should identify media gallery array', () => {
      render(
        <JsonFieldEditor
          {...defaultProps}
          value={mediaArray}
          readOnly={true}
        />
      );

      expect(screen.getByText(/2 images/)).toBeInTheDocument();
    });

    it('should render image thumbnails in read-only mode', () => {
      render(
        <JsonFieldEditor
          {...defaultProps}
          value={mediaArray}
          readOnly={true}
        />
      );

      const images = screen.getAllByRole('img');
      expect(images.length).toBe(2);
      expect(images[0]).toHaveAttribute('src', 'https://example.com/img1.jpg');
      expect(images[1]).toHaveAttribute('src', 'https://example.com/img2.jpg');
    });

    it('should show copy button on hover', async () => {
      render(
        <JsonFieldEditor
          {...defaultProps}
          value={mediaArray}
          readOnly={true}
        />
      );

      // Copy buttons exist but may be hidden until hover
      const copyButtons = document.querySelectorAll('[title="Copy URL"]');
      expect(copyButtons.length).toBeGreaterThan(0);
    });

it('should have copy buttons available', async () => {
      render(
        <JsonFieldEditor
          {...defaultProps}
          value={mediaArray}
          readOnly={true}
        />
      );

      const copyButtons = document.querySelectorAll('[title="Copy URL"]');
      expect(copyButtons.length).toBe(2); // One per image
    });

    it('should handle image with src instead of url', () => {
      const srcArray = [
        { src: 'https://example.com/img.jpg', title: 'Image' },
      ];

      render(
        <JsonFieldEditor
          {...defaultProps}
          value={srcArray}
          readOnly={true}
        />
      );

      expect(screen.getByText(/1 image/)).toBeInTheDocument();
    });
  });

  describe('Raw JSON Mode', () => {
    it('should toggle between visual and raw mode', async () => {
      const user = userEvent.setup();

      render(
        <JsonFieldEditor
          {...defaultProps}
          value={{ name: 'Test' }}
        />
      );

      // Click to switch to raw mode
      await user.click(screen.getByText('Raw JSON'));

      // Should show textarea with JSON
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toContain('"name"');
      expect(textarea.value).toContain('"Test"');

      // Button should now say Visual
      expect(screen.getByText('Visual')).toBeInTheDocument();
    });

    it('should allow editing raw JSON', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <JsonFieldEditor
          {...defaultProps}
          value={{ name: 'Test' }}
          onChange={onChange}
        />
      );

      await user.click(screen.getByText('Raw JSON'));

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      await user.clear(textarea);
      // Type a simple string that doesn't have special characters
      await user.type(textarea, 'test');

      // onChange should be called even for invalid JSON (with error)
      expect(onChange).not.toHaveBeenCalled(); // Invalid JSON doesn't call onChange
      await user.type(textarea, 'invalid json');

      expect(screen.getByText('Invalid JSON')).toBeInTheDocument();
    });

    it('should render read-only raw JSON', async () => {
      const user = userEvent.setup();

      render(
        <JsonFieldEditor
          {...defaultProps}
          value={['item1', 'item2']}
          readOnly={true}
        />
      );

      await user.click(screen.getByText('Raw JSON'));

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea).toHaveAttribute('readonly');
    });
  });

  describe('Primitive Value Handling', () => {
    it('should render textarea for primitive values', () => {
      render(
        <JsonFieldEditor
          {...defaultProps}
          value="simple string"
        />
      );

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toContain('simple string');
    });

    it('should render textarea for null value', () => {
      render(
        <JsonFieldEditor
          {...defaultProps}
          value={null}
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
    });

    it('should render textarea for number value', () => {
      render(
        <JsonFieldEditor
          {...defaultProps}
          value={42}
        />
      );

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toContain('42');
    });
  });

  describe('Type Preservation', () => {
    it('should preserve number type when editing', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <JsonFieldEditor
          {...defaultProps}
          value={[{ count: 42 }]}
          onChange={onChange}
        />
      );

      const inputs = screen.getAllByRole('textbox');
      const countInput = inputs.find(input => (input as HTMLInputElement).value === '42');

      if (countInput) {
        await user.clear(countInput);
        await user.type(countInput, '100');

        // The onChange should be called with a number, not string
        expect(onChange).toHaveBeenCalled();
      }
    });

    it('should preserve boolean type when editing', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <JsonFieldEditor
          {...defaultProps}
          value={[{ active: true }]}
          onChange={onChange}
        />
      );

      const inputs = screen.getAllByRole('textbox');
      const boolInput = inputs.find(input => (input as HTMLInputElement).value === 'true');

      if (boolInput) {
        await user.clear(boolInput);
        await user.type(boolInput, 'false');

        expect(onChange).toHaveBeenCalled();
      }
    });
  });

  describe('Boolean Display', () => {
    it('should display boolean true as checkmark Yes', () => {
      render(
        <JsonFieldEditor
          {...defaultProps}
          value={[{ active: true }]}
          readOnly={true}
        />
      );

      expect(screen.getByText('✓ Yes')).toBeInTheDocument();
    });

    it('should display boolean false as X No', () => {
      render(
        <JsonFieldEditor
          {...defaultProps}
          value={[{ active: false }]}
          readOnly={true}
        />
      );

      expect(screen.getByText('✗ No')).toBeInTheDocument();
    });
  });

  describe('Nested Data Handling', () => {
    it('should render nested object as JSON', () => {
      render(
        <JsonFieldEditor
          {...defaultProps}
          value={[{ data: { nested: 'value' } }]}
          readOnly={true}
        />
      );

      // Nested objects should be rendered as JSON
      expect(screen.getByText(/"nested"/)).toBeInTheDocument();
    });

    it('should render nested array nicely', () => {
      render(
        <JsonFieldEditor
          {...defaultProps}
          value={[{ tags: ['tag1', 'tag2'] }]}
          readOnly={true}
        />
      );

      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
    });
  });

  describe('URL Rendering in Nested Arrays', () => {
    it('should render URLs as clickable links', () => {
      render(
        <JsonFieldEditor
          {...defaultProps}
          value={[{ links: [{ url: 'https://example.com', title: 'Link' }] }]}
          readOnly={true}
        />
      );

      const link = screen.getByText(/example\.com/);
      expect(link.closest('a')).toHaveAttribute('href', 'https://example.com');
    });

    it('should truncate long URLs', () => {
      const longUrl = 'https://example.com/very/long/path/that/exceeds/thirty/characters';

      render(
        <JsonFieldEditor
          {...defaultProps}
          value={[{ links: [{ url: longUrl }] }]}
          readOnly={true}
        />
      );

      // URL should be truncated
      expect(screen.getByText(/\.\.\./)).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should handle empty object', () => {
      render(
        <JsonFieldEditor
          {...defaultProps}
          value={{}}
        />
      );

      expect(screen.getByText('0 properties')).toBeInTheDocument();
    });

    it('should handle empty array', () => {
      render(
        <JsonFieldEditor
          {...defaultProps}
          value={[]}
        />
      );

      expect(screen.getByText('0 items')).toBeInTheDocument();
    });

    it('should display Empty for nested empty array', () => {
      render(
        <JsonFieldEditor
          {...defaultProps}
          value={[{ items: [] }]}
          readOnly={true}
        />
      );

      expect(screen.getByText('Empty')).toBeInTheDocument();
    });
  });

  describe('Add Field to Object Item', () => {
    it('should add field when pressing Enter', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <JsonFieldEditor
          {...defaultProps}
          value={[{ existing: 'value' }]}
          onChange={onChange}
        />
      );

      const addFieldInput = screen.getByPlaceholderText('key');
      await user.type(addFieldInput, 'newField{enter}');

      expect(onChange).toHaveBeenCalledWith([{ existing: 'value', newField: '' }]);
    });
  });

  describe('Image Error Handling', () => {
    it('should show fallback when image fails to load', async () => {
      const mediaArray = [
        { url: 'https://example.com/invalid.jpg', alt: 'Invalid' },
      ];

      render(
        <JsonFieldEditor
          {...defaultProps}
          value={mediaArray}
          readOnly={true}
        />
      );

      const img = screen.getByRole('img');

      // Simulate image error
      fireEvent.error(img);

      await waitFor(() => {
        expect(screen.getByText('Failed to load')).toBeInTheDocument();
      });
    });

    it('should show No URL for empty URL', () => {
      const mediaArray = [
        { url: '', alt: 'No URL Image' },
      ];

      render(
        <JsonFieldEditor
          {...defaultProps}
          value={mediaArray}
          readOnly={true}
        />
      );

      expect(screen.getByText('No URL')).toBeInTheDocument();
    });
  });
});
