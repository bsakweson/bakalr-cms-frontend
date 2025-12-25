'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useAccessToken } from '@/hooks/use-access-token';
import Link from 'next/link';
import { 
  getDashboardStats, 
  getRecentOrders, 
  getRecentActivity,
  formatCurrency,
  formatTimeAgo,
  type DashboardStats,
  type Order,
  type RecentActivity,
} from '@/lib/api/platform';
import { StatCard, LoadingSpinner, StatusBadge, getStatusVariant } from '@/components/boutique-admin/ui';

export default function BoutiqueAdminDashboard() {
  const { user } = useAuth();
  const token = useAccessToken();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for token to be available (null means not yet hydrated)
    if (token === null) {
      return;
    }

    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);

        const [statsData, ordersData, activityData] = await Promise.all([
          getDashboardStats(token || undefined),
          getRecentOrders(token || undefined, 5),
          getRecentActivity(token || undefined),
        ]);

        setStats(statsData);
        setRecentOrders(ordersData);
        setRecentActivity(activityData);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="text-destructive mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  const modules = [
    {
      name: 'Orders',
      href: '/dashboard/boutique-admin/orders',
      icon: '📋',
      description: 'Manage customer orders',
      stat: stats?.orders.total || 0,
      statLabel: 'Total Orders',
      color: 'from-blue-500 to-blue-600',
    },
    {
      name: 'Customers',
      href: '/dashboard/boutique-admin/customers',
      icon: '👥',
      description: 'Customer management',
      stat: stats?.customers.total || 0,
      statLabel: 'Total Customers',
      color: 'from-green-500 to-green-600',
    },
    {
      name: 'Inventory',
      href: '/dashboard/inventory',
      icon: '📦',
      description: 'Stock management',
      stat: stats?.inventory.lowStockCount || 0,
      statLabel: 'Low Stock Items',
      color: 'from-amber-500 to-amber-600',
    },
    {
      name: 'Employees',
      href: '/dashboard/boutique-admin/employees',
      icon: '👤',
      description: 'Staff management',
      stat: stats?.employees.total || 0,
      statLabel: 'Total Employees',
      color: 'from-purple-500 to-purple-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Boutique Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.full_name || user?.email}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/boutique-admin/analytics"
            className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            View Analytics
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats?.revenue.total || 0, stats?.revenue.currency || 'USD')}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Orders Today"
          value={stats?.orders.today || 0}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          }
        />
        <StatCard
          title="Pending Orders"
          value={stats?.orders.pending || 0}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Low Stock Items"
          value={stats?.inventory.lowStockCount || 0}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
      </div>

      {/* Module Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((module) => (
            <Link
              key={module.name}
              href={module.href}
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 hover:border-primary/50 transition-all"
            >
              <div className={`absolute inset-0 bg-linear-to-br ${module.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
              <div className="relative">
                <div className="text-3xl mb-3">{module.icon}</div>
                <h3 className="font-semibold">{module.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                <div className="mt-4 pt-4 border-t border-border">
                  <span className="text-2xl font-bold">{module.stat.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground ml-2">{module.statLabel}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="rounded-xl border border-border bg-card">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold">Recent Orders</h2>
            <Link
              href="/dashboard/boutique-admin/orders"
              className="text-sm text-primary hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No recent orders
              </div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Order #{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.customerName || order.customerEmail || 'Guest'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(order.totalAmount, order.currencyCode)}
                      </p>
                      <StatusBadge 
                        status={order.status} 
                        variant={getStatusVariant(order.status)} 
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-border bg-card">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold">Recent Activity</h2>
          </div>
          <div className="divide-y divide-border">
            {recentActivity.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No recent activity
              </div>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{activity.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.details}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
