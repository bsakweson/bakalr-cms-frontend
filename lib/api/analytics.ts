import apiClient from './client';
import {
  ContentStats,
  UserStats,
  MediaStats,
  ActivityStats,
  TrendsResponse,
  DashboardOverview,
} from '@/types';

export const analyticsApi = {
  // Get content statistics
  getContentStats: async (): Promise<ContentStats> => {
    const response = await apiClient.get('/analytics/content');
    return response.data;
  },

  // Get user statistics
  getUserStats: async (): Promise<UserStats> => {
    const response = await apiClient.get('/analytics/users');
    return response.data;
  },

  // Get media statistics
  getMediaStats: async (): Promise<MediaStats> => {
    const response = await apiClient.get('/analytics/media');
    return response.data;
  },

  // Get activity statistics
  getActivityStats: async (): Promise<ActivityStats> => {
    const response = await apiClient.get('/analytics/activity');
    return response.data;
  },

  // Get trend data for charts
  getTrends: async (days: number = 30): Promise<TrendsResponse> => {
    const response = await apiClient.get('/analytics/trends', {
      params: { days },
    });
    return response.data;
  },

  // Get complete dashboard overview
  getOverview: async (): Promise<DashboardOverview> => {
    const response = await apiClient.get('/analytics/overview');
    return response.data;
  },
};
