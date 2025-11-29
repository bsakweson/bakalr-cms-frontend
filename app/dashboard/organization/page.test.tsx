import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OrganizationSettingsPage from './page';
import { organizationApi } from '@/lib/api';
import type { OrganizationProfile, Locale } from '@/types';

// Mock the API
vi.mock('@/lib/api', () => ({
  organizationApi: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    listLocales: vi.fn(),
    createLocale: vi.fn(),
    updateLocale: vi.fn(),
    deleteLocale: vi.fn(),
  },
}));

// Mock window.confirm
const originalConfirm = window.confirm;

describe('OrganizationSettingsPage', () => {
  const mockProfile: OrganizationProfile = {
    id: 1,
    name: 'Acme Inc',
    slug: 'acme-inc',
    description: 'Leading provider of innovative solutions',
    email: 'contact@acme.com',
    website: 'https://acme.com',
    logo_url: 'https://acme.com/logo.png',
    is_active: true,
    plan_type: 'professional',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-11-20T15:30:00Z',
  };

  const mockLocales: Locale[] = [
    {
      id: 1,
      code: 'en',
      name: 'English',
      is_default: true,
      is_enabled: true,
      is_active: true,
      auto_translate: false,
      organization_id: 1,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
    {
      id: 2,
      code: 'fr',
      name: 'French',
      is_default: false,
      is_enabled: true,
      is_active: true,
      auto_translate: true,
      organization_id: 1,
      created_at: '2024-03-20T14:30:00Z',
      updated_at: '2024-03-20T14:30:00Z',
    },
    {
      id: 3,
      code: 'es',
      name: 'Spanish',
      is_default: false,
      is_enabled: false,
      is_active: false,
      auto_translate: false,
      organization_id: 1,
      created_at: '2024-06-10T09:15:00Z',
      updated_at: '2024-06-10T09:15:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = originalConfirm;
    
    // Default successful responses
    vi.mocked(organizationApi.getProfile).mockResolvedValue(mockProfile);
    vi.mocked(organizationApi.listLocales).mockResolvedValue({ locales: mockLocales, total: mockLocales.length });
  });

  describe('Initial Rendering', () => {
    it('should show loading state initially', async () => {
      render(<OrganizationSettingsPage />);
      expect(screen.getByText('Loading settings...')).toBeInTheDocument();
      
      // Wait for loading to complete to avoid act() warnings
      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });
    });

    it('should load organization data on mount', async () => {
      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        expect(organizationApi.getProfile).toHaveBeenCalledTimes(1);
        expect(organizationApi.listLocales).toHaveBeenCalledTimes(1);
      });
    });

    it('should display page title and description', async () => {
      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Organization Settings')).toBeInTheDocument();
      });

      expect(screen.getByText('Manage your organization profile and preferences')).toBeInTheDocument();
    });

    it('should display tabs for Profile, Languages, and API Keys', async () => {
      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Profile' })).toBeInTheDocument();
      });

      expect(screen.getByRole('tab', { name: 'Languages' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'API Keys' })).toBeInTheDocument();
    });
  });

  describe('Profile Tab - Form Fields', () => {
    it('should populate form with profile data', async () => {
      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText('Organization Name') as HTMLInputElement;
        expect(nameInput.value).toBe('Acme Inc');
      });

      const emailInput = screen.getByLabelText('Contact Email') as HTMLInputElement;
      expect(emailInput.value).toBe('contact@acme.com');

      const descriptionInput = screen.getByLabelText('Description') as HTMLTextAreaElement;
      expect(descriptionInput.value).toBe('Leading provider of innovative solutions');

      const websiteInput = screen.getByLabelText('Website') as HTMLInputElement;
      expect(websiteInput.value).toBe('https://acme.com');

      const logoInput = screen.getByLabelText('Logo URL') as HTMLInputElement;
      expect(logoInput.value).toBe('https://acme.com/logo.png');
    });

    it('should allow editing organization name', async () => {
      const user = userEvent.setup();
      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('Organization Name')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText('Organization Name');
      await user.clear(nameInput);
      await user.type(nameInput, 'New Company Name');

      expect((nameInput as HTMLInputElement).value).toBe('New Company Name');
    });

    it('should allow editing contact email', async () => {
      const user = userEvent.setup();
      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('Contact Email')).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText('Contact Email');
      await user.clear(emailInput);
      await user.type(emailInput, 'new@example.com');

      expect((emailInput as HTMLInputElement).value).toBe('new@example.com');
    });

    it('should allow editing description', async () => {
      const user = userEvent.setup();
      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('Description')).toBeInTheDocument();
      });

      const descriptionInput = screen.getByLabelText('Description');
      await user.clear(descriptionInput);
      await user.type(descriptionInput, 'Updated description');

      expect((descriptionInput as HTMLTextAreaElement).value).toBe('Updated description');
    });

    it('should allow editing website URL', async () => {
      const user = userEvent.setup();
      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('Website')).toBeInTheDocument();
      });

      const websiteInput = screen.getByLabelText('Website');
      await user.clear(websiteInput);
      await user.type(websiteInput, 'https://newsite.com');

      expect((websiteInput as HTMLInputElement).value).toBe('https://newsite.com');
    });

    it('should allow editing logo URL', async () => {
      const user = userEvent.setup();
      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('Logo URL')).toBeInTheDocument();
      });

      const logoInput = screen.getByLabelText('Logo URL');
      await user.clear(logoInput);
      await user.type(logoInput, 'https://newlogo.png');

      expect((logoInput as HTMLInputElement).value).toBe('https://newlogo.png');
    });

    it('should have correct input placeholders', async () => {
      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('Website')).toBeInTheDocument();
      });

      expect(screen.getByPlaceholderText('https://example.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('https://example.com/logo.png')).toBeInTheDocument();
    });
  });

  describe('Profile Tab - Metadata Display', () => {
    it('should display organization slug', async () => {
      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Slug:')).toBeInTheDocument();
      });

      expect(screen.getByText('acme-inc')).toBeInTheDocument();
    });

    it('should display plan type as badge', async () => {
      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Plan:')).toBeInTheDocument();
      });

      expect(screen.getByText('professional')).toBeInTheDocument();
    });

    it('should display formatted creation date', async () => {
      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Created:')).toBeInTheDocument();
      });

      // Date should be formatted as "January 15, 2024"
      expect(screen.getByText(/January 15, 2024/)).toBeInTheDocument();
    });
  });

  describe('Profile Tab - Save Functionality', () => {
    it('should have Save Changes button', async () => {
      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
      });
    });

    it('should call updateProfile API when saving', async () => {
      const user = userEvent.setup();
      vi.mocked(organizationApi.updateProfile).mockResolvedValue(mockProfile);

      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: 'Save Changes' });
      await user.click(saveButton);

      await waitFor(() => {
        expect(organizationApi.updateProfile).toHaveBeenCalledWith({
          name: 'Acme Inc',
          description: 'Leading provider of innovative solutions',
          email: 'contact@acme.com',
          website: 'https://acme.com',
          logo_url: 'https://acme.com/logo.png',
        });
      });
    });

    it('should show saving state when saving', async () => {
      const user = userEvent.setup();
      let resolveUpdate: any;
      const updatePromise = new Promise<OrganizationProfile>((resolve) => {
        resolveUpdate = resolve;
      });
      vi.mocked(organizationApi.updateProfile).mockReturnValue(updatePromise);

      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: 'Save Changes' });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Saving...' })).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();

      resolveUpdate(mockProfile);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
      });
    });

    it('should update profile state after successful save', async () => {
      const user = userEvent.setup();
      const updatedProfile = { ...mockProfile, name: 'Updated Name' };
      vi.mocked(organizationApi.updateProfile).mockResolvedValue(updatedProfile);

      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('Organization Name')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText('Organization Name');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');

      const saveButton = screen.getByRole('button', { name: 'Save Changes' });
      await user.click(saveButton);

      await waitFor(() => {
        expect(organizationApi.updateProfile).toHaveBeenCalled();
      });
    });

    it('should log error when save fails', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(organizationApi.updateProfile).mockRejectedValue(new Error('Save failed'));

      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: 'Save Changes' });
      await user.click(saveButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Languages Tab - Locale Listing', () => {
    it('should switch to Languages tab', async () => {
      const user = userEvent.setup();
      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Languages' })).toBeInTheDocument();
      });

      const languagesTab = screen.getByRole('tab', { name: 'Languages' });
      await user.click(languagesTab);

      await waitFor(() => {
        expect(screen.getByText('Languages & Locales')).toBeInTheDocument();
      });
    });

    it('should display all locales', async () => {
      const user = userEvent.setup();
      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Languages' })).toBeInTheDocument();
      });

      const languagesTab = screen.getByRole('tab', { name: 'Languages' });
      await user.click(languagesTab);

      await waitFor(() => {
        expect(screen.getByText('English')).toBeInTheDocument();
      });

      expect(screen.getByText('French')).toBeInTheDocument();
      expect(screen.getByText('Spanish')).toBeInTheDocument();
    });

    it('should display locale codes', async () => {
      const user = userEvent.setup();
      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Languages' })).toBeInTheDocument();
      });

      const languagesTab = screen.getByRole('tab', { name: 'Languages' });
      await user.click(languagesTab);

      await waitFor(() => {
        expect(screen.getByText('en')).toBeInTheDocument();
      });

      expect(screen.getByText('fr')).toBeInTheDocument();
      expect(screen.getByText('es')).toBeInTheDocument();
    });

    it('should show Default badge for default locale', async () => {
      const user = userEvent.setup();
      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Languages' })).toBeInTheDocument();
      });

      const languagesTab = screen.getByRole('tab', { name: 'Languages' });
      await user.click(languagesTab);

      await waitFor(() => {
        expect(screen.getByText('Default')).toBeInTheDocument();
      });
    });

    it('should show Inactive badge for inactive locales', async () => {
      const user = userEvent.setup();
      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Languages' })).toBeInTheDocument();
      });

      const languagesTab = screen.getByRole('tab', { name: 'Languages' });
      await user.click(languagesTab);

      await waitFor(() => {
        expect(screen.getByText('Inactive')).toBeInTheDocument();
      });
    });

    it('should display empty state when no locales', async () => {
      const user = userEvent.setup();
      vi.mocked(organizationApi.listLocales).mockResolvedValue({ locales: [], total: 0 });

      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Languages' })).toBeInTheDocument();
      });

      const languagesTab = screen.getByRole('tab', { name: 'Languages' });
      await user.click(languagesTab);

      await waitFor(() => {
        expect(screen.getByText('No languages configured yet')).toBeInTheDocument();
      });
    });

    it('should have Add Language button in header', async () => {
      const user = userEvent.setup();
      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Languages' })).toBeInTheDocument();
      });

      const languagesTab = screen.getByRole('tab', { name: 'Languages' });
      await user.click(languagesTab);

      await waitFor(() => {
        // Should have at least one "Add Language" button
        const addButtons = screen.getAllByRole('button', { name: 'Add Language' });
        expect(addButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Languages Tab - Locale Actions', () => {
    it('should have Switch for each locale to toggle active status', async () => {
      const user = userEvent.setup();
      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Languages' })).toBeInTheDocument();
      });

      const languagesTab = screen.getByRole('tab', { name: 'Languages' });
      await user.click(languagesTab);

      await waitFor(() => {
        // Should have 3 switches (one for each locale)
        const switches = screen.getAllByRole('switch');
        expect(switches.length).toBe(3);
      });
    });

    it('should have Set Default button for non-default locales', async () => {
      const user = userEvent.setup();
      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Languages' })).toBeInTheDocument();
      });

      const languagesTab = screen.getByRole('tab', { name: 'Languages' });
      await user.click(languagesTab);

      await waitFor(() => {
        const allSetDefaultButtons = screen.getAllByRole('button', { name: 'Set Default' });
        // Filter for enabled buttons only (disabled ones are for default locale)
        const enabledSetDefaultButtons = allSetDefaultButtons.filter(btn => !btn.hasAttribute('disabled'));
        // Should have 2 enabled "Set Default" buttons (for French and Spanish, not English which is default)
        expect(enabledSetDefaultButtons.length).toBe(2);
      });
    });

    it('should have Delete button for non-default locales', async () => {
      const user = userEvent.setup();
      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Languages' })).toBeInTheDocument();
      });

      const languagesTab = screen.getByRole('tab', { name: 'Languages' });
      await user.click(languagesTab);

      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
        // Should have 2 "Delete" buttons (for French and Spanish, not English which is default)
        expect(deleteButtons.length).toBe(2);
      });
    });

    it('should call updateLocale when toggling active status', async () => {
      const user = userEvent.setup();
      vi.mocked(organizationApi.updateLocale).mockResolvedValue({ ...mockLocales[1], is_active: false });

      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Languages' })).toBeInTheDocument();
      });

      const languagesTab = screen.getByRole('tab', { name: 'Languages' });
      await user.click(languagesTab);

      await waitFor(() => {
        const switches = screen.getAllByRole('switch');
        expect(switches.length).toBe(3);
      });

      // Click the second switch (French, which is active)
      const switches = screen.getAllByRole('switch');
      await user.click(switches[1]);

      await waitFor(() => {
        expect(organizationApi.updateLocale).toHaveBeenCalledWith(2, { is_active: false });
      });
    });

    it('should call updateLocale when setting default', async () => {
      const user = userEvent.setup();
      vi.mocked(organizationApi.updateLocale).mockResolvedValue({ ...mockLocales[1], is_default: true });

      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Languages' })).toBeInTheDocument();
      });

      const languagesTab = screen.getByRole('tab', { name: 'Languages' });
      await user.click(languagesTab);

      await waitFor(() => {
        const allSetDefaultButtons = screen.getAllByRole('button', { name: 'Set Default' });
        const enabledSetDefaultButtons = allSetDefaultButtons.filter(btn => !btn.hasAttribute('disabled'));
        expect(enabledSetDefaultButtons.length).toBe(2);
      });

      const allSetDefaultButtons = screen.getAllByRole('button', { name: 'Set Default' });
      const enabledSetDefaultButtons = allSetDefaultButtons.filter(btn => !btn.hasAttribute('disabled'));
      await user.click(enabledSetDefaultButtons[0]); // Click first enabled non-default (French)

      await waitFor(() => {
        expect(organizationApi.updateLocale).toHaveBeenCalledWith(2, { is_default: true });
      });
    });

    it('should show confirmation before deleting locale', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.fn().mockReturnValue(false);
      window.confirm = confirmSpy;

      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Languages' })).toBeInTheDocument();
      });

      const languagesTab = screen.getByRole('tab', { name: 'Languages' });
      await user.click(languagesTab);

      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
        expect(deleteButtons.length).toBe(2);
      });

      const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
      await user.click(deleteButtons[0]);

      expect(confirmSpy).toHaveBeenCalledWith(
        'Are you sure you want to delete this locale? All translations will remain but will not be accessible.'
      );
    });

    it('should call deleteLocale API when confirmed', async () => {
      const user = userEvent.setup();
      window.confirm = vi.fn().mockReturnValue(true);
      vi.mocked(organizationApi.deleteLocale).mockResolvedValue({ message: 'Locale deleted' });

      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Languages' })).toBeInTheDocument();
      });

      const languagesTab = screen.getByRole('tab', { name: 'Languages' });
      await user.click(languagesTab);

      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
        expect(deleteButtons.length).toBe(2);
      });

      const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
      await user.click(deleteButtons[0]); // Delete French (id: 2)

      await waitFor(() => {
        expect(organizationApi.deleteLocale).toHaveBeenCalledWith(2);
      });
    });

    it('should not call deleteLocale if user cancels', async () => {
      const user = userEvent.setup();
      window.confirm = vi.fn().mockReturnValue(false);

      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Languages' })).toBeInTheDocument();
      });

      const languagesTab = screen.getByRole('tab', { name: 'Languages' });
      await user.click(languagesTab);

      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
        expect(deleteButtons.length).toBe(2);
      });

      const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
      await user.click(deleteButtons[0]);

      expect(organizationApi.deleteLocale).not.toHaveBeenCalled();
    });

    it('should log error when locale update fails', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(organizationApi.updateLocale).mockRejectedValue(new Error('Update failed'));

      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Languages' })).toBeInTheDocument();
      });

      const languagesTab = screen.getByRole('tab', { name: 'Languages' });
      await user.click(languagesTab);

      await waitFor(() => {
        const switches = screen.getAllByRole('switch');
        expect(switches.length).toBe(3);
      });

      const switches = screen.getAllByRole('switch');
      await user.click(switches[1]);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });

    it('should log error when locale deletion fails', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      window.confirm = vi.fn().mockReturnValue(true);
      vi.mocked(organizationApi.deleteLocale).mockRejectedValue(new Error('Delete failed'));

      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Languages' })).toBeInTheDocument();
      });

      const languagesTab = screen.getByRole('tab', { name: 'Languages' });
      await user.click(languagesTab);

      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
        expect(deleteButtons.length).toBe(2);
      });

      const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('API Keys Tab', () => {
    it('should switch to API Keys tab', async () => {
      const user = userEvent.setup();
      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'API Keys' })).toBeInTheDocument();
      });

      const apiKeysTab = screen.getByRole('tab', { name: 'API Keys' });
      await user.click(apiKeysTab);

      await waitFor(() => {
        // Multiple "API Keys" text exists (tab label and card title)
        const apiKeysTexts = screen.getAllByText('API Keys');
        expect(apiKeysTexts.length).toBeGreaterThan(0);
      });
    });

    it('should display coming soon message', async () => {
      const user = userEvent.setup();
      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'API Keys' })).toBeInTheDocument();
      });

      const apiKeysTab = screen.getByRole('tab', { name: 'API Keys' });
      await user.click(apiKeysTab);

      await waitFor(() => {
        expect(screen.getByText(/API key management coming soon/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should log error when profile load fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(organizationApi.getProfile).mockRejectedValue(new Error('Load failed'));

      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });

    it('should still render page when data load fails', async () => {
      vi.mocked(organizationApi.getProfile).mockRejectedValue(new Error('Load failed'));
      vi.mocked(organizationApi.listLocales).mockRejectedValue(new Error('Load failed'));

      render(<OrganizationSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Organization Settings')).toBeInTheDocument();
      });
    });
  });

  // Note: The following tests are SKIPPED because they require Radix UI Dialog interactions
  // which don't work in jsdom. These should be tested with Playwright E2E tests.
  describe.skip('Languages Tab - Dialog Interactions (E2E ONLY)', () => {
    it.skip('should open dialog when clicking Add Language button', () => {
      // TODO: E2E test - Radix UI Dialog doesn't work in jsdom
    });

    it.skip('should have form fields for code, name, and default toggle in dialog', () => {
      // TODO: E2E test - Dialog content not accessible in jsdom
    });

    it.skip('should validate locale code and name before enabling Add button', () => {
      // TODO: E2E test - Dialog form validation requires interaction
    });

    it.skip('should call createLocale API when submitting form', () => {
      // TODO: E2E test - Dialog submission requires interaction
    });

    it.skip('should close dialog and reset form after successful creation', () => {
      // TODO: E2E test - Dialog state management requires interaction
    });

    it.skip('should add new locale to list after creation', () => {
      // TODO: E2E test - Requires full dialog interaction flow
    });

    it.skip('should log error when locale creation fails', () => {
      // TODO: E2E test - Dialog error handling requires interaction
    });
  });
});
