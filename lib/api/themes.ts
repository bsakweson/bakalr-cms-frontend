import { apiClient } from './client';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent?: string;
  background: string;
  foreground: string;
  muted?: string;
  'muted-foreground'?: string;
  card?: string;
  'card-foreground'?: string;
  border?: string;
  input?: string;
  ring?: string;
  destructive?: string;
  'destructive-foreground'?: string;
}

export interface ThemeTypography {
  fontFamily?: string;
  fontSize?: Record<string, string>;
  fontWeight?: Record<string, string | number>;
  lineHeight?: Record<string, string | number>;
}

export interface Theme {
  id: string;
  organization_id: string;
  name: string;
  display_name: string;
  description?: string;
  is_system_theme: boolean;
  is_active: boolean;
  colors: ThemeColors;
  typography?: ThemeTypography;
  spacing?: Record<string, string>;
  borderRadius?: Record<string, string>;
  shadows?: Record<string, string>;
  custom_properties?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ThemeCreate {
  name: string;
  display_name: string;
  description?: string;
  colors: ThemeColors;
  typography?: ThemeTypography;
  spacing?: Record<string, string>;
  borderRadius?: Record<string, string>;
  shadows?: Record<string, string>;
  custom_properties?: Record<string, any>;
}

export interface ThemeUpdate {
  display_name?: string;
  description?: string;
  colors?: ThemeColors;
  typography?: ThemeTypography;
  spacing?: Record<string, string>;
  borderRadius?: Record<string, string>;
  shadows?: Record<string, string>;
  custom_properties?: Record<string, any>;
}

export interface ThemeListResponse {
  themes: Theme[];
  total: number;
  page: number;
  page_size: number;
}

export const themeApi = {
  async listThemes(params?: {
    page?: number;
    page_size?: number;
    include_system?: boolean;
  }): Promise<ThemeListResponse> {
    const response = await apiClient.get('/themes', { params });
    return response.data;
  },

  async getTheme(id: string): Promise<Theme> {
    const response = await apiClient.get(`/themes/${id}`);
    return response.data;
  },

  async getActiveTheme(): Promise<Theme> {
    const response = await apiClient.get('/themes/active/current');
    return response.data;
  },

  async createTheme(data: ThemeCreate): Promise<Theme> {
    const response = await apiClient.post('/themes', data);
    return response.data;
  },

  async updateTheme(id: string, data: ThemeUpdate): Promise<Theme> {
    const response = await apiClient.put(`/themes/${id}`, data);
    return response.data;
  },

  async deleteTheme(id: string): Promise<void> {
    await apiClient.delete(`/themes/${id}`);
  },

  async setActiveTheme(id: string): Promise<Theme> {
    const response = await apiClient.post(`/themes/${id}/activate`);
    return response.data;
  },

  async deactivateTheme(id: string): Promise<Theme> {
    const response = await apiClient.post(`/themes/${id}/deactivate`);
    return response.data;
  },

  async exportTheme(id: string): Promise<Record<string, any>> {
    const response = await apiClient.get(`/themes/${id}/export`);
    return response.data;
  },

  async getCSSVariables(id: string): Promise<{ css: string; variables: Record<string, string> }> {
    const response = await apiClient.get(`/themes/${id}/css-variables`);
    return response.data;
  },
};
