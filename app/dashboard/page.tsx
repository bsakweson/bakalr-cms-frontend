'use client';

import { useEffect, useState } from 'react';
import { analyticsApi } from '@/lib/api';
import {
  ContentStats,
  UserStats,
  MediaStats,
  ActivityStats,
  TrendsResponse,
} from '@/types';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function DashboardPage() {
  const { user } = useAuth();
  const [contentStats, setContentStats] = useState<ContentStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [mediaStats, setMediaStats] = useState<MediaStats | null>(null);
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(null);
  const [trends, setTrends] = useState<TrendsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [content, users, media, activity, trendsData] = await Promise.all([
        analyticsApi.getContentStats(),
        analyticsApi.getUserStats(),
        analyticsApi.getMediaStats(),
        analyticsApi.getActivityStats(),
        analyticsApi.getTrends(30),
      ]);

      setContentStats(content);
      setUserStats(users);
      setMediaStats(media);
      setActivityStats(activity);
      setTrends(trendsData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your content, users, and activity
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Content Metrics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Content</CardTitle>
            <span className="text-2xl">📝</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contentStats?.total_entries || 0}</div>
            <div className="mt-2 flex gap-3 text-xs">
              <div>
                <span className="text-green-600 font-medium">
                  {contentStats?.published_entries || 0}
                </span>{' '}
                <span className="text-muted-foreground">published</span>
              </div>
              <div>
                <span className="text-yellow-600 font-medium">
                  {contentStats?.draft_entries || 0}
                </span>{' '}
                <span className="text-muted-foreground">drafts</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Metrics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <span className="text-2xl">👥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.total_users || 0}</div>
            <div className="mt-2 text-xs">
              <div>
                <span className="text-blue-600 font-medium">
                  {userStats?.active_users_7d || 0}
                </span>{' '}
                <span className="text-muted-foreground">active (7d)</span>
              </div>
              <div className="mt-1">
                <span className="text-green-600 font-medium">
                  +{userStats?.new_users_7d || 0}
                </span>{' '}
                <span className="text-muted-foreground">new this week</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Media Metrics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Media Files</CardTitle>
            <span className="text-2xl">🖼️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mediaStats?.total_media || 0}</div>
            <p className="mt-2 text-xs text-muted-foreground">
              <span className="font-medium">{mediaStats?.total_size_mb?.toFixed(1) || 0} MB</span>{' '}
              total storage
            </p>
          </CardContent>
        </Card>

        {/* Activity Metrics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actions (30d)</CardTitle>
            <span className="text-2xl">⚡</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activityStats?.actions_30d || 0}</div>
            <div className="mt-2 text-xs">
              <div>
                <span className="text-purple-600 font-medium">
                  {activityStats?.actions_today || 0}
                </span>{' '}
                <span className="text-muted-foreground">today</span>
              </div>
              <div className="mt-1">
                <span className="text-orange-600 font-medium">
                  {activityStats?.actions_7d || 0}
                </span>{' '}
                <span className="text-muted-foreground">this week</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1: Trends */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Content Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Content Creation (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trends?.content_trend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activity Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Trend (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trends?.activity_trend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Content by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Content by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {contentStats && contentStats.entries_by_type.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={contentStats.entries_by_type}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {contentStats.entries_by_type.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No content data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Top Actions (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            {activityStats && activityStats.actions_by_type.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={activityStats.actions_by_type.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="action" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No activity data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Top Contributors */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {activityStats?.recent_activities.slice(0, 10).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 bg-muted rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {activity.description || activity.resource_type}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.user_name} •{' '}
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              {(!activityStats?.recent_activities ||
                activityStats.recent_activities.length === 0) && (
                <div className="text-center text-muted-foreground py-8">
                  No recent activity
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Contributors */}
        <Card>
          <CardHeader>
            <CardTitle>Top Contributors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userStats?.top_contributors.map((contributor, index) => (
                <div
                  key={contributor.id}
                  className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {contributor.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {contributor.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{contributor.entries_count}</p>
                    <p className="text-xs text-muted-foreground">entries</p>
                  </div>
                </div>
              ))}
              {(!userStats?.top_contributors ||
                userStats.top_contributors.length === 0) && (
                <div className="text-center text-muted-foreground py-8">
                  No contributors yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
