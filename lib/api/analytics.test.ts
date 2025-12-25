import { analyticsApi } from './analytics';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the apiClient
vi.mock('./client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import apiClient from './client';

describe('Analytics API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getContentStats', () => {
    it('should fetch content statistics', async () => {
      const mockStats = {
        total_entries: 150,
        published: 120,
        draft: 25,
        archived: 5,
        by_type: {
          blog_post: 80,
          page: 40,
          product: 30,
        },
        recent_updates: 15,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockStats } as any);

      const result = await analyticsApi.getContentStats();

      expect(result).toEqual(mockStats);
      expect(apiClient.get).toHaveBeenCalledWith('/analytics/content');
    });

    it('should handle API errors when fetching content stats', async () => {
      const mockError = new Error('Failed to fetch content stats');
      vi.mocked(apiClient.get).mockRejectedValueOnce(mockError);

      await expect(analyticsApi.getContentStats()).rejects.toThrow('Failed to fetch content stats');
      expect(apiClient.get).toHaveBeenCalledWith('/analytics/content');
    });
  });

  describe('getUserStats', () => {
    it('should fetch user statistics', async () => {
      const mockStats = {
        total_users: 45,
        active_users: 38,
        admins: 5,
        editors: 15,
        viewers: 23,
        new_this_month: 8,
        last_login_stats: {
          today: 12,
          this_week: 28,
          this_month: 35,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockStats } as any);

      const result = await analyticsApi.getUserStats();

      expect(result).toEqual(mockStats);
      expect(apiClient.get).toHaveBeenCalledWith('/analytics/users');
    });

    it('should handle empty user stats', async () => {
      const mockStats = {
        total_users: 0,
        active_users: 0,
        admins: 0,
        editors: 0,
        viewers: 0,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockStats } as any);

      const result = await analyticsApi.getUserStats();

      expect(result).toEqual(mockStats);
      expect(result.total_users).toBe(0);
    });
  });

  describe('getMediaStats', () => {
    it('should fetch media statistics', async () => {
      const mockStats = {
        total_media: 320,
        total_size_mb: 500,
        media_by_type: [
          { type: 'image', count: 250 },
          { type: 'video', count: 15 },
          { type: 'audio', count: 10 },
          { type: 'document', count: 45 },
        ],
        recent_uploads: [
          {
            id: '1',
            filename: 'photo.jpg',
            mime_type: 'image/jpeg',
            size: 2048000,
            created_at: '2025-11-28T10:30:00Z',
          },
        ],
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockStats } as any);

      const result = await analyticsApi.getMediaStats();

      expect(result).toEqual(mockStats);
      expect(apiClient.get).toHaveBeenCalledWith('/analytics/media');
      expect(result.total_media).toBe(320);
      expect(result.total_size_mb).toBe(500);
    });

    it('should handle media stats with zero files', async () => {
      const mockStats = {
        total_media: 0,
        total_size_mb: 0,
        media_by_type: [],
        recent_uploads: [],
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockStats } as any);

      const result = await analyticsApi.getMediaStats();

      expect(result.total_media).toBe(0);
      expect(result.total_size_mb).toBe(0);
    });
  });

  describe('getActivityStats', () => {
    it('should fetch activity statistics', async () => {
      const mockStats = {
        actions_today: 45,
        actions_7d: 234,
        actions_30d: 1024,
        recent_activities: [
          {
            id: '1',
            action: 'created',
            resource_type: 'content',
            description: 'Created new blog post',
            user_name: 'John Doe',
            created_at: '2025-11-28T10:30:00Z',
          },
          {
            id: '2',
            action: 'updated',
            resource_type: 'media',
            description: 'Updated media file',
            user_name: 'Jane Smith',
            created_at: '2025-11-28T10:15:00Z',
          },
        ],
        actions_by_type: [
          { action: 'created', count: 23 },
          { action: 'updated', count: 18 },
        ],
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockStats } as any);

      const result = await analyticsApi.getActivityStats();

      expect(result).toEqual(mockStats);
      expect(apiClient.get).toHaveBeenCalledWith('/analytics/activity');
      expect(result.recent_activities).toHaveLength(2);
      expect(result.actions_by_type).toHaveLength(2);
    });

    it('should handle empty activity stats', async () => {
      const mockStats = {
        actions_today: 0,
        actions_7d: 0,
        actions_30d: 0,
        recent_activities: [],
        actions_by_type: [],
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockStats } as any);

      const result = await analyticsApi.getActivityStats();

      expect(result.recent_activities).toHaveLength(0);
      expect(result.actions_today).toBe(0);
    });
  });

  describe('getTrends', () => {
    it('should fetch trend data with default 30 days', async () => {
      const mockTrends = {
        content_trend: [
          { date: '2025-11-01', value: 10 },
          { date: '2025-11-02', value: 12 },
          { date: '2025-11-03', value: 15 },
        ],
        user_trend: [
          { date: '2025-11-01', value: 25 },
          { date: '2025-11-02', value: 28 },
        ],
        activity_trend: [
          { date: '2025-11-01', value: 8 },
          { date: '2025-11-02', value: 12 },
        ],
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockTrends } as any);

      const result = await analyticsApi.getTrends();

      expect(result).toEqual(mockTrends);
      expect(apiClient.get).toHaveBeenCalledWith('/analytics/trends', {
        params: { days: 30 },
      });
    });

    it('should fetch trend data with custom days parameter', async () => {
      const mockTrends = {
        content_trend: [
          { date: '2025-11-21', value: 18 },
          { date: '2025-11-22', value: 20 },
        ],
        user_trend: [],
        activity_trend: [],
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockTrends } as any);

      const result = await analyticsApi.getTrends(7);

      expect(result).toEqual(mockTrends);
      expect(apiClient.get).toHaveBeenCalledWith('/analytics/trends', {
        params: { days: 7 },
      });
    });

    it('should fetch trend data for 90 days', async () => {
      const mockTrends = {
        content_trend: [],
        user_trend: [],
        activity_trend: [],
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockTrends } as any);

      await analyticsApi.getTrends(90);

      expect(apiClient.get).toHaveBeenCalledWith('/analytics/trends', {
        params: { days: 90 },
      });
    });

    it('should handle empty trend data', async () => {
      const mockTrends = {
        content_trend: [],
        user_trend: [],
        activity_trend: [],
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockTrends } as any);

      const result = await analyticsApi.getTrends(30);

      expect(result.content_trend).toHaveLength(0);
      expect(result.user_trend).toHaveLength(0);
    });
  });

  describe('getOverview', () => {
    it('should fetch complete dashboard overview', async () => {
      const mockOverview = {
        content_stats: {
          total_entries: 150,
          published: 120,
          draft: 25,
          archived: 5,
          by_content_type: [{ type: 'blog_post', count: 80 }],
          recent_entries: [],
        },
        user_stats: {
          total_users: 45,
          active_users_7d: 38,
          active_users_30d: 40,
          new_users_7d: 5,
          new_users_30d: 8,
          top_contributors: [
            { id: '1', name: 'John Doe', email: 'john@example.com', entries_count: 42 },
            { id: '2', name: 'Jane Smith', email: 'jane@example.com', entries_count: 38 },
          ],
        },
        media_stats: {
          total_media: 320,
          total_size_mb: 500,
          media_by_type: [{ type: 'image', count: 250 }],
          recent_uploads: [],
        },
        activity_stats: {
          actions_today: 45,
          actions_7d: 234,
          actions_30d: 1024,
          recent_activities: [],
          actions_by_type: [],
        },
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockOverview } as any);

      const result = await analyticsApi.getOverview();

      expect(result).toEqual(mockOverview);
      expect(apiClient.get).toHaveBeenCalledWith('/analytics/overview');
      expect(result.content_stats.total_entries).toBe(150);
      expect(result.user_stats.total_users).toBe(45);
      expect(result.media_stats.total_media).toBe(320);
    });

    it('should handle overview with minimal data', async () => {
      const mockOverview = {
        content_stats: {
          total_entries: 0,
          published: 0,
          draft: 0,
          archived: 0,
          by_content_type: [],
          recent_entries: [],
        },
        user_stats: {
          total_users: 1,
          active_users_7d: 1,
          active_users_30d: 1,
          new_users_7d: 0,
          new_users_30d: 1,
          top_contributors: [],
        },
        media_stats: {
          total_media: 0,
          total_size_mb: 0,
          media_by_type: [],
          recent_uploads: [],
        },
        activity_stats: {
          actions_today: 0,
          actions_7d: 0,
          actions_30d: 0,
          recent_activities: [],
          actions_by_type: [],
        },
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockOverview } as any);

      const result = await analyticsApi.getOverview();

      expect(result.content_stats.total_entries).toBe(0);
      expect(result.user_stats.total_users).toBe(1);
      expect(result.activity_stats.recent_activities).toHaveLength(0);
    });

    it('should handle API errors when fetching overview', async () => {
      const mockError = new Error('Network error');
      vi.mocked(apiClient.get).mockRejectedValueOnce(mockError);

      await expect(analyticsApi.getOverview()).rejects.toThrow('Network error');
      expect(apiClient.get).toHaveBeenCalledWith('/analytics/overview');
    });
  });
});
