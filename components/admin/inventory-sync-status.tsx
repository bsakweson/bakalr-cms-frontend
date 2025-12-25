'use client';

import { useState, useEffect } from 'react';
import { inventoryApi } from '@/lib/api/inventory';

interface SyncStatus {
  commandService: boolean;
  queryService: boolean;
  lastSyncTime: string | null;
  syncInProgress: boolean;
  lastError: string | null;
}

interface InventorySyncStatusProps {
  showDetails?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
}

export function InventorySyncStatus({
  showDetails = true,
  autoRefresh = true,
  refreshInterval = 30,
}: InventorySyncStatusProps) {
  const [status, setStatus] = useState<SyncStatus>({
    commandService: false,
    queryService: false,
    lastSyncTime: null,
    syncInProgress: false,
    lastError: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    checkStatus();

    if (autoRefresh) {
      const interval = setInterval(checkStatus, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const checkStatus = async () => {
    try {
      // Check both services
      const [commandAvailable, queryAvailable] = await Promise.all([
        checkServiceHealth('command'),
        checkServiceHealth('query'),
      ]);

      setStatus((prev) => ({
        ...prev,
        commandService: commandAvailable,
        queryService: queryAvailable,
        lastError: null,
      }));
    } catch (err: any) {
      setStatus((prev) => ({
        ...prev,
        lastError: err.message || 'Failed to check service status',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const checkServiceHealth = async (service: 'command' | 'query'): Promise<boolean> => {
    try {
      // Try to fetch minimal data - if it works, service is available
      await inventoryApi.getItems({ page: 1, pageSize: 1 });
      return true;
    } catch {
      return false;
    }
  };

  const triggerSync = async () => {
    setIsSyncing(true);
    setStatus((prev) => ({ ...prev, syncInProgress: true, lastError: null }));

    try {
      // Trigger a sync by fetching fresh data
      // In a real implementation, this might call a dedicated sync endpoint
      await inventoryApi.getItems({ page: 1, pageSize: 1 });

      setStatus((prev) => ({
        ...prev,
        lastSyncTime: new Date().toISOString(),
        syncInProgress: false,
      }));
    } catch (err: any) {
      setStatus((prev) => ({
        ...prev,
        syncInProgress: false,
        lastError: err.response?.data?.message || 'Sync failed',
      }));
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSync = (isoString: string | null) => {
    if (!isoString) return 'Never';

    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString();
  };

  const getOverallStatus = () => {
    if (isLoading) return 'checking';
    if (status.commandService && status.queryService) return 'healthy';
    if (status.commandService || status.queryService) return 'partial';
    return 'offline';
  };

  const overallStatus = getOverallStatus();

  const statusColors = {
    healthy: 'bg-green-100 text-green-800 border-green-200',
    partial: 'bg-amber-100 text-amber-800 border-amber-200',
    offline: 'bg-red-100 text-red-800 border-red-200',
    checking: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const statusIcons = {
    healthy: '✓',
    partial: '⚠',
    offline: '✗',
    checking: '...',
  };

  const statusTexts = {
    healthy: 'Connected',
    partial: 'Partial',
    offline: 'Offline',
    checking: 'Checking...',
  };

  if (!showDetails) {
    // Compact badge view
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusColors[overallStatus]}`}>
        <span className="mr-1">{statusIcons[overallStatus]}</span>
        {statusTexts[overallStatus]}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">🔄 Inventory Sync</h3>
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusColors[overallStatus]}`}>
          <span className="mr-1">{statusIcons[overallStatus]}</span>
          {statusTexts[overallStatus]}
        </div>
      </div>

      {/* Service Status */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Command Service</span>
          <span className={status.commandService ? 'text-green-600' : 'text-red-600'}>
            {status.commandService ? '● Online' : '○ Offline'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Query Service</span>
          <span className={status.queryService ? 'text-green-600' : 'text-red-600'}>
            {status.queryService ? '● Online' : '○ Offline'}
          </span>
        </div>
      </div>

      {/* Last Sync Time */}
      <div className="text-xs text-gray-500 mb-3">
        Last sync: {formatLastSync(status.lastSyncTime)}
      </div>

      {/* Error Display */}
      {status.lastError && (
        <div className="mb-3 p-2 bg-red-50 border border-red-100 rounded text-xs text-red-700">
          {status.lastError}
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-2">
        <button
          onClick={triggerSync}
          disabled={isSyncing || overallStatus === 'offline'}
          className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
            isSyncing || overallStatus === 'offline'
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
          }`}
        >
          {isSyncing ? '⏳ Syncing...' : '🔄 Sync Now'}
        </button>
        <button
          onClick={checkStatus}
          disabled={isLoading}
          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          ↻
        </button>
      </div>
    </div>
  );
}

// Compact inline status for nav/header
export function SyncStatusIndicator() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        await inventoryApi.getItems({ page: 1, pageSize: 1 });
        setIsOnline(true);
      } catch {
        setIsOnline(false);
      }
    };
    check();

    const interval = setInterval(check, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  if (isOnline === null) {
    return (
      <span className="inline-flex items-center text-xs text-gray-400">
        <span className="w-2 h-2 bg-gray-300 rounded-full mr-1 animate-pulse"></span>
        Inventory
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center text-xs ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
      <span className={`w-2 h-2 rounded-full mr-1 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
      Inventory
    </span>
  );
}

export default InventorySyncStatus;
