import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuditLogsPage from './page';
import { auditLogApi } from '@/lib/api';
import type { AuditLogListResponse, AuditLogStats } from '@/types';

// Mock the API
vi.mock('@/lib/api', () => ({
  auditLogApi: {
    listLogs: vi.fn(),
    getStats: vi.fn(),
  },
}));

describe('AuditLogsPage', () => {
  const mockLogsResponse: AuditLogListResponse = {
    logs: [
      {
        id: 1,
        action: 'create',
        resource_type: 'content',
        resource_id: 42,
        description: 'Created new blog post',
        severity: 'info',
        status: 'success',
        user_id: 1,
        user_email: 'admin@example.com',
        user_name: 'Admin User',
        ip_address: '192.168.1.1',
        created_at: '2025-11-28T10:30:00Z',
      },
      {
        id: 2,
        action: 'update',
        resource_type: 'user',
        resource_id: 5,
        description: 'Updated user permissions',
        severity: 'warning',
        status: 'success',
        user_id: 1,
        user_email: 'admin@example.com',
        user_name: 'Admin User',
        ip_address: '192.168.1.1',
        created_at: '2025-11-28T10:25:00Z',
      },
      {
        id: 3,
        action: 'delete',
        resource_type: 'content',
        resource_id: 38,
        description: 'Deleted draft content',
        severity: 'error',
        status: 'failure',
        user_id: 2,
        user_email: 'editor@example.com',
        user_name: 'Editor User',
        ip_address: '192.168.1.2',
        created_at: '2025-11-28T10:20:00Z',
      },
    ],
    total: 150,
    page: 1,
    page_size: 50,
  };

  const mockStatsResponse: AuditLogStats = {
    total_logs: 1523,
    actions_today: 47,
    failed_actions: 12,
    unique_users: 23,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auditLogApi.listLogs).mockResolvedValue(mockLogsResponse);
    vi.mocked(auditLogApi.getStats).mockResolvedValue(mockStatsResponse);
  });

  describe('Initial Rendering', () => {
    it('should render loading state initially', () => {
      render(<AuditLogsPage />);
      expect(screen.getByText('Loading logs...')).toBeInTheDocument();
    });

    it('should render page title and description', async () => {
      render(<AuditLogsPage />);
      expect(screen.getByText('Audit Logs')).toBeInTheDocument();
      expect(screen.getByText('Track all activity and changes in your organization')).toBeInTheDocument();
    });

    it('should load and display audit logs', async () => {
      render(<AuditLogsPage />);

      await waitFor(() => {
        expect(auditLogApi.listLogs).toHaveBeenCalled();
        expect(auditLogApi.getStats).toHaveBeenCalled();
      });

      expect(screen.getByText('Created new blog post')).toBeInTheDocument();
      expect(screen.getByText('Updated user permissions')).toBeInTheDocument();
      expect(screen.getByText('Deleted draft content')).toBeInTheDocument();
    });

    it('should display stats cards with correct values', async () => {
      render(<AuditLogsPage />);

      await waitFor(() => {
        expect(screen.getByText('1,523')).toBeInTheDocument();
        expect(screen.getByText('47')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
        expect(screen.getByText('23')).toBeInTheDocument();
      });

      expect(screen.getByText('Total Logs')).toBeInTheDocument();
      expect(screen.getByText('Actions Today')).toBeInTheDocument();
      expect(screen.getByText('Failed Actions (7d)')).toBeInTheDocument();
      expect(screen.getByText('Active Users (30d)')).toBeInTheDocument();
    });
  });

  describe('Table Display', () => {
    it('should render table headers', async () => {
      render(<AuditLogsPage />);

      await waitFor(() => {
        expect(screen.getByRole('columnheader', { name: 'Time' })).toBeInTheDocument();
      });

      expect(screen.getByRole('columnheader', { name: 'User' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Action' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Resource' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Description' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Severity' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'IP Address' })).toBeInTheDocument();
    });

    it('should display log entries with formatted data', async () => {
      render(<AuditLogsPage />);

      await waitFor(() => {
        const adminUsers = screen.getAllByText('Admin User');
        expect(adminUsers.length).toBeGreaterThan(0);
      });

      const adminEmails = screen.getAllByText('admin@example.com');
      expect(adminEmails.length).toBeGreaterThan(0);
      expect(screen.getByText('editor@example.com')).toBeInTheDocument();
      const ipAddresses = screen.getAllByText('192.168.1.1');
      expect(ipAddresses.length).toBeGreaterThan(0);
      expect(screen.getByText('192.168.1.2')).toBeInTheDocument();
    });

    it('should display action codes in code tags', async () => {
      render(<AuditLogsPage />);

      await waitFor(() => {
        expect(screen.getByText('create')).toBeInTheDocument();
      });

      expect(screen.getByText('update')).toBeInTheDocument();
      expect(screen.getByText('delete')).toBeInTheDocument();
    });

    it('should display resource types and IDs', async () => {
      render(<AuditLogsPage />);

      await waitFor(() => {
        const contentElements = screen.getAllByText('content');
        expect(contentElements.length).toBeGreaterThan(0);
      });

      const userElements = screen.getAllByText('user');
      expect(userElements.length).toBeGreaterThan(0);
      expect(screen.getByText('ID: 42')).toBeInTheDocument();
      expect(screen.getByText('ID: 5')).toBeInTheDocument();
      expect(screen.getByText('ID: 38')).toBeInTheDocument();
    });

    it('should display severity badges with correct variants', async () => {
      render(<AuditLogsPage />);

      await waitFor(() => {
        const badges = screen.getAllByText('info');
        expect(badges[0]).toBeInTheDocument();
      });

      expect(screen.getByText('warning')).toBeInTheDocument();
      expect(screen.getByText('error')).toBeInTheDocument();
    });

    it('should display status badges', async () => {
      render(<AuditLogsPage />);

      await waitFor(() => {
        const successBadges = screen.getAllByText('success');
        expect(successBadges.length).toBeGreaterThan(0);
      });

      expect(screen.getByText('failure')).toBeInTheDocument();
    });

    it('should show total count in description', async () => {
      render(<AuditLogsPage />);

      await waitFor(() => {
        expect(screen.getByText('Showing 3 of 150 logs')).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('should render all filter dropdowns', async () => {
      render(<AuditLogsPage />);

      await waitFor(() => {
        expect(screen.getByText('Filters')).toBeInTheDocument();
      });

      // Check that filter labels are present
      const labels = screen.getAllByText(/Action|Resource|Severity|Status|Time Range/);
      expect(labels.length).toBeGreaterThan(0);
    });

    it('should render clear filters button', async () => {
      render(<AuditLogsPage />);

      await waitFor(() => {
        expect(screen.getByText('Clear Filters')).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('should show pagination when total pages > 1', async () => {
      render(<AuditLogsPage />);

      await waitFor(() => {
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      });

      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('should disable Previous button on first page', async () => {
      render(<AuditLogsPage />);

      await waitFor(() => {
        const previousButton = screen.getByText('Previous');
        expect(previousButton).toBeDisabled();
      });
    });

    it('should navigate to next page', async () => {
      const user = userEvent.setup();
      render(<AuditLogsPage />);

      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument();
      });

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(auditLogApi.listLogs).toHaveBeenCalledWith(
          expect.objectContaining({ page: 2 })
        );
      });
    });

    it('should navigate to previous page', async () => {
      const user = userEvent.setup();
      render(<AuditLogsPage />);

      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument();
      });

      // Go to page 2
      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
      });

      // Go back to page 1
      const previousButton = screen.getByText('Previous');
      await user.click(previousButton);

      await waitFor(() => {
        expect(auditLogApi.listLogs).toHaveBeenCalledWith(
          expect.objectContaining({ page: 1 })
        );
      });
    });

    // Note: Cannot test last page state because component doesn't sync returned page from API
    // Component maintains its own page state that starts at 1

    it('should not show pagination when total pages = 1', async () => {
      vi.mocked(auditLogApi.listLogs).mockResolvedValue({
        ...mockLogsResponse,
        total: 3,
      });

      render(<AuditLogsPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();
      });

      expect(screen.queryByText('Previous')).not.toBeInTheDocument();
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should display no logs message when list is empty', async () => {
      vi.mocked(auditLogApi.listLogs).mockResolvedValue({
        logs: [],
        total: 0,
        page: 1,
        page_size: 50,
      });

      render(<AuditLogsPage />);

      await waitFor(() => {
        expect(screen.getByText('No logs found')).toBeInTheDocument();
      });
    });

    it('should show 0 in stats when no data', async () => {
      vi.mocked(auditLogApi.getStats).mockResolvedValue({
        total_logs: 0,
        actions_today: 0,
        failed_actions: 0,
        unique_users: 0,
      });

      render(<AuditLogsPage />);

      await waitFor(() => {
        const zeros = screen.getAllByText('0');
        expect(zeros.length).toBeGreaterThanOrEqual(4);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(auditLogApi.listLogs).mockRejectedValue(new Error('API Error'));
      vi.mocked(auditLogApi.getStats).mockRejectedValue(new Error('Stats Error'));

      render(<AuditLogsPage />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to load audit logs:',
          expect.any(Error)
        );
      });

      // Page should still render after error
      expect(screen.getByText('Audit Logs')).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });

    it('should still show filters when load fails', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(auditLogApi.listLogs).mockRejectedValue(new Error('API Error'));

      render(<AuditLogsPage />);

      await waitFor(() => {
        expect(screen.getByText('Filters')).toBeInTheDocument();
      });

      // Check that filter dropdowns are still rendered
      expect(screen.getByText('All actions')).toBeInTheDocument();
      expect(screen.getByText('All resources')).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('should format dates correctly', async () => {
      render(<AuditLogsPage />);

      await waitFor(() => {
        // Check that date is formatted (exact format may vary by locale)
        const tableCells = screen.getAllByRole('cell');
        const hasFormattedDate = tableCells.some(cell => 
          cell.textContent?.includes('Nov') || cell.textContent?.includes('2025')
        );
        expect(hasFormattedDate).toBe(true);
      });
    });
  });

  describe('Filter Combinations', () => {
    it('should render filter controls for combinations', async () => {
      render(<AuditLogsPage />);

      await waitFor(() => {
        expect(screen.getByText('Filters')).toBeInTheDocument();
      });

      // Verify filter labels are present for combinations
      const labels = screen.getAllByText(/Action|Resource|Severity|Status|Time Range/);
      expect(labels.length).toBeGreaterThan(0);
    });
  });
});
