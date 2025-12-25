'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// Loading Spinner
// ============================================================================

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-current border-t-transparent',
        sizeClasses[size],
        className
      )}
    />
  );
}

// ============================================================================
// Stat Card
// ============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  className?: string;
}

export function StatCard({ title, value, description, icon, trend, className }: StatCardProps) {
  return (
    <div className={cn('bg-card border border-border rounded-xl p-6', className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-2xl font-bold">{value}</p>
        {trend && (
          <span
            className={cn(
              'text-xs font-medium',
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            )}
          >
            {trend.isPositive ? '+' : ''}{trend.value}% {trend.label}
          </span>
        )}
      </div>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

// ============================================================================
// Empty State
// ============================================================================

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      {icon && (
        <div className="mb-4 text-muted-foreground opacity-50">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ============================================================================
// Data Table
// ============================================================================

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  keyExtractor?: (item: T) => string;
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  loading,
  emptyMessage = 'No data found',
  onRowClick,
  keyExtractor,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Defensive check for undefined/null data
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={emptyMessage}
        icon={
          <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        }
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-4 py-3 text-left text-sm font-medium text-muted-foreground',
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((item, index) => {
            const key = keyExtractor ? keyExtractor(item) : item.id?.toString() || index.toString();
            return (
              <tr
                key={key}
                className={cn(
                  'bg-card hover:bg-muted/50 transition-colors',
                  onRowClick && 'cursor-pointer'
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn('px-4 py-3 text-sm', column.className)}
                  >
                    {column.render
                      ? column.render(item)
                      : (item as Record<string, unknown>)[column.key]?.toString() || '-'}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Status Badge
// ============================================================================

type StatusVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  className?: string;
}

const statusVariants: Record<StatusVariant, string> = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

export function StatusBadge({ status, variant = 'default', className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        statusVariants[variant],
        className
      )}
    >
      {status}
    </span>
  );
}

// Auto-detect variant based on common status strings
export function getStatusVariant(status: string): StatusVariant {
  const lowerStatus = status.toLowerCase();
  
  if (['completed', 'delivered', 'paid', 'active', 'approved', 'success'].includes(lowerStatus)) {
    return 'success';
  }
  if (['pending', 'processing', 'in_progress', 'waiting'].includes(lowerStatus)) {
    return 'warning';
  }
  if (['cancelled', 'failed', 'rejected', 'blocked', 'error'].includes(lowerStatus)) {
    return 'error';
  }
  if (['shipped', 'confirmed', 'new'].includes(lowerStatus)) {
    return 'info';
  }
  return 'default';
}

// ============================================================================
// Search Input
// ============================================================================

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Search...', className }: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
    </div>
  );
}

// ============================================================================
// Page Header
// ============================================================================

interface PageHeaderProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ icon, title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-linear-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center shadow-lg">
          {icon}
        </div>
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex gap-3">{actions}</div>}
    </div>
  );
}

// ============================================================================
// Admin Page Loading
// ============================================================================

interface AdminPageLoadingProps {
  title?: string;
  message?: string;
  showStats?: boolean;
  statCount?: number;
  showTabs?: boolean;
  tabCount?: number;
  showCards?: boolean;
  cardCount?: number;
  className?: string;
}

export function AdminPageLoading({
  title = 'Loading...',
  message = 'Please wait while we load your data',
  showStats = true,
  statCount = 4,
  showTabs = true,
  tabCount = 3,
  showCards = true,
  cardCount = 6,
  className,
}: AdminPageLoadingProps) {
  return (
    <div className={cn('space-y-8 animate-in fade-in duration-300', className)}>
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-muted rounded-2xl animate-pulse" />
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="h-10 w-32 bg-muted rounded-lg animate-pulse" />
      </div>

      {/* Stats Skeleton */}
      {showStats && (
        <div className={cn('grid gap-6', `grid-cols-1 md:grid-cols-${Math.min(statCount, 4)}`)}>
          {[...Array(statCount)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
              <div className="flex items-center justify-between mb-3">
                <div className="h-3 w-24 bg-muted rounded" />
                <div className="h-5 w-5 bg-muted rounded" />
              </div>
              <div className="h-8 w-16 bg-muted rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Tabs Skeleton */}
      {showTabs && (
        <div className="flex gap-2 border-b border-border pb-2">
          {[...Array(tabCount)].map((_, i) => (
            <div key={i} className="h-9 w-24 bg-muted rounded-md animate-pulse" />
          ))}
        </div>
      )}

      {/* Content Cards Skeleton */}
      {showCards && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(cardCount)].map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-6 animate-pulse">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-muted rounded" />
                  <div className="h-3 w-20 bg-muted rounded" />
                </div>
                <div className="h-6 w-16 bg-muted rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full bg-muted rounded" />
                <div className="h-3 w-3/4 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading Message */}
      <div className="flex flex-col items-center justify-center py-8">
        <LoadingSpinner size="lg" className="text-primary" />
        <p className="mt-4 text-lg font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export { cn };
