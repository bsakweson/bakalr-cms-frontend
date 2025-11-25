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
  id: number;
  organization_id: number;
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
    const response = await apiClient.get('/api/v1/themes', { params });
    return response.data;
  },

  async getTheme(id: number): Promise<Theme> {
    const response = await apiClient.get(`/api/v1/themes/${id}`);
    return response.data;
  },

  async getActiveTheme(): Promise<Theme> {
    const response = await apiClient.get('/api/v1/themes/active');
    return response.data;
  },

  async createTheme(data: ThemeCreate): Promise<Theme> {
    const response = await apiClient.post('/api/v1/themes', data);
    return response.data;
  },

  async updateTheme(id: number, data: ThemeUpdate): Promise<Theme> {
    const response = await apiClient.put(`/api/v1/themes/${id}`, data);
    return response.data;
  },

  async deleteTheme(id: number): Promise<void> {
    await apiClient.delete(`/api/v1/themes/${id}`);
  },

  async setActiveTheme(id: number): Promise<Theme> {
    const response = await apiClient.post(`/api/v1/themes/${id}/activate`);
    return response.data;
  },

  async exportTheme(id: number): Promise<Record<string, any>> {
    const response = await apiClient.get(`/api/v1/themes/${id}/export`);
    return response.data;
  },

  async getCSSVariables(id: number): Promise<{ css: string; variables: Record<string, string> }> {
    const response = await apiClient.get(`/api/v1/themes/${id}/css-variables`);
    return response.data;
  },
};
