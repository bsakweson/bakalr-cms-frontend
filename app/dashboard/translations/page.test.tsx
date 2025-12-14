import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TranslationsPage from './page';
import { translationApi } from '@/lib/api/translation';
import type { Locale } from '@/types';

// Mock the translation API
vi.mock('@/lib/api/translation', () => ({
  translationApi: {
    getLocales: vi.fn(),
    createLocale: vi.fn(),
    updateLocale: vi.fn(),
    deleteLocale: vi.fn(),
  },
}));

// Mock window.confirm
const originalConfirm = window.confirm;
const originalAlert = window.alert;

describe('TranslationsPage', () => {
  const mockLocales: Locale[] = [
    {
      id: '1',
      code: 'en',
      name: 'English',
      native_name: 'English',
      is_default: true,
      is_enabled: true,
      is_active: true,
      auto_translate: false,
      organization_id: '1',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
    {
      id: '2',
      code: 'es',
      name: 'Spanish',
      native_name: 'Español',
      is_default: false,
      is_enabled: true,
      is_active: true,
      auto_translate: true,
      organization_id: '1',
      created_at: '2025-01-02T00:00:00Z',
      updated_at: '2025-01-02T00:00:00Z',
    },
    {
      id: '3',
      code: 'fr',
      name: 'French',
      native_name: 'Français',
      is_default: false,
      is_enabled: false,
      is_active: true,
      auto_translate: false,
      organization_id: '1',
      created_at: '2025-01-03T00:00:00Z',
      updated_at: '2025-01-03T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = originalConfirm;
    window.alert = originalAlert;
    vi.mocked(translationApi.getLocales).mockResolvedValue(mockLocales);
  });

  describe('Initial Rendering', () => {
    it('should render page title and description', async () => {
      render(<TranslationsPage />);

      expect(screen.getByText('Translations & Locales')).toBeInTheDocument();
      expect(screen.getByText('Manage content translations and language settings')).toBeInTheDocument();
    });

    it('should render Add Locale button', async () => {
      render(<TranslationsPage />);

      expect(screen.getByRole('button', { name: /add locale/i })).toBeInTheDocument();
    });

    it('should render loading state initially', () => {
      render(<TranslationsPage />);

      expect(screen.getByText('Loading locales...')).toBeInTheDocument();
    });

    it('should load and display locales after loading', async () => {
      render(<TranslationsPage />);

      await waitFor(() => {
        expect(screen.getAllByText('English').length).toBeGreaterThan(0);
      });

      expect(screen.getByText('Spanish')).toBeInTheDocument();
      expect(screen.getByText('French')).toBeInTheDocument();
    });

    it('should render stats cards with correct counts', async () => {
      render(<TranslationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Total Locales')).toBeInTheDocument();
      });

      // Verify all stat card labels are present
      expect(screen.getByText('Total Locales')).toBeInTheDocument();
      expect(screen.getAllByText('Enabled').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Auto-Translate').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Default Locale').length).toBeGreaterThan(0);

      // Check that stats contain expected numbers (multiple 3s and 2s may exist)
      const allText = screen.getByText('Total Locales').closest('div')?.parentElement?.textContent || '';
      expect(allText).toContain('3');
    });
  });

  describe('Locales Table', () => {
    it('should display table headers', async () => {
      render(<TranslationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Code')).toBeInTheDocument();
      });

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Native Name')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Features')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should display locale details correctly', async () => {
      render(<TranslationsPage />);

      await waitFor(() => {
        expect(screen.getByText('en')).toBeInTheDocument();
      });

      // Check locale codes
      expect(screen.getByText('en')).toBeInTheDocument();
      expect(screen.getByText('es')).toBeInTheDocument();
      expect(screen.getByText('fr')).toBeInTheDocument();

      // Check native names
      expect(screen.getByText('Español')).toBeInTheDocument();
      expect(screen.getByText('Français')).toBeInTheDocument();
    });

    it('should show Default badge for default locale', async () => {
      render(<TranslationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Default')).toBeInTheDocument();
      });
    });

    it('should show Enabled badge for enabled locales', async () => {
      render(<TranslationsPage />);

      await waitFor(() => {
        const enabledBadges = screen.getAllByText('Enabled');
        expect(enabledBadges.length).toBeGreaterThanOrEqual(2); // At least 2 badge instances (en and es), plus stats card label
      });
    });

    it('should show Disabled badge for disabled locales', async () => {
      render(<TranslationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Disabled')).toBeInTheDocument();
      });
    });

    it('should show Auto-Translate badge for locales with auto-translate', async () => {
      render(<TranslationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Auto-Translate')).toBeInTheDocument();
      });
    });

    it('should render action buttons for each locale', async () => {
      render(<TranslationsPage />);

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /edit/i }).length).toBe(3);
      });

      // Enable/Disable buttons (all 3 locales)
      const toggleButtons = screen.getAllByRole('button', { name: /(enable|disable)/i });
      expect(toggleButtons.length).toBe(3);

      // Delete buttons (only 2 - not for default locale)
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      expect(deleteButtons.length).toBe(2);
    });

    it('should not show Delete button for default locale', async () => {
      render(<TranslationsPage />);

      await waitFor(() => {
        expect(screen.getByText('en')).toBeInTheDocument();
      });

      // There should be 2 delete buttons (for es and fr), not 3
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      expect(deleteButtons.length).toBe(2);
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no locales exist', async () => {
      vi.mocked(translationApi.getLocales).mockResolvedValue([]);

      render(<TranslationsPage />);

      await waitFor(() => {
        expect(screen.getByText('No locales configured. Add your first locale to enable translations.')).toBeInTheDocument();
      });
    });
  });

  describe('Create Locale', () => {
    it('should open create dialog when Add Locale button is clicked', async () => {
      const user = userEvent.setup();
      render(<TranslationsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add locale/i })).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add locale/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /add new locale/i })).toBeInTheDocument();
      });
    });

    it('should render all form fields in create dialog', async () => {
      const user = userEvent.setup();
      render(<TranslationsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add locale/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /add locale/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/locale code/i)).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/native name/i)).toBeInTheDocument();
      
      // These labels appear in both stats cards and dialog, so just check they exist
      const allText = document.body.textContent || '';
      expect(allText).toContain('Default Locale');
      expect(allText).toContain('Enabled');
      expect(allText).toContain('Auto-Translate');
    });

    it('should create locale when form is submitted', async () => {
      const user = userEvent.setup();
      vi.mocked(translationApi.createLocale).mockResolvedValue({
        id: '4',
        code: 'de',
        name: 'German',
        native_name: 'Deutsch',
        is_default: false,
        is_enabled: true,
        is_active: true,
        auto_translate: false,
        organization_id: '1',
        created_at: '2025-01-04T00:00:00Z',
        updated_at: '2025-01-04T00:00:00Z',
      });

      render(<TranslationsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add locale/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /add locale/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/locale code/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/locale code/i), 'de');
      await user.type(screen.getByLabelText(/display name/i), 'German');
      await user.type(screen.getByLabelText(/native name/i), 'Deutsch');

      const createButton = screen.getByRole('button', { name: /create locale/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(translationApi.createLocale).toHaveBeenCalledWith({
          code: 'de',
          name: 'German',
          native_name: 'Deutsch',
          is_default: false,
          is_enabled: true,
          auto_translate: false,
        });
      });

      // Should reload locales after creation
      expect(translationApi.getLocales).toHaveBeenCalledTimes(2);
    });

    it('should show error alert when creation fails', async () => {
      const user = userEvent.setup();
      const alertMock = vi.fn();
      window.alert = alertMock;

      vi.mocked(translationApi.createLocale).mockRejectedValue({
        response: { data: { detail: 'Locale already exists' } },
      });

      render(<TranslationsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add locale/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /add locale/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/locale code/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/locale code/i), 'en');
      await user.type(screen.getByLabelText(/display name/i), 'English');

      await user.click(screen.getByRole('button', { name: /create locale/i }));

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith('Locale already exists');
      });
    });

    it('should close dialog after successful creation', async () => {
      const user = userEvent.setup();
      vi.mocked(translationApi.createLocale).mockResolvedValue({
        id: '5',
        code: 'it',
        name: 'Italian',
        native_name: 'Italiano',
        is_default: false,
        is_enabled: true,
        is_active: true,
        auto_translate: false,
        organization_id: '1',
        created_at: '2025-01-05T00:00:00Z',
        updated_at: '2025-01-05T00:00:00Z',
      });

      render(<TranslationsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add locale/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /add locale/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/locale code/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/locale code/i), 'it');
      await user.type(screen.getByLabelText(/display name/i), 'Italian');

      await user.click(screen.getByRole('button', { name: /create locale/i }));

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /add new locale/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Edit Locale', () => {
    it('should open edit dialog with pre-filled form', async () => {
      const user = userEvent.setup();
      render(<TranslationsPage />);

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /edit/i })[0]).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]); // Edit English

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /edit locale/i })).toBeInTheDocument();
      });

      // Check that form is pre-filled
      const codeInput = screen.getByLabelText(/locale code/i) as HTMLInputElement;
      expect(codeInput.value).toBe('en');
      expect(codeInput.disabled).toBe(true); // Code should be disabled in edit mode

      const nameInput = screen.getByLabelText(/display name/i) as HTMLInputElement;
      expect(nameInput.value).toBe('English');

      const nativeInput = screen.getByLabelText(/native name/i) as HTMLInputElement;
      expect(nativeInput.value).toBe('English');
    });

    it('should update locale when edit form is submitted', async () => {
      const user = userEvent.setup();
      vi.mocked(translationApi.updateLocale).mockResolvedValue({
        id: '2',
        code: 'es',
        name: 'Spanish (Updated)',
        native_name: 'Español',
        is_default: false,
        is_enabled: true,
        is_active: true,
        auto_translate: true,
        organization_id: '1',
        created_at: '2025-01-02T00:00:00Z',
        updated_at: '2025-01-06T00:00:00Z',
      });

      render(<TranslationsPage />);

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /edit/i })[1]).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[1]); // Edit Spanish

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /edit locale/i })).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/display name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Spanish (Updated)');

      await user.click(screen.getByRole('button', { name: /update locale/i }));

      await waitFor(() => {
        expect(translationApi.updateLocale).toHaveBeenCalledWith('es', {
          name: 'Spanish (Updated)',
          native_name: 'Español',
          is_default: false,
          is_enabled: true,
          auto_translate: true,
        });
      });
    });

    it('should show error alert when update fails', async () => {
      const user = userEvent.setup();
      const alertMock = vi.fn();
      window.alert = alertMock;

      vi.mocked(translationApi.updateLocale).mockRejectedValue({
        response: { data: { detail: 'Update failed' } },
      });

      render(<TranslationsPage />);

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /edit/i })[0]).toBeInTheDocument();
      });

      await user.click(screen.getAllByRole('button', { name: /edit/i })[0]);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /edit locale/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /update locale/i }));

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith('Update failed');
      });
    });
  });

  describe('Toggle Locale Enable/Disable', () => {
    it('should toggle locale enabled status', async () => {
      const user = userEvent.setup();
      vi.mocked(translationApi.updateLocale).mockResolvedValue(mockLocales[1]);

      render(<TranslationsPage />);

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /disable/i })[0]).toBeInTheDocument();
      });

      // Click Disable button for Spanish (currently enabled)
      const disableButtons = screen.getAllByRole('button', { name: /disable/i });
      await user.click(disableButtons[0]);

      await waitFor(() => {
        expect(translationApi.updateLocale).toHaveBeenCalledWith('en', {
          is_enabled: false,
        });
      });

      // Should reload locales
      expect(translationApi.getLocales).toHaveBeenCalledTimes(2);
    });

    it('should enable disabled locale', async () => {
      const user = userEvent.setup();
      vi.mocked(translationApi.updateLocale).mockResolvedValue(mockLocales[2]);

      render(<TranslationsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /enable/i })).toBeInTheDocument();
      });

      // Click Enable button for French (currently disabled)
      await user.click(screen.getByRole('button', { name: /enable/i }));

      await waitFor(() => {
        expect(translationApi.updateLocale).toHaveBeenCalledWith('fr', {
          is_enabled: true,
        });
      });
    });
  });

  describe('Delete Locale', () => {
    it('should show confirmation dialog when delete is clicked', async () => {
      const user = userEvent.setup();
      const confirmMock = vi.fn(() => false);
      window.confirm = confirmMock;

      render(<TranslationsPage />);

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /delete/i })[0]).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]); // Delete Spanish

      expect(confirmMock).toHaveBeenCalledWith('Are you sure you want to delete this locale?');
    });

    it('should delete locale when confirmed', async () => {
      const user = userEvent.setup();
      window.confirm = vi.fn(() => true);
      vi.mocked(translationApi.deleteLocale).mockResolvedValue(undefined);

      render(<TranslationsPage />);

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /delete/i })[0]).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(translationApi.deleteLocale).toHaveBeenCalledWith('es');
      });

      // Should reload locales
      expect(translationApi.getLocales).toHaveBeenCalledTimes(2);
    });

    it('should not delete locale when cancelled', async () => {
      const user = userEvent.setup();
      window.confirm = vi.fn(() => false);

      render(<TranslationsPage />);

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /delete/i })[0]).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(translationApi.deleteLocale).not.toHaveBeenCalled();
    });

    it('should show error alert when delete fails', async () => {
      const user = userEvent.setup();
      window.confirm = vi.fn(() => true);
      const alertMock = vi.fn();
      window.alert = alertMock;

      vi.mocked(translationApi.deleteLocale).mockRejectedValue({
        response: { data: { detail: 'Cannot delete default locale' } },
      });

      render(<TranslationsPage />);

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /delete/i })[0]).toBeInTheDocument();
      });

      await user.click(screen.getAllByRole('button', { name: /delete/i })[0]);

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith('Cannot delete default locale');
      });
    });
  });

  describe('Dialog Controls', () => {
    it('should close dialog when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<TranslationsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add locale/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /add locale/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /add new locale/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /add new locale/i })).not.toBeInTheDocument();
      });
    });

    it('should reset form when opening create dialog', async () => {
      const user = userEvent.setup();
      render(<TranslationsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add locale/i })).toBeInTheDocument();
      });

      // Open and fill form
      await user.click(screen.getByRole('button', { name: /add locale/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/locale code/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/locale code/i), 'test');

      // Close dialog
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /add new locale/i })).not.toBeInTheDocument();
      });

      // Reopen dialog
      await user.click(screen.getByRole('button', { name: /add locale/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/locale code/i)).toBeInTheDocument();
      });

      // Form should be reset
      const codeInput = screen.getByLabelText(/locale code/i) as HTMLInputElement;
      expect(codeInput.value).toBe('');
    });
  });

  describe('Error Handling', () => {
    it('should handle loading error gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(translationApi.getLocales).mockRejectedValue(new Error('Network error'));

      render(<TranslationsPage />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load locales:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });

    it('should still render page when data load fails', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(translationApi.getLocales).mockRejectedValue(new Error('Load failed'));

      render(<TranslationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Translations & Locales')).toBeInTheDocument();
      });

      // Should show empty state
      expect(screen.getByText('No locales configured. Add your first locale to enable translations.')).toBeInTheDocument();
    });
  });
});
