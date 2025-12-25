'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAccessToken } from '@/hooks/use-access-token';
import { 
  getOrders, 
  getOrderStats,
  updateOrderStatus,
  formatCurrency,
  formatTimeAgo,
  type Order,
  type OrderStats,
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

const ORDER_STATUSES = ['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function OrdersPage() {
  const token = useAccessToken();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchOrders = useCallback(async () => {
    // Wait for token to be available
    if (token === null) return;
    
    try {
      setLoading(true);
      const response = await getOrders(token || undefined, {
        page,
        size: 20,
        status: activeTab !== 'all' ? activeTab : undefined,
        search: searchQuery || undefined,
        sort: 'createdAt,desc',
      });
      setOrders(response.content || []);
      setTotalPages(response.totalPages || 0);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [token, page, activeTab, searchQuery]);

  const fetchStats = useCallback(async () => {
    // Wait for token to be available
    if (token === null) return;
    
    try {
      const statsData = await getOrderStats(token || undefined);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch order stats:', error);
    }
  }, [token]);

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [fetchOrders, fetchStats]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus, token || undefined);
      await fetchOrders();
      await fetchStats();
      setSelectedOrder(null);
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const columns: Column<Order>[] = [
    {
      key: 'orderNumber',
      header: 'Order #',
      render: (order) => (
        <span className="font-medium">#{order.orderNumber}</span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (order) => (
        <div>
          <p className="font-medium">{order.customerName || 'Guest'}</p>
          <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (order) => (
        <StatusBadge status={order.status} variant={getStatusVariant(order.status)} />
      ),
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      render: (order) => (
        <StatusBadge 
          status={order.paymentStatus} 
          variant={getStatusVariant(order.paymentStatus)} 
        />
      ),
    },
    {
      key: 'total',
      header: 'Total',
      render: (order) => (
        <span className="font-medium">
          {formatCurrency(order.totalAmount, order.currencyCode)}
        </span>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      render: (order) => (
        <span>{order.items?.length || 0} items</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (order) => (
        <span className="text-muted-foreground">
          {formatTimeAgo(order.createdAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (order) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedOrder(order);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  const statsDisplay = [
    { key: 'total', label: 'Total Orders', value: stats?.totalOrders || 0 },
    { key: 'pending', label: 'Pending', value: stats?.pendingOrders || 0 },
    { key: 'confirmed', label: 'Confirmed', value: stats?.confirmedOrders || 0 },
    { key: 'delivered', label: 'Delivered', value: stats?.deliveredOrders || 0 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        icon={
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        }
        title="Orders"
        description="Manage and track customer orders"
        actions={
          <Button variant="outline">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsDisplay.map((stat) => (
          <StatCard
            key={stat.key}
            title={stat.label}
            value={stat.value.toLocaleString()}
          />
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search orders..."
          className="w-64"
        />
      </div>

      {/* Tabs and Table */}
      <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); setPage(0); }}>
        <TabsList>
          {ORDER_STATUSES.map((status) => (
            <TabsTrigger key={status} value={status} className="capitalize">
              {status}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <DataTable
            columns={columns}
            data={orders}
            loading={loading}
            emptyMessage="No orders found"
            onRowClick={(order) => setSelectedOrder(order)}
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
      </Tabs>

      {/* Order Details Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order #{selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>
              Created {selectedOrder && formatTimeAgo(selectedOrder.createdAt)}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Status and Payment */}
              <div className="flex gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <StatusBadge 
                    status={selectedOrder.status} 
                    variant={getStatusVariant(selectedOrder.status)} 
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Payment</p>
                  <StatusBadge 
                    status={selectedOrder.paymentStatus} 
                    variant={getStatusVariant(selectedOrder.paymentStatus)} 
                  />
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h4 className="font-medium mb-2">Customer</h4>
                <p>{selectedOrder.customerName || 'Guest'}</p>
                <p className="text-muted-foreground">{selectedOrder.customerEmail}</p>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-medium mb-2">Items</h4>
                <div className="border border-border rounded-lg divide-y divide-border">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.sku && `SKU: ${item.sku} • `}
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium">
                        {formatCurrency(item.totalPrice, selectedOrder.currencyCode)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center pt-4 border-t border-border">
                <span className="font-medium">Total</span>
                <span className="text-xl font-bold">
                  {formatCurrency(selectedOrder.totalAmount, selectedOrder.currencyCode)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                {selectedOrder.status === 'pending' && (
                  <Button onClick={() => handleStatusChange(selectedOrder.id, 'confirmed')}>
                    Confirm Order
                  </Button>
                )}
                {selectedOrder.status === 'confirmed' && (
                  <Button onClick={() => handleStatusChange(selectedOrder.id, 'shipped')}>
                    Mark as Shipped
                  </Button>
                )}
                {selectedOrder.status === 'shipped' && (
                  <Button onClick={() => handleStatusChange(selectedOrder.id, 'delivered')}>
                    Mark as Delivered
                  </Button>
                )}
                {['pending', 'confirmed'].includes(selectedOrder.status) && (
                  <Button 
                    variant="destructive" 
                    onClick={() => handleStatusChange(selectedOrder.id, 'cancelled')}
                  >
                    Cancel Order
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
