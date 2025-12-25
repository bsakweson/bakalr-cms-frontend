'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { inventoryApi, InventoryItemResponse, PaginatedInventoryResponse, InventoryStatsResponse } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Package,
  AlertTriangle,
  TrendingDown,
  Search,
  RefreshCw,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function InventoryPage() {
  const router = useRouter();

  // State
  const [inventory, setInventory] = useState<PaginatedInventoryResponse | null>(null);
  const [stats, setStats] = useState<InventoryStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [error, setError] = useState('');
  const [serviceAvailable, setServiceAvailable] = useState<boolean | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [filterOutOfStock, setFilterOutOfStock] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; sku: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load inventory stats
  const loadStats = useCallback(async () => {
    try {
      setIsStatsLoading(true);
      const data = await inventoryApi.getStats();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load inventory stats:', err);
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  // Load inventory items
  const loadInventory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      const data = await inventoryApi.getItems({
        page: currentPage,
        pageSize,
        search: searchQuery || undefined,
        lowStockOnly: filterLowStock,
        outOfStockOnly: filterOutOfStock,
      });

      setInventory(data);
    } catch (err: any) {
      console.error('Error loading inventory:', err);
      if (err.response?.status === 503 || err.code === 'ECONNREFUSED') {
        setError('Inventory service is unavailable. Please ensure boutique-platform is running.');
        setServiceAvailable(false);
      } else {
        setError(err.response?.data?.message || 'Failed to load inventory');
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, filterLowStock, filterOutOfStock, pageSize]);

  // Initial load
  useEffect(() => {
    loadStats();
    loadInventory();
  }, []);

  // Reload on filter changes
  useEffect(() => {
    if (serviceAvailable !== false) {
      loadInventory();
    }
  }, [currentPage, searchQuery, filterLowStock, filterOutOfStock]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadInventory();
  };

  // Handle refresh
  const handleRefresh = () => {
    loadStats();
    loadInventory();
    inventoryApi.setLastSyncTime();
  };

  // Handle delete
  const handleDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      await inventoryApi.deleteItem(itemToDelete.id);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      loadInventory();
      loadStats();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete inventory item');
    } finally {
      setIsDeleting(false);
    }
  };

  // Get status badge
  const getStockBadge = (item: InventoryItemResponse) => {
    if (item.quantityAvailable === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    }
    if (item.isLowStock) {
      return <Badge variant="secondary" className="bg-amber-500 text-white">Low Stock</Badge>;
    }
    return <Badge variant="default" className="bg-green-600">In Stock</Badge>;
  };

  // Service unavailable state
  if (serviceAvailable === false) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Inventory Management</h1>
            <p className="text-muted-foreground">
              Manage product inventory and stock levels
            </p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            <strong>Inventory Service Unavailable</strong>
            <p className="mt-1">
              The boutique-platform inventory service is not running. Please start the platform services:
            </p>
            <code className="mt-2 block bg-muted p-2 rounded text-sm">
              cd boutique-platform && docker-compose up -d
            </code>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={checkService}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Connection
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">
            Manage product inventory and stock levels across your organization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/dashboard/inventory/bulk">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Bulk Update
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isStatsLoading ? '...' : stats?.totalItems?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalQuantityAvailable?.toLocaleString() || 0} units available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {isStatsLoading ? '...' : stats?.lowStockItems || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Items below reorder level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {isStatsLoading ? '...' : stats?.outOfStockItems || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Items with zero quantity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <span className="text-muted-foreground">$</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isStatsLoading ? '...' : `$${(stats?.totalInventoryValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            </div>
            <p className="text-xs text-muted-foreground">
              Total cost value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-1 block">Search</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by SKU, product ID, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="w-[150px]">
              <label className="text-sm font-medium mb-1 block">Stock Status</label>
              <Select
                value={filterLowStock ? 'low' : filterOutOfStock ? 'out' : 'all'}
                onValueChange={(value) => {
                  setFilterLowStock(value === 'low');
                  setFilterOutOfStock(value === 'out');
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="low">Low Stock</SelectItem>
                  <SelectItem value="out">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={isLoading}>
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>
            {inventory?.total || 0} items total • Page {inventory?.page || 1} of {inventory?.totalPages || 1}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !inventory?.items?.length ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Package className="h-12 w-12 mb-4" />
              <p>No inventory items found</p>
              <p className="text-sm">Try adjusting your filters or search query</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product ID</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead className="text-right">Reserved</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {item.productId?.substring(0, 8)}...
                      </TableCell>
                      <TableCell>{item.locationCode || '-'}</TableCell>
                      <TableCell className="text-right font-medium">
                        {item.quantityAvailable}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {item.quantityReserved}
                      </TableCell>
                      <TableCell className="text-right">
                        ${item.costPrice?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell>{getStockBadge(item)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => router.push(`/dashboard/inventory/${item.id}`)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setItemToDelete({ id: item.id, sku: item.sku });
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {(inventory.totalPages || 1) > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {((inventory.page - 1) * pageSize) + 1} to{' '}
                    {Math.min(inventory.page * pageSize, inventory.total)} of {inventory.total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!inventory.hasPrevious}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!inventory.hasNext}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Last Sync Info */}
      <p className="text-xs text-muted-foreground text-center">
        Last synced: {inventoryApi.getLastSyncTime()
          ? new Date(inventoryApi.getLastSyncTime()!).toLocaleString()
          : 'Never'}
      </p>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Inventory Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the inventory item with SKU{' '}
              <strong>{itemToDelete?.sku}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
