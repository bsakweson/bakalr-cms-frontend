'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { inventoryApi, InventoryItem } from '@/lib/api/inventory';

interface LowStockWidgetProps {
  maxItems?: number;
  showOutOfStock?: boolean;
}

export function LowStockWidget({
  maxItems = 5,
  showOutOfStock = true
}: LowStockWidgetProps) {
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceAvailable, setServiceAvailable] = useState(true);

  useEffect(() => {
    loadLowStockItems();
  }, [maxItems]);

  const loadLowStockItems = async () => {
    setIsLoading(true);
    setError(null);
    setServiceAvailable(true);

    try {
      // Get low stock items
      const items = await inventoryApi.getLowStock();
      setLowStockItems(items.slice(0, maxItems));

      // Get stats for out of stock count
      if (showOutOfStock) {
        const stats = await inventoryApi.getStats();
        setOutOfStockCount(stats.outOfStockItems);
      }
    } catch (err: any) {
      console.error('Failed to load low stock items:', err);
      if (err.code === 'ERR_NETWORK' || err.response?.status === 503) {
        setServiceAvailable(false);
      } else {
        setError(err.response?.data?.message || 'Failed to load inventory data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStockStatusColor = (item: InventoryItem) => {
    if (item.quantityAvailable === 0) return 'text-red-600 bg-red-50';
    if (item.isLowStock) return 'text-amber-600 bg-amber-50';
    return 'text-green-600 bg-green-50';
  };

  const getStockStatusText = (item: InventoryItem) => {
    if (item.quantityAvailable === 0) return 'Out of Stock';
    if (item.isLowStock) return 'Low Stock';
    return 'In Stock';
  };

  if (!serviceAvailable) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">⚠️ Low Stock Alerts</h3>
        </div>
        <div className="text-center py-6">
          <div className="text-gray-400 text-4xl mb-2">🔌</div>
          <p className="text-gray-500 text-sm">Inventory service unavailable</p>
          <p className="text-gray-400 text-xs mt-1">Check boutique-platform connection</p>
          <button
            onClick={loadLowStockItems}
            className="mt-3 text-sm text-blue-600 hover:text-blue-800"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">⚠️ Low Stock Alerts</h3>
        </div>
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">⚠️ Low Stock Alerts</h3>
        </div>
        <div className="text-center py-4">
          <p className="text-red-500 text-sm">{error}</p>
          <button
            onClick={loadLowStockItems}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">⚠️ Low Stock Alerts</h3>
        <Link
          href="/dashboard/inventory?filter=low-stock"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          View All →
        </Link>
      </div>

      {/* Summary Stats */}
      {showOutOfStock && outOfStockCount > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
          <div className="flex items-center">
            <span className="text-red-600 text-lg mr-2">🚨</span>
            <div>
              <p className="text-sm font-medium text-red-800">
                {outOfStockCount} item{outOfStockCount !== 1 ? 's' : ''} out of stock
              </p>
              <p className="text-xs text-red-600">Requires immediate attention</p>
            </div>
          </div>
        </div>
      )}

      {/* Low Stock Items List */}
      {lowStockItems.length === 0 ? (
        <div className="text-center py-6">
          <div className="text-green-500 text-4xl mb-2">✓</div>
          <p className="text-gray-500 text-sm">All inventory levels healthy</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lowStockItems.map((item) => (
            <Link
              key={item.id}
              href={`/dashboard/inventory/${item.id}`}
              className="flex items-center p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.sku}
                </p>
                <p className="text-xs text-gray-500">
                  Product: {item.productId}
                </p>
              </div>

              {/* Stock Level */}
              <div className="ml-4 text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {item.quantityAvailable} / {item.reorderLevel}
                </p>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getStockStatusColor(item)}`}>
                  {getStockStatusText(item)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex space-x-2">
        <Link
          href="/dashboard/inventory/bulk"
          className="flex-1 px-3 py-2 text-sm text-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          📦 Bulk Update
        </Link>
        <button
          onClick={loadLowStockItems}
          className="px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
        >
          🔄 Refresh
        </button>
      </div>
    </div>
  );
}

// Compact version for smaller spaces
export function LowStockBadge() {
  const [count, setCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCount = async () => {
      try {
        const stats = await inventoryApi.getStats();
        setCount(stats.lowStockItems + stats.outOfStockItems);
      } catch (err) {
        console.error('Failed to load low stock count:', err);
        setCount(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadCount();
  }, []);

  if (isLoading || count === null || count === 0) {
    return null;
  }

  return (
    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
      {count}
    </span>
  );
}

export default LowStockWidget;
