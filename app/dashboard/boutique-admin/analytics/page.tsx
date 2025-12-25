'use client';

import { useState, useEffect } from 'react';
import { useAccessToken } from '@/hooks/use-access-token';
import { getOrderStats, getTotalRevenue, formatCurrency, type OrderStats } from '@/lib/api/platform';
import { PageHeader, StatCard, LoadingSpinner } from '@/components/boutique-admin/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

export default function AnalyticsPage() {
  const token = useAccessToken();
  const [activeTab, setActiveTab] = useState('overview');
  const [period, setPeriod] = useState('last_30_days');
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [revenue, setRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for token to be available (null = loading, undefined = no token)
    if (token === null) return;
    
    async function fetchData() {
      try {
        setLoading(true);
        const [orderStats, totalRevenue] = await Promise.all([
          getOrderStats(token || undefined),
          getTotalRevenue(token || undefined),
        ]);
        setStats(orderStats);
        setRevenue(totalRevenue);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [token, period]);

  const periods = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last_7_days', label: 'Last 7 days' },
    { value: 'last_30_days', label: 'Last 30 days' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        icon={
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        }
        title="Analytics"
        description="Track your store performance and insights"
        actions={
          <div className="flex gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg bg-background text-sm"
            >
              {periods.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <Button variant="outline">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Report
            </Button>
          </div>
        }
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(revenue)}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          trend={{ value: 12, label: 'vs last period', isPositive: true }}
        />
        <StatCard
          title="Total Orders"
          value={stats?.totalOrders || 0}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          }
          trend={{ value: 8, label: 'vs last period', isPositive: true }}
        />
        <StatCard
          title="Avg. Order Value"
          value={formatCurrency(stats?.totalOrders ? revenue / stats.totalOrders : 0)}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          title="Conversion Rate"
          value="3.2%"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          trend={{ value: 0.5, label: 'vs last period', isPositive: true }}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart Placeholder */}
            <div className="border border-border rounded-lg p-6">
              <h3 className="font-semibold mb-4">Revenue Over Time</h3>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                  <p>Revenue chart coming soon</p>
                </div>
              </div>
            </div>

            {/* Orders Chart Placeholder */}
            <div className="border border-border rounded-lg p-6">
              <h3 className="font-semibold mb-4">Orders Over Time</h3>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p>Orders chart coming soon</p>
                </div>
              </div>
            </div>

            {/* Order Status Breakdown */}
            <div className="border border-border rounded-lg p-6">
              <h3 className="font-semibold mb-4">Order Status</h3>
              <div className="space-y-3">
                {[
                  { label: 'Pending', value: stats?.pendingOrders || 0, color: 'bg-yellow-500' },
                  { label: 'Confirmed', value: stats?.confirmedOrders || 0, color: 'bg-blue-500' },
                  { label: 'Shipped', value: stats?.shippedOrders || 0, color: 'bg-purple-500' },
                  { label: 'Delivered', value: stats?.deliveredOrders || 0, color: 'bg-green-500' },
                  { label: 'Cancelled', value: stats?.cancelledOrders || 0, color: 'bg-red-500' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <span>{item.label}</span>
                    </div>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Products Placeholder */}
            <div className="border border-border rounded-lg p-6">
              <h3 className="font-semibold mb-4">Top Selling Products</h3>
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                <p>Product rankings coming soon</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="mt-6">
          <div className="text-center py-12 text-muted-foreground">
            <h3 className="text-lg font-medium">Sales Analytics</h3>
            <p className="mt-1">Detailed sales breakdown and trends.</p>
          </div>
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <div className="text-center py-12 text-muted-foreground">
            <h3 className="text-lg font-medium">Product Analytics</h3>
            <p className="mt-1">Product performance and inventory insights.</p>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="mt-6">
          <div className="text-center py-12 text-muted-foreground">
            <h3 className="text-lg font-medium">Customer Analytics</h3>
            <p className="mt-1">Customer behavior and retention metrics.</p>
          </div>
        </TabsContent>

        <TabsContent value="traffic" className="mt-6">
          <div className="text-center py-12 text-muted-foreground">
            <h3 className="text-lg font-medium">Traffic Analytics</h3>
            <p className="mt-1">Website traffic and visitor insights.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
