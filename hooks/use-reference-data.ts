'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccessToken } from '@/hooks/use-access-token';
import {
  getReferenceData,
  getDepartments,
  getEmployeeRoles,
  ReferenceData,
  DepartmentOption,
  RoleOption,
  DEPARTMENTS,
  EMPLOYEE_ROLES,
  EMPLOYMENT_STATUSES,
} from '@/lib/api/platform';
import apiClient from '@/lib/api/client';

// ============================================================================
// Types for CMS Reference Data
// ============================================================================

interface CMSReferenceEntry {
  id: string;
  title: string;
  slug: string;
  data: {
    data_type: 'department' | 'role' | 'status';
    code: string;
    label: string;
    description?: string;
    icon?: string;
    color?: string;
    metadata?: Record<string, unknown>;
    is_system: boolean;
    is_active: boolean;
    sort_order: number;
  };
  status: string;
}

// ============================================================================
// Cache Configuration
// ============================================================================

const CACHE_KEY = 'boutique_reference_data';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CachedData {
  data: ReferenceData;
  timestamp: number;
}

// In-memory cache for server-side
let memoryCache: CachedData | null = null;

// ============================================================================
// Cache Helpers
// ============================================================================

function getCachedData(): ReferenceData | null {
  // Try memory cache first
  if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_TTL) {
    return memoryCache.data;
  }

  // Try localStorage in browser
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: CachedData = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL) {
          memoryCache = parsed; // Populate memory cache
          return parsed.data;
        }
      }
    } catch {
      // Ignore parse errors
    }
  }

  return null;
}

function setCachedData(data: ReferenceData): void {
  const cacheEntry: CachedData = {
    data,
    timestamp: Date.now(),
  };

  // Update memory cache
  memoryCache = cacheEntry;

  // Update localStorage in browser
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry));
    } catch {
      // Ignore storage errors (quota, etc.)
    }
  }
}

function clearCache(): void {
  memoryCache = null;
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch {
      // Ignore errors
    }
  }
}

// ============================================================================
// Default Fallback Data
// ============================================================================

const DEFAULT_REFERENCE_DATA: ReferenceData = {
  departments: DEPARTMENTS,
  roles: EMPLOYEE_ROLES.map(r => ({
    value: r.value,
    label: r.label,
    metadata: { managerLevel: r.managerLevel },
  })),
  statuses: EMPLOYMENT_STATUSES,
};

// ============================================================================
// CMS Data Fetching & Merging
// ============================================================================

/**
 * Fetch custom reference data from CMS (organization_reference_data content type)
 */
async function fetchCMSReferenceData(): Promise<CMSReferenceEntry[]> {
  try {
    const response = await apiClient.get('/content/entries', {
      params: {
        content_type_slug: 'organization_reference_data',
        status: 'published',
        per_page: 200,
      },
    });
    
    // Return items array, handling different response structures
    return response.data?.items || response.data || [];
  } catch (error) {
    // CMS content type might not exist yet - that's okay
    console.warn('[ReferenceData] Could not fetch CMS custom data:', error);
    return [];
  }
}

/**
 * Merge CMS custom entries with platform data
 * CMS entries are added after system entries, sorted by sort_order
 */
function mergeCMSData(
  platformData: ReferenceData,
  cmsEntries: CMSReferenceEntry[]
): ReferenceData {
  if (!cmsEntries || cmsEntries.length === 0) {
    return platformData;
  }

  // Group CMS entries by type
  const cmsDepartments: DepartmentOption[] = [];
  const cmsRoles: RoleOption[] = [];
  const cmsStatuses: { value: string; label: string }[] = [];

  for (const entry of cmsEntries) {
    if (!entry.data?.is_active) continue;

    const option = {
      value: entry.data.code,
      label: entry.data.label,
      description: entry.data.description,
      icon: entry.data.icon,
      color: entry.data.color,
      isCustom: !entry.data.is_system, // Mark as custom if not system
      sortOrder: entry.data.sort_order || 99,
    };

    switch (entry.data.data_type) {
      case 'department':
        // Only add if not already in platform data
        if (!platformData.departments.some(d => d.value === option.value)) {
          cmsDepartments.push(option as DepartmentOption);
        }
        break;
      case 'role':
        if (!platformData.roles.some(r => r.value === option.value)) {
          cmsRoles.push({
            ...option,
            metadata: entry.data.metadata as Record<string, unknown>,
          } as RoleOption);
        }
        break;
      case 'status':
        if (!platformData.statuses.some(s => s.value === option.value)) {
          cmsStatuses.push({ value: option.value, label: option.label });
        }
        break;
    }
  }

  // Sort custom entries by sort_order
  cmsDepartments.sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99));
  cmsRoles.sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99));

  return {
    departments: [...platformData.departments, ...cmsDepartments],
    roles: [...platformData.roles, ...cmsRoles],
    statuses: [...platformData.statuses, ...cmsStatuses],
  };
}

