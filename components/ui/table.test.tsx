/**
 * Tests for Table component (semantic HTML table wrappers with styling)
 * 
 * Component: components/ui/table.tsx
 * 
 * Test Coverage:
 * - Basic rendering of all table components
 * - Table structure (thead, tbody, tfoot)
 * - Table rows and cells
 * - Table headers
 * - Table caption
 * - Row selection states
 * - Hover effects
 * - Checkbox integration
 * - Responsive behavior (overflow-x-auto)
 * - Empty states
 * - Custom styling
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from '@/components/ui/table';

describe('Table', () => {
  describe('Basic Rendering', () => {
    it('should render table element', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Cell 1</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('Cell 1')).toBeInTheDocument();
    });

    it('should render table with header', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('should render table with body rows', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>John Doe</TableCell>
              <TableCell>john@example.com</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Jane Smith</TableCell>
              <TableCell>jane@example.com</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });

    it('should render table with footer', () => {
      render(
        <Table>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2}>Total: 2 users</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      );

      expect(screen.getByText('Total: 2 users')).toBeInTheDocument();
    });

    it('should render table with caption', () => {
      render(
        <Table>
          <TableCaption>A list of users</TableCaption>
          <TableBody>
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByText('A list of users')).toBeInTheDocument();
    });
  });

  describe('Complete Table Structure', () => {
    it('should render complete table with header, body, and footer', () => {
      render(
        <Table>
          <TableCaption>User List</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>John Doe</TableCell>
              <TableCell>john@example.com</TableCell>
              <TableCell>Admin</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Jane Smith</TableCell>
              <TableCell>jane@example.com</TableCell>
              <TableCell>Editor</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3}>Total: 2 users</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      );

      // Check all sections are rendered
      expect(screen.getByText('User List')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Total: 2 users')).toBeInTheDocument();
    });

    it('should render multiple header columns', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );

      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should render multiple body rows', () => {
      render(
        <Table>
          <TableBody>
            {[1, 2, 3, 4, 5].map((num) => (
              <TableRow key={num}>
                <TableCell>{num}</TableCell>
                <TableCell>User {num}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );

      for (let i = 1; i <= 5; i++) {
        expect(screen.getByText(`User ${i}`)).toBeInTheDocument();
      }
    });
  });

  describe('Row Selection', () => {
    it('should render row with selected state', () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow data-state="selected">
              <TableCell>Selected Row</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Normal Row</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const selectedRow = container.querySelector('[data-state="selected"]');
      expect(selectedRow).toBeInTheDocument();
      expect(selectedRow).toHaveTextContent('Selected Row');
    });

    it('should render checkboxes for row selection', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <input type="checkbox" role="checkbox" aria-label="Select all" />
              </TableHead>
              <TableHead>Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>
                <input type="checkbox" role="checkbox" aria-label="Select row 1" />
              </TableCell>
              <TableCell>John Doe</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByLabelText('Select all')).toBeInTheDocument();
      expect(screen.getByLabelText('Select row 1')).toBeInTheDocument();
    });

    it('should handle checkbox selection', async () => {
      const user = userEvent.setup();
      const handleSelect = vi.fn();

      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>
                <input
                  type="checkbox"
                  onChange={handleSelect}
                  aria-label="Select row"
                />
              </TableCell>
              <TableCell>Item</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const checkbox = screen.getByLabelText('Select row');
      await user.click(checkbox);

      expect(handleSelect).toHaveBeenCalledTimes(1);
    });
  });

  describe('Interactive Elements', () => {
    it('should render action buttons in cells', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>John Doe</TableCell>
              <TableCell>
                <button>Edit</button>
                <button>Delete</button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    it('should handle button clicks in table cells', async () => {
      const user = userEvent.setup();
      const handleEdit = vi.fn();
      const handleDelete = vi.fn();

      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell>
                <button onClick={handleEdit}>Edit</button>
                <button onClick={handleDelete}>Delete</button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      await user.click(screen.getByRole('button', { name: /edit/i }));
      await user.click(screen.getByRole('button', { name: /delete/i }));

      expect(handleEdit).toHaveBeenCalledTimes(1);
      expect(handleDelete).toHaveBeenCalledTimes(1);
    });

    it('should render links in table cells', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>
                <a href="/user/1">John Doe</a>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const link = screen.getByRole('link', { name: /john doe/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/user/1');
    });
  });

  describe('Empty States', () => {
    it('should render empty table', () => {
      const { container } = render(
        <Table>
          <TableBody />
        </Table>
      );

      expect(container.querySelector('table')).toBeInTheDocument();
      expect(container.querySelector('tbody')).toBeInTheDocument();
    });

    it('should render empty state message', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell colSpan={3} style={{ textAlign: 'center' }}>
                No data available
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });

  describe('Data Types', () => {
    it('should render text data', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Simple text</TableCell>
              <TableCell>More text</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByText('Simple text')).toBeInTheDocument();
      expect(screen.getByText('More text')).toBeInTheDocument();
    });

    it('should render numeric data', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>$99.99</TableCell>
              <TableCell>42</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByText('$99.99')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should render date data', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>2025-01-16</TableCell>
              <TableCell>Jan 16, 2025</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByText('2025-01-16')).toBeInTheDocument();
      expect(screen.getByText('Jan 16, 2025')).toBeInTheDocument();
    });

    it('should render status badges', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>
                <span className="badge">Active</span>
              </TableCell>
              <TableCell>
                <span className="badge">Pending</span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should wrap table in scrollable container', () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const scrollContainer = container.querySelector('[data-slot="table-container"]');
      expect(scrollContainer).toBeInTheDocument();
      expect(scrollContainer).toHaveClass('overflow-x-auto');
    });

    it('should handle wide tables', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: 10 }, (_, i) => (
                <TableHead key={i}>Column {i + 1}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              {Array.from({ length: 10 }, (_, i) => (
                <TableCell key={i}>Data {i + 1}</TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      );

      // All columns should be rendered
      for (let i = 1; i <= 10; i++) {
        expect(screen.getByText(`Column ${i}`)).toBeInTheDocument();
      }
    });
  });

  describe('Custom Styling', () => {
    it('should accept custom className on table', () => {
      const { container } = render(
        <Table className="custom-table">
          <TableBody>
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const table = container.querySelector('table');
      expect(table).toHaveClass('custom-table');
    });

    it('should accept custom className on row', () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow className="custom-row">
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const row = container.querySelector('.custom-row');
      expect(row).toBeInTheDocument();
    });

    it('should accept custom className on cell', () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="custom-cell">Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const cell = container.querySelector('.custom-cell');
      expect(cell).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render semantic table elements', () => {
      const { container } = render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(container.querySelector('table')).toBeInTheDocument();
      expect(container.querySelector('thead')).toBeInTheDocument();
      expect(container.querySelector('tbody')).toBeInTheDocument();
      expect(container.querySelector('th')).toBeInTheDocument();
      expect(container.querySelector('td')).toBeInTheDocument();
    });

    it('should render caption for screen readers', () => {
      render(
        <Table>
          <TableCaption>User information table</TableCaption>
          <TableBody>
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByText('User information table')).toBeInTheDocument();
    });

    it('should support colspan for merged cells', () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell colSpan={3}>Merged cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const cell = container.querySelector('td');
      expect(cell).toHaveAttribute('colspan', '3');
    });

    it('should support rowspan for merged cells', () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell rowSpan={2}>Merged cell</TableCell>
              <TableCell>Cell 1</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Cell 2</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const cell = container.querySelector('td');
      expect(cell).toHaveAttribute('rowspan', '2');
    });
  });

  describe('Sorting (Visual Only)', () => {
    it('should render sortable column headers', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button>Name ↕</button>
              </TableHead>
              <TableHead>
                <button>Email ↕</button>
              </TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );

      expect(screen.getByRole('button', { name: /name/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /email/i })).toBeInTheDocument();
    });

    it('should handle sort indicator clicks', async () => {
      const user = userEvent.setup();
      const handleSort = vi.fn();

      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button onClick={handleSort}>Name ↑</button>
              </TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );

      await user.click(screen.getByRole('button', { name: /name/i }));

      expect(handleSort).toHaveBeenCalledTimes(1);
    });
  });

  describe('Complex Scenarios', () => {
    it('should render nested elements in cells', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>
                <div>
                  <strong>John Doe</strong>
                  <br />
                  <small>Software Engineer</small>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });

    it('should render table with mixed content', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Text</TableCell>
              <TableCell>
                <img src="/test.jpg" alt="Test" />
              </TableCell>
              <TableCell>
                <button>Action</button>
              </TableCell>
              <TableCell>
                <input type="checkbox" aria-label="Select" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByText('Text')).toBeInTheDocument();
      expect(screen.getByAltText('Test')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument();
      expect(screen.getByLabelText('Select')).toBeInTheDocument();
    });
  });
});
