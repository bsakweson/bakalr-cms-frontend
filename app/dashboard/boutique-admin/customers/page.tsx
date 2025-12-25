'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAccessToken } from '@/hooks/use-access-token';
import { 
  getCustomers, 
  getCustomerStats,
  formatCurrency,
  type Customer,
} from '@/lib/api/platform';
import { 
  LoadingSpinner, 
  PageHeader, 
  StatCard, 
  DataTable, 
  SearchInput,
  StatusBadge,
  getStatusVariant,
  type Column,
} from '@/components/boutique-admin/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function CustomersPage() {
  const token = useAccessToken();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<{ total: number; new: number; active: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('customers');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchCustomers = useCallback(async () => {
    // Wait for token to be available
    if (token === null) return;
    
    try {
      setLoading(true);
      const response = await getCustomers(token || undefined, {
        page,
        size: 20,
        search: searchQuery || undefined,
        sort: 'createdAt,desc',
      });
      setCustomers(response.content || []);
      setTotalPages(response.totalPages || 0);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [token, page, searchQuery]);

  const fetchStats = useCallback(async () => {
    // Wait for token to be available
    if (token === null) return;
    
    try {
      const statsData = await getCustomerStats(token || undefined);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch customer stats:', error);
    }
  }, [token]);

  useEffect(() => {
    fetchCustomers();
    fetchStats();
  }, [fetchCustomers, fetchStats]);

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      header: 'Customer',
      render: (customer) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {customer.firstName?.[0]}{customer.lastName?.[0]}
            </span>
          </div>
          <div>
            <p className="font-medium">{customer.firstName} {customer.lastName}</p>
            <p className="text-sm text-muted-foreground">{customer.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (customer) => (
        <span className="text-muted-foreground">{customer.phone || '-'}</span>
      ),
    },
    {
      key: 'totalOrders',
      header: 'Orders',
      render: (customer) => (
        <span>{customer.totalOrders || 0}</span>
      ),
    },
    {
      key: 'totalSpent',
      header: 'Total Spent',
      render: (customer) => (
        <span className="font-medium">
          {formatCurrency(customer.totalSpent || 0)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (customer) => (
        <StatusBadge 
          status={customer.status} 
          variant={getStatusVariant(customer.status)} 
        />
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (customer) => (
        <span className="text-muted-foreground">
          {new Date(customer.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (customer) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedCustomer(customer);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        icon={
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        }
        title="Customers"
        description="Manage customer accounts and relationships"
        actions={
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Customer
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Customers"
          value={(stats?.total || 0).toLocaleString()}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatCard
          title="New This Month"
          value={(stats?.new || 0).toLocaleString()}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          }
        />
        <StatCard
          title="Active Customers"
          value={(stats?.active || 0).toLocaleString()}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="customers">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Customers
          </TabsTrigger>
          <TabsTrigger value="segments">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            Segments
          </TabsTrigger>
          <TabsTrigger value="loyalty">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Loyalty
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="mt-6">
          {/* Search */}
          <div className="flex items-center gap-4 mb-6">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search customers..."
              className="w-64"
            />
          </div>

          <DataTable
            columns={columns}
            data={customers}
            loading={loading}
            emptyMessage="No customers found"
            onRowClick={(customer) => setSelectedCustomer(customer)}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="segments" className="mt-6">
          <div className="text-center py-12 text-muted-foreground">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            <h3 className="text-lg font-medium">Customer Segments</h3>
            <p className="mt-1">Create segments to group customers based on behavior and attributes.</p>
            <Button className="mt-4">Create Segment</Button>
          </div>
        </TabsContent>

        <TabsContent value="loyalty" className="mt-6">
          <div className="text-center py-12 text-muted-foreground">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium">Loyalty Program</h3>
            <p className="mt-1">Set up rewards and loyalty points for your customers.</p>
            <Button className="mt-4">Configure Loyalty</Button>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="text-center py-12 text-muted-foreground">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-lg font-medium">Customer Analytics</h3>
            <p className="mt-1">View insights about customer behavior and trends.</p>
            <Button className="mt-4">View Reports</Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Customer Details Modal */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedCustomer?.firstName} {selectedCustomer?.lastName}
            </DialogTitle>
            <DialogDescription>
              Customer since {selectedCustomer && new Date(selectedCustomer.createdAt).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedCustomer.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedCustomer.phone || '-'}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold">{selectedCustomer.totalOrders}</p>
                  <p className="text-sm text-muted-foreground">Orders</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{formatCurrency(selectedCustomer.totalSpent)}</p>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                </div>
                <div className="text-center">
                  <StatusBadge 
                    status={selectedCustomer.status} 
                    variant={getStatusVariant(selectedCustomer.status)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">Status</p>
                </div>
              </div>

              {/* Tags */}
              {selectedCustomer.tags && selectedCustomer.tags.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCustomer.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-muted rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-border">
                <Button variant="outline">View Orders</Button>
                <Button variant="outline">Send Email</Button>
                <Button variant="outline">Edit Customer</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