// ============================================================================
// Hook: useReferenceData
// ============================================================================

interface UseReferenceDataOptions {
  /** Skip fetching on mount */
  skip?: boolean;
  /** Force fresh fetch, ignoring cache */
  forceRefresh?: boolean;
}

interface UseReferenceDataResult {
  /** All reference data */
  data: ReferenceData;
  /** Individual arrays for convenience */
  departments: DepartmentOption[];
  roles: RoleOption[];
  statuses: { value: string; label: string }[];
  /** Loading state */
  loading: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Manually refresh data */
  refresh: () => Promise<void>;
  /** Clear cache and refresh */
  invalidate: () => Promise<void>;
}

export function useReferenceData(options: UseReferenceDataOptions = {}): UseReferenceDataResult {
  const { skip = false, forceRefresh = false } = options;
  const token = useAccessToken();
  
  const [data, setData] = useState<ReferenceData>(() => {
    // Initialize from cache or defaults
    const cached = getCachedData();
    return cached || DEFAULT_REFERENCE_DATA;
  });
  const [loading, setLoading] = useState(!skip && !getCachedData());
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (ignoreCache = false) => {
    // Wait for token to be available (null = loading, undefined = no token)
    if (token === null) return;
    
    // Check cache first (unless ignoring)
    if (!ignoreCache) {
      const cached = getCachedData();
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch from boutique-platform API
      const platformData = await getReferenceData(token || undefined);
      
      // Also try to fetch custom reference data from CMS
      const cmsCustomData = await fetchCMSReferenceData();
      
      // Merge custom CMS data with platform data
      const mergedData = mergeCMSData(platformData, cmsCustomData);
      
      setData(mergedData);
      setCachedData(mergedData);
    } catch (err) {
      console.error('Failed to fetch reference data:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch reference data'));
      // Keep existing data (fallback)
    } finally {
      setLoading(false);
    }
  }, [token]);

  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  const invalidate = useCallback(async () => {
    clearCache();
    await fetchData(true);
  }, [fetchData]);

  // Fetch on mount if not skipped
  useEffect(() => {
    if (!skip) {
      fetchData(forceRefresh);
    }
  }, [skip, forceRefresh, fetchData]);

  return {
    data,
    departments: data.departments,
    roles: data.roles,
    statuses: data.statuses,
    loading,
    error,
    refresh,
    invalidate,
  };
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Hook to get just departments
 */
export function useDepartments(): {
  departments: DepartmentOption[];
  loading: boolean;
  error: Error | null;
} {
  const { departments, loading, error } = useReferenceData();
  return { departments, loading, error };
}

/**
 * Hook to get just employee roles
 */
export function useEmployeeRoles(): {
  roles: RoleOption[];
  loading: boolean;
  error: Error | null;
} {
  const { roles, loading, error } = useReferenceData();
  return { roles, loading, error };
}

/**
 * Hook to get department label by value
 */
export function useDepartmentLabel(value: string): string {
  const { departments } = useReferenceData({ skip: false });
  const dept = departments.find(d => d.value === value);
  return dept?.label || value;
}

/**
 * Hook to get role label by value
 */
export function useRoleLabel(value: string): string {
  const { roles } = useReferenceData({ skip: false });
  const role = roles.find(r => r.value === value);
  return role?.label || value;
}

// ============================================================================
// Utility Functions (Non-hook)
// ============================================================================

/**
 * Get department label (uses cache, fallback to static)
 */
export function getDepartmentLabel(value: string): string {
  const cached = getCachedData();
  const departments = cached?.departments || DEPARTMENTS;
  const dept = departments.find(d => d.value === value);
  return dept?.label || value;
}

/**
 * Get role label (uses cache, fallback to static)
 */
export function getRoleLabel(value: string): string {
  const cached = getCachedData();
  const roles = cached?.roles || EMPLOYEE_ROLES.map(r => ({ value: r.value, label: r.label }));
  const role = roles.find(r => r.value === value);
  return role?.label || value;
}

/**
 * Check if role is manager level
 */
export function isManagerLevel(value: string): boolean {
  const cached = getCachedData();
  if (cached) {
    const role = cached.roles.find(r => r.value === value);
    return role?.metadata?.managerLevel || false;
  }
  const role = EMPLOYEE_ROLES.find(r => r.value === value);
  return role?.managerLevel || false;
}
