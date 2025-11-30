import { describe, it, expect, beforeEach, vi } from 'vitest';
import { themeApi, type Theme, type ThemeCreate, type ThemeUpdate, type ThemeListResponse, type ThemeColors } from './themes';
import { apiClient } from './client';

vi.mock('./client');

describe('themeApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockColors: ThemeColors = {
    primary: '#0066cc',
    secondary: '#6c757d',
    accent: '#ff6b6b',
    background: '#ffffff',
    foreground: '#000000',
    muted: '#f8f9fa',
    'muted-foreground': '#6c757d',
    card: '#ffffff',
    'card-foreground': '#000000',
    border: '#dee2e6',
    input: '#ced4da',
    ring: '#0066cc',
    destructive: '#dc3545',
    'destructive-foreground': '#ffffff',
  };

  describe('listThemes', () => {
    it('should fetch themes with default parameters', async () => {
      const mockResponse: ThemeListResponse = {
        themes: [
          {
            id: 1,
            organization_id: 1,
            name: 'default',
            display_name: 'Default Theme',
            is_system_theme: true,
            is_active: true,
            colors: mockColors,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        page_size: 10,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await themeApi.listThemes();

      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith('/themes', { params: undefined });
    });

    it('should fetch themes with pagination', async () => {
      const mockResponse: ThemeListResponse = {
        themes: [],
        total: 25,
        page: 2,
        page_size: 15,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await themeApi.listThemes({ page: 2, page_size: 15 });

      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith('/themes', {
        params: { page: 2, page_size: 15 },
      });
    });

    it('should fetch themes including system themes', async () => {
      const mockResponse: ThemeListResponse = {
        themes: [],
        total: 10,
        page: 1,
        page_size: 10,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await themeApi.listThemes({ include_system: true });

      expect(result).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith('/themes', {
        params: { include_system: true },
      });
    });

    it('should handle error when fetching themes', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Network error'));

      await expect(themeApi.listThemes()).rejects.toThrow('Network error');
    });
  });

  describe('getTheme', () => {
    it('should fetch theme by id successfully', async () => {
      const mockTheme: Theme = {
        id: 2,
        organization_id: 1,
        name: 'custom-theme',
        display_name: 'Custom Theme',
        description: 'A custom branded theme',
        is_system_theme: false,
        is_active: false,
        colors: mockColors,
        typography: {
          fontFamily: 'Inter, sans-serif',
          fontSize: { base: '16px', lg: '18px' },
        },
        spacing: { sm: '0.5rem', md: '1rem', lg: '2rem' },
        created_at: '2025-01-05T00:00:00Z',
        updated_at: '2025-01-05T00:00:00Z',
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockTheme } as any);

      const result = await themeApi.getTheme(2);

      expect(result).toEqual(mockTheme);
      expect(apiClient.get).toHaveBeenCalledWith('/themes/2');
    });

    it('should handle not found error', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Theme not found'));

      await expect(themeApi.getTheme(999)).rejects.toThrow('Theme not found');
    });
  });

  describe('getActiveTheme', () => {
    it('should fetch active theme successfully', async () => {
      const mockTheme: Theme = {
        id: 1,
        organization_id: 1,
        name: 'default',
        display_name: 'Default Theme',
        is_system_theme: true,
        is_active: true,
        colors: mockColors,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockTheme } as any);

      const result = await themeApi.getActiveTheme();

      expect(result).toEqual(mockTheme);
      expect(result.is_active).toBe(true);
      expect(apiClient.get).toHaveBeenCalledWith('/themes/active');
    });

    it('should handle no active theme error', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('No active theme set'));

      await expect(themeApi.getActiveTheme()).rejects.toThrow('No active theme set');
    });
  });

  describe('createTheme', () => {
    it('should create theme successfully', async () => {
      const createData: ThemeCreate = {
        name: 'brand-theme',
        display_name: 'Brand Theme',
        description: 'Company brand colors',
        colors: mockColors,
      };

      const mockCreatedTheme: Theme = {
        id: 3,
        organization_id: 1,
        name: 'brand-theme',
        display_name: 'Brand Theme',
        description: 'Company brand colors',
        is_system_theme: false,
        is_active: false,
        colors: mockColors,
        created_at: '2025-01-10T00:00:00Z',
        updated_at: '2025-01-10T00:00:00Z',
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockCreatedTheme } as any);

      const result = await themeApi.createTheme(createData);

      expect(result).toEqual(mockCreatedTheme);
      expect(apiClient.post).toHaveBeenCalledWith('/themes', createData);
    });

    it('should handle duplicate theme name error', async () => {
      const createData: ThemeCreate = {
        name: 'default',
        display_name: 'Duplicate',
        colors: mockColors,
      };

      vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Theme name already exists'));

      await expect(themeApi.createTheme(createData)).rejects.toThrow('Theme name already exists');
    });

    it('should handle invalid color format error', async () => {
      const createData: ThemeCreate = {
        name: 'bad-theme',
        display_name: 'Bad Theme',
        colors: { ...mockColors, primary: 'not-a-color' },
      };

      vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Invalid color format'));

      await expect(themeApi.createTheme(createData)).rejects.toThrow('Invalid color format');
    });
  });

  describe('updateTheme', () => {
    it('should update theme successfully', async () => {
      const updateData: ThemeUpdate = {
        display_name: 'Updated Theme Name',
        description: 'Updated description',
        colors: { ...mockColors, primary: '#ff0000' },
      };

      const mockUpdatedTheme: Theme = {
        id: 3,
        organization_id: 1,
        name: 'brand-theme',
        display_name: 'Updated Theme Name',
        description: 'Updated description',
        is_system_theme: false,
        is_active: false,
        colors: { ...mockColors, primary: '#ff0000' },
        created_at: '2025-01-10T00:00:00Z',
        updated_at: '2025-01-11T00:00:00Z',
      };

      vi.mocked(apiClient.put).mockResolvedValueOnce({ data: mockUpdatedTheme } as any);

      const result = await themeApi.updateTheme(3, updateData);

      expect(result).toEqual(mockUpdatedTheme);
      expect(apiClient.put).toHaveBeenCalledWith('/themes/3', updateData);
    });

    it('should handle system theme modification error', async () => {
      const updateData: ThemeUpdate = {
        display_name: 'Cannot Update',
      };

      vi.mocked(apiClient.put).mockRejectedValueOnce(new Error('Cannot modify system theme'));

      await expect(themeApi.updateTheme(1, updateData)).rejects.toThrow('Cannot modify system theme');
    });
  });

  describe('deleteTheme', () => {
    it('should delete theme successfully', async () => {
      vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: undefined } as any);

      await themeApi.deleteTheme(3);

      expect(apiClient.delete).toHaveBeenCalledWith('/themes/3');
    });

    it('should handle active theme deletion error', async () => {
      vi.mocked(apiClient.delete).mockRejectedValueOnce(new Error('Cannot delete active theme'));

      await expect(themeApi.deleteTheme(1)).rejects.toThrow('Cannot delete active theme');
    });

    it('should handle system theme deletion error', async () => {
      vi.mocked(apiClient.delete).mockRejectedValueOnce(new Error('Cannot delete system theme'));

      await expect(themeApi.deleteTheme(1)).rejects.toThrow('Cannot delete system theme');
    });
  });

  describe('setActiveTheme', () => {
    it('should activate theme successfully', async () => {
      const mockActivatedTheme: Theme = {
        id: 3,
        organization_id: 1,
        name: 'brand-theme',
        display_name: 'Brand Theme',
        is_system_theme: false,
        is_active: true,
        colors: mockColors,
        created_at: '2025-01-10T00:00:00Z',
        updated_at: '2025-01-12T00:00:00Z',
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockActivatedTheme } as any);

      const result = await themeApi.setActiveTheme(3);

      expect(result).toEqual(mockActivatedTheme);
      expect(result.is_active).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith('/themes/3/activate');
    });

    it('should handle theme not found error', async () => {
      vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Theme not found'));

      await expect(themeApi.setActiveTheme(999)).rejects.toThrow('Theme not found');
    });
  });

  describe('exportTheme', () => {
    it('should export theme successfully', async () => {
      const mockExport = {
        name: 'brand-theme',
        version: '1.0.0',
        colors: mockColors,
        typography: { fontFamily: 'Inter' },
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockExport } as any);

      const result = await themeApi.exportTheme(3);

      expect(result).toEqual(mockExport);
      expect(apiClient.get).toHaveBeenCalledWith('/themes/3/export');
    });

    it('should handle export error', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Export failed'));

      await expect(themeApi.exportTheme(3)).rejects.toThrow('Export failed');
    });
  });

  describe('getCSSVariables', () => {
    it('should fetch CSS variables successfully', async () => {
      const mockCSSResponse = {
        css: ':root { --primary: #0066cc; --secondary: #6c757d; }',
        variables: {
          '--primary': '#0066cc',
          '--secondary': '#6c757d',
          '--background': '#ffffff',
        },
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockCSSResponse } as any);

      const result = await themeApi.getCSSVariables(1);

      expect(result).toEqual(mockCSSResponse);
      expect(result.css).toContain('--primary');
      expect(result.variables['--primary']).toBe('#0066cc');
      expect(apiClient.get).toHaveBeenCalledWith('/themes/1/css-variables');
    });

    it('should handle theme not found error', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Theme not found'));

      await expect(themeApi.getCSSVariables(999)).rejects.toThrow('Theme not found');
    });
  });
});
