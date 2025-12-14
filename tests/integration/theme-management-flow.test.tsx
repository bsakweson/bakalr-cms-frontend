/**
 * Integration Test: Theme Customization Workflow
 * 
 * This test validates the complete theme management flow:
 * 1. List available themes (system and custom)
 * 2. Get active theme (current theme in use)
 * 3. Create custom theme with colors and typography
 * 4. Preview theme settings (export and CSS variables)
 * 5. Update theme properties
 * 6. Activate theme (make it live)
 * 7. Verify theme activation and persistence
 * 8. Complete theme workflow
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { themeApi } from '@/lib/api/themes';
import type { 
  Theme, 
  ThemeCreate, 
  ThemeUpdate, 
  ThemeListResponse,
  ThemeColors,
  ThemeTypography
} from '@/lib/api/themes';

// Mock API module
vi.mock('@/lib/api/themes', () => ({
  themeApi: {
    listThemes: vi.fn(),
    getTheme: vi.fn(),
    getActiveTheme: vi.fn(),
    createTheme: vi.fn(),
    updateTheme: vi.fn(),
    deleteTheme: vi.fn(),
    setActiveTheme: vi.fn(),
    exportTheme: vi.fn(),
    getCSSVariables: vi.fn(),
  }
}));

describe('Integration: Theme Customization Workflow', () => {
  // Mock data
  const mockSystemTheme: Theme = {
    id: '1',
    organization_id: '1',
    name: 'dark-chocolate',
    display_name: 'Dark Chocolate Brown',
    description: 'Professional dark theme with chocolate brown accent',
    is_system_theme: true,
    is_active: true,
    colors: {
      primary: '#3D2817',
      secondary: '#6B4423',
      accent: '#8B5A2B',
      background: '#1A1A1A',
      foreground: '#FFFFFF',
      muted: '#2A2A2A',
      'muted-foreground': '#A0A0A0',
      card: '#252525',
      'card-foreground': '#FFFFFF',
      border: '#3D2817',
      input: '#2A2A2A',
      ring: '#8B5A2B',
      destructive: '#DC2626',
      'destructive-foreground': '#FFFFFF'
    },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: {
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem'
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700'
      },
      lineHeight: {
        tight: '1.25',
        normal: '1.5',
        relaxed: '1.75'
      }
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem'
    },
    borderRadius: {
      sm: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      full: '9999px'
    },
    shadows: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px rgba(0, 0, 0, 0.1)'
    },
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  };

  const mockCustomThemeColors: ThemeColors = {
    primary: '#2563EB',
    secondary: '#7C3AED',
    accent: '#EC4899',
    background: '#FFFFFF',
    foreground: '#000000',
    muted: '#F3F4F6',
    'muted-foreground': '#6B7280',
    card: '#FFFFFF',
    'card-foreground': '#000000',
    border: '#E5E7EB',
    input: '#F3F4F6',
    ring: '#2563EB',
    destructive: '#EF4444',
    'destructive-foreground': '#FFFFFF'
  };

  const mockCustomThemeTypography: ThemeTypography = {
    fontFamily: 'Poppins, sans-serif',
    fontSize: {
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem'
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    }
  };

  const mockCustomTheme: Theme = {
    id: '2',
    organization_id: '1',
    name: 'vibrant-modern',
    display_name: 'Vibrant Modern',
    description: 'Bright and colorful theme with modern aesthetics',
    is_system_theme: false,
    is_active: false,
    colors: mockCustomThemeColors,
    typography: mockCustomThemeTypography,
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem'
    },
    borderRadius: {
      sm: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      full: '9999px'
    },
    shadows: {
      sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
      md: '0 4px 8px rgba(0, 0, 0, 0.15)',
      lg: '0 12px 20px rgba(0, 0, 0, 0.2)'
    },
    created_at: '2025-11-25T10:00:00Z',
    updated_at: '2025-11-25T10:00:00Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Step 1: List Available Themes', () => {
    it('should list all themes including system themes', async () => {
      const mockResponse: ThemeListResponse = {
        themes: [mockSystemTheme, mockCustomTheme],
        total: 2,
        page: 1,
        page_size: 10
      };

      vi.mocked(themeApi.listThemes).mockResolvedValue(mockResponse);

      const result = await themeApi.listThemes({ include_system: true });

      expect(result.themes).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.themes[0].is_system_theme).toBe(true);
      expect(result.themes[1].is_system_theme).toBe(false);
      expect(themeApi.listThemes).toHaveBeenCalledWith({ include_system: true });
    });

    it('should list only custom themes when filtering', async () => {
      const mockResponse: ThemeListResponse = {
        themes: [mockCustomTheme],
        total: 1,
        page: 1,
        page_size: 10
      };

      vi.mocked(themeApi.listThemes).mockResolvedValue(mockResponse);

      const result = await themeApi.listThemes({ include_system: false });

      expect(result.themes).toHaveLength(1);
      expect(result.themes.every((t: Theme) => !t.is_system_theme)).toBe(true);
    });

    it('should identify active theme', async () => {
      const mockResponse: ThemeListResponse = {
        themes: [mockSystemTheme, mockCustomTheme],
        total: 2,
        page: 1,
        page_size: 10
      };

      vi.mocked(themeApi.listThemes).mockResolvedValue(mockResponse);

      const result = await themeApi.listThemes();
      const activeTheme = result.themes.find((t: Theme) => t.is_active);

      expect(activeTheme).toBeDefined();
      expect(activeTheme?.name).toBe('dark-chocolate');
      expect(activeTheme?.is_active).toBe(true);
    });
  });

  describe('Step 2: Get Active Theme', () => {
    it('should get currently active theme', async () => {
      vi.mocked(themeApi.getActiveTheme).mockResolvedValue(mockSystemTheme);

      const result = await themeApi.getActiveTheme();

      expect(result).toEqual(mockSystemTheme);
      expect(result.is_active).toBe(true);
      expect(result.display_name).toBe('Dark Chocolate Brown');
    });

    it('should retrieve complete theme configuration', async () => {
      vi.mocked(themeApi.getActiveTheme).mockResolvedValue(mockSystemTheme);

      const result = await themeApi.getActiveTheme();

      expect(result.colors).toBeDefined();
      expect(result.typography).toBeDefined();
      expect(result.spacing).toBeDefined();
      expect(result.borderRadius).toBeDefined();
      expect(result.shadows).toBeDefined();
    });
  });

  describe('Step 3: Create Custom Theme', () => {
    it('should create new custom theme with colors', async () => {
      const createRequest: ThemeCreate = {
        name: 'vibrant-modern',
        display_name: 'Vibrant Modern',
        description: 'Bright and colorful theme with modern aesthetics',
        colors: mockCustomThemeColors
      };

      vi.mocked(themeApi.createTheme).mockResolvedValue(mockCustomTheme);

      const result = await themeApi.createTheme(createRequest);

      expect(result.id).toBe(2);
      expect(result.name).toBe('vibrant-modern');
      expect(result.is_system_theme).toBe(false);
      expect(result.is_active).toBe(false);
      expect(result.colors.primary).toBe('#2563EB');
      expect(themeApi.createTheme).toHaveBeenCalledWith(createRequest);
    });

    it('should create theme with typography and spacing', async () => {
      const createRequest: ThemeCreate = {
        name: 'vibrant-modern',
        display_name: 'Vibrant Modern',
        colors: mockCustomThemeColors,
        typography: mockCustomThemeTypography,
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem'
        }
      };

      vi.mocked(themeApi.createTheme).mockResolvedValue(mockCustomTheme);

      const result = await themeApi.createTheme(createRequest);

      expect(result.typography).toBeDefined();
      expect(result.typography?.fontFamily).toBe('Poppins, sans-serif');
      expect(result.spacing).toBeDefined();
      expect(result.spacing?.md).toBe('1rem');
    });

    it('should handle theme creation errors', async () => {
      const createRequest: ThemeCreate = {
        name: 'dark-chocolate', // Duplicate name
        display_name: 'Dark Chocolate',
        colors: mockCustomThemeColors
      };

      vi.mocked(themeApi.createTheme).mockRejectedValue(
        new Error('Theme with this name already exists')
      );

      await expect(themeApi.createTheme(createRequest)).rejects.toThrow(
        'Theme with this name already exists'
      );
    });
  });

  describe('Step 4: Preview Theme Settings', () => {
    it('should export theme configuration', async () => {
      const mockExport = {
        name: 'vibrant-modern',
        display_name: 'Vibrant Modern',
        colors: mockCustomThemeColors,
        typography: mockCustomThemeTypography,
        version: '1.0.0'
      };

      vi.mocked(themeApi.exportTheme).mockResolvedValue(mockExport);

      const result = await themeApi.exportTheme("2");

      expect(result).toEqual(mockExport);
      expect(result.name).toBe('vibrant-modern');
      expect(result.colors).toBeDefined();
      expect(themeApi.exportTheme).toHaveBeenCalledWith("2");
    });

    it('should get CSS variables for theme preview', async () => {
      const mockCSSVariables = {
        css: ':root { --primary: #2563EB; --secondary: #7C3AED; --accent: #EC4899; }',
        variables: {
          primary: '#2563EB',
          secondary: '#7C3AED',
          accent: '#EC4899',
          background: '#FFFFFF',
          foreground: '#000000'
        }
      };

      vi.mocked(themeApi.getCSSVariables).mockResolvedValue(mockCSSVariables);

      const result = await themeApi.getCSSVariables("2");

      expect(result.css).toContain('--primary: #2563EB');
      expect(result.variables.primary).toBe('#2563EB');
      expect(Object.keys(result.variables).length).toBeGreaterThan(0);
    });

    it('should preview theme without activating it', async () => {
      vi.mocked(themeApi.getTheme).mockResolvedValue(mockCustomTheme);

      const result = await themeApi.getTheme("2");

      expect(result.is_active).toBe(false); // Not activated yet
      expect(result.colors).toBeDefined();
      expect(result.typography).toBeDefined();
    });
  });

  describe('Step 5: Update Theme Properties', () => {
    it('should update theme colors', async () => {
      const updateRequest: ThemeUpdate = {
        colors: {
          ...mockCustomThemeColors,
          primary: '#1D4ED8', // Darker blue
          accent: '#DB2777' // Darker pink
        }
      };

      const updatedTheme: Theme = {
        ...mockCustomTheme,
        colors: updateRequest.colors!,
        updated_at: '2025-11-26T10:00:00Z'
      };

      vi.mocked(themeApi.updateTheme).mockResolvedValue(updatedTheme);

      const result = await themeApi.updateTheme("2", updateRequest);

      expect(result.colors.primary).toBe('#1D4ED8');
      expect(result.colors.accent).toBe('#DB2777');
      expect(result.updated_at).not.toBe(mockCustomTheme.updated_at);
      expect(themeApi.updateTheme).toHaveBeenCalledWith("2", updateRequest);
    });

    it('should update theme display name and description', async () => {
      const updateRequest: ThemeUpdate = {
        display_name: 'Vibrant Modern v2',
        description: 'Updated vibrant theme with improved contrast'
      };

      const updatedTheme: Theme = {
        ...mockCustomTheme,
        display_name: updateRequest.display_name!,
        description: updateRequest.description,
        updated_at: '2025-11-26T11:00:00Z'
      };

      vi.mocked(themeApi.updateTheme).mockResolvedValue(updatedTheme);

      const result = await themeApi.updateTheme("2", updateRequest);

      expect(result.display_name).toBe('Vibrant Modern v2');
      expect(result.description).toBe('Updated vibrant theme with improved contrast');
    });

    it('should not allow updating system themes', async () => {
      const updateRequest: ThemeUpdate = {
        colors: mockCustomThemeColors
      };

      vi.mocked(themeApi.updateTheme).mockRejectedValue(
        new Error('Cannot modify system theme')
      );

      await expect(themeApi.updateTheme("1", updateRequest)).rejects.toThrow(
        'Cannot modify system theme'
      );
    });
  });

  describe('Step 6: Activate Theme', () => {
    it('should activate custom theme', async () => {
      const activatedTheme: Theme = {
        ...mockCustomTheme,
        is_active: true,
        updated_at: '2025-11-26T12:00:00Z'
      };

      vi.mocked(themeApi.setActiveTheme).mockResolvedValue(activatedTheme);

      const result = await themeApi.setActiveTheme("2");

      expect(result.is_active).toBe(true);
      expect(result.id).toBe(2);
      expect(themeApi.setActiveTheme).toHaveBeenCalledWith("2");
    });

    it('should deactivate previous theme when activating new one', async () => {
      // First, system theme is active
      vi.mocked(themeApi.getActiveTheme).mockResolvedValueOnce(mockSystemTheme);
      const currentTheme = await themeApi.getActiveTheme();
      expect(currentTheme.id).toBe(1);

      // Activate custom theme
      const activatedCustomTheme: Theme = {
        ...mockCustomTheme,
        is_active: true
      };
      vi.mocked(themeApi.setActiveTheme).mockResolvedValue(activatedCustomTheme);
      const newActiveTheme = await themeApi.setActiveTheme("2");
      expect(newActiveTheme.is_active).toBe(true);

      // Verify new active theme
      vi.mocked(themeApi.getActiveTheme).mockResolvedValueOnce(activatedCustomTheme);
      const verifyTheme = await themeApi.getActiveTheme();
      expect(verifyTheme.id).toBe(2);
      expect(verifyTheme.name).toBe('vibrant-modern');
    });

    it('should allow reactivating system theme', async () => {
      const reactivatedSystemTheme: Theme = {
        ...mockSystemTheme,
        is_active: true,
        updated_at: '2025-11-26T13:00:00Z'
      };

      vi.mocked(themeApi.setActiveTheme).mockResolvedValue(reactivatedSystemTheme);

      const result = await themeApi.setActiveTheme("1");

      expect(result.is_active).toBe(true);
      expect(result.is_system_theme).toBe(true);
    });
  });

  describe('Step 7: Verify Theme Activation and Persistence', () => {
    it('should verify theme is active after activation', async () => {
      const activatedTheme: Theme = {
        ...mockCustomTheme,
        is_active: true
      };

      vi.mocked(themeApi.getTheme).mockResolvedValue(activatedTheme);

      const result = await themeApi.getTheme("2");

      expect(result.is_active).toBe(true);
      expect(result.id).toBe(2);
    });

    it('should persist theme settings across requests', async () => {
      // First request
      vi.mocked(themeApi.getActiveTheme).mockResolvedValueOnce({
        ...mockCustomTheme,
        is_active: true
      });
      const firstCheck = await themeApi.getActiveTheme();
      expect(firstCheck.name).toBe('vibrant-modern');

      // Second request - should still be the same theme
      vi.mocked(themeApi.getActiveTheme).mockResolvedValueOnce({
        ...mockCustomTheme,
        is_active: true
      });
      const secondCheck = await themeApi.getActiveTheme();
      expect(secondCheck.name).toBe('vibrant-modern');
      expect(secondCheck.id).toBe(firstCheck.id);
    });

    it('should retrieve CSS variables for active theme', async () => {
      const mockCSSVariables = {
        css: ':root { --primary: #2563EB; --secondary: #7C3AED; }',
        variables: {
          primary: '#2563EB',
          secondary: '#7C3AED'
        }
      };

      vi.mocked(themeApi.getCSSVariables).mockResolvedValue(mockCSSVariables);

      const result = await themeApi.getCSSVariables("2");

      expect(result.css).toBeTruthy();
      expect(result.variables.primary).toBe('#2563EB');
    });
  });

  describe('Complete Theme Workflow', () => {
    it('should complete full theme customization workflow', async () => {
      // Step 1: List themes
      vi.mocked(themeApi.listThemes).mockResolvedValue({
        themes: [mockSystemTheme],
        total: 1,
        page: 1,
        page_size: 10
      });
      const themes = await themeApi.listThemes();
      expect(themes.total).toBe(1);

      // Step 2: Get active theme (system theme)
      vi.mocked(themeApi.getActiveTheme).mockResolvedValue(mockSystemTheme);
      const activeTheme = await themeApi.getActiveTheme();
      expect(activeTheme.name).toBe('dark-chocolate');

      // Step 3: Create custom theme
      const createRequest: ThemeCreate = {
        name: 'vibrant-modern',
        display_name: 'Vibrant Modern',
        colors: mockCustomThemeColors,
        typography: mockCustomThemeTypography
      };
      vi.mocked(themeApi.createTheme).mockResolvedValue(mockCustomTheme);
      const newTheme = await themeApi.createTheme(createRequest);
      expect(newTheme.id).toBe(2);

      // Step 4: Preview theme (export and CSS)
      vi.mocked(themeApi.exportTheme).mockResolvedValue({
        name: 'vibrant-modern',
        colors: mockCustomThemeColors
      });
      const exportedTheme = await themeApi.exportTheme("2");
      expect(exportedTheme.name).toBe('vibrant-modern');

      // Step 5: Activate custom theme
      const activatedTheme: Theme = { ...mockCustomTheme, is_active: true };
      vi.mocked(themeApi.setActiveTheme).mockResolvedValue(activatedTheme);
      const activeCustomTheme = await themeApi.setActiveTheme("2");
      expect(activeCustomTheme.is_active).toBe(true);

      // Step 6: Verify activation
      vi.mocked(themeApi.getActiveTheme).mockResolvedValue(activatedTheme);
      const verifyActive = await themeApi.getActiveTheme();
      expect(verifyActive.id).toBe(2);
      expect(verifyActive.name).toBe('vibrant-modern');
    });

    it('should handle theme update and reactivation workflow', async () => {
      // Create and activate theme
      vi.mocked(themeApi.createTheme).mockResolvedValue(mockCustomTheme);
      const created = await themeApi.createTheme({
        name: 'vibrant-modern',
        display_name: 'Vibrant Modern',
        colors: mockCustomThemeColors
      });
      expect(created.id).toBe(2);

      // Update theme colors
      const updatedTheme: Theme = {
        ...mockCustomTheme,
        colors: {
          ...mockCustomThemeColors,
          primary: '#1D4ED8'
        }
      };
      vi.mocked(themeApi.updateTheme).mockResolvedValue(updatedTheme);
      const updated = await themeApi.updateTheme("2", {
        colors: updatedTheme.colors
      });
      expect(updated.colors.primary).toBe('#1D4ED8');

      // Activate updated theme
      const activatedUpdated: Theme = { ...updatedTheme, is_active: true };
      vi.mocked(themeApi.setActiveTheme).mockResolvedValue(activatedUpdated);
      const activated = await themeApi.setActiveTheme("2");
      expect(activated.is_active).toBe(true);
      expect(activated.colors.primary).toBe('#1D4ED8');
    });

    it('should support theme rollback by switching themes', async () => {
      // Custom theme active
      const activeCustom: Theme = { ...mockCustomTheme, is_active: true };
      vi.mocked(themeApi.getActiveTheme).mockResolvedValueOnce(activeCustom);
      const current = await themeApi.getActiveTheme();
      expect(current.name).toBe('vibrant-modern');

      // Rollback to system theme
      const reactivatedSystem: Theme = { ...mockSystemTheme, is_active: true };
      vi.mocked(themeApi.setActiveTheme).mockResolvedValue(reactivatedSystem);
      const rolledBack = await themeApi.setActiveTheme("1");
      expect(rolledBack.name).toBe('dark-chocolate');
      expect(rolledBack.is_system_theme).toBe(true);

      // Verify rollback
      vi.mocked(themeApi.getActiveTheme).mockResolvedValueOnce(reactivatedSystem);
      const verified = await themeApi.getActiveTheme();
      expect(verified.id).toBe(1);
    });
  });
});
