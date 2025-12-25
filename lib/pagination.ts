/**
 * Unified Pagination Module
 *
 * This module provides standardized pagination types and utilities
 * for consistent pagination handling across the frontend.
 *
 * Naming Convention (aligned with backend):
 * - page: Current page number (1-indexed)
 * - page_size: Number of items per page
 * - total: Total number of items
 * - pages: Total number of pages
 */

// ============================================================================
// Core Pagination Types
// ============================================================================

/**
 * Parameters for requesting a paginated list.
 * Use this when making API requests.
 */
export interface PageRequest {
  /** Current page number (1-indexed, default: 1) */
  page?: number;
  /** Number of items per page (default: 20, max: 100) */
  page_size?: number;
}

/**
 * Pagination metadata returned from API responses.
 * Contains information about the current page and total items.
 */
export interface PageInfo {
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  page_size: number;
  /** Total number of items across all pages */
  total: number;
  /** Total number of pages */
  pages: number;
}

/**
 * Generic paginated response from the API.
 * Use this as the return type for list endpoints.
 */
export interface PagedResponse<T> {
  /** Array of items for the current page */
  items: T[];
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  page_size: number;
  /** Total number of items across all pages */
  total: number;
  /** Total number of pages */
  pages: number;
}

// ============================================================================
// Default Values
// ============================================================================

/** Default page size for list requests */
export const DEFAULT_PAGE_SIZE = 20;

/** Maximum allowed page size */
export const MAX_PAGE_SIZE = 100;

/** Default page number */
export const DEFAULT_PAGE = 1;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a PageRequest with defaults applied.
 *
 * @param params - Partial page request parameters
 * @returns Complete page request with defaults
 *
 * @example
 * ```ts
 * const request = createPageRequest({ page: 2 });
 * // { page: 2, page_size: 20 }
 * ```
 */
export function createPageRequest(params?: Partial<PageRequest>): Required<PageRequest> {
  return {
    page: params?.page ?? DEFAULT_PAGE,
    page_size: Math.min(params?.page_size ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE),
  };
}

/**
 * Calculate the offset for database queries.
 *
 * @param page - Current page (1-indexed)
 * @param pageSize - Items per page
 * @returns Offset value for skip/limit queries
 *
 * @example
 * ```ts
 * const offset = calculateOffset(3, 20); // 40
 * ```
 */
export function calculateOffset(page: number, pageSize: number): number {
  return (Math.max(1, page) - 1) * pageSize;
}

/**
 * Calculate total pages from total items and page size.
 *
 * @param total - Total number of items
 * @param pageSize - Items per page
 * @returns Total number of pages
 *
 * @example
 * ```ts
 * const pages = calculateTotalPages(95, 20); // 5
 * ```
 */
export function calculateTotalPages(total: number, pageSize: number): number {
  if (total <= 0 || pageSize <= 0) return 1;
  return Math.ceil(total / pageSize);
}

/**
 * Create PageInfo from pagination parameters.
 *
 * @param page - Current page number
 * @param pageSize - Items per page
 * @param total - Total items
 * @returns Complete page info object
 */
export function createPageInfo(page: number, pageSize: number, total: number): PageInfo {
  return {
    page,
    page_size: pageSize,
    total,
    pages: calculateTotalPages(total, pageSize),
  };
}

/**
 * Create a PagedResponse from items and pagination info.
 *
 * @param items - Array of items for current page
 * @param page - Current page number
 * @param pageSize - Items per page
 * @param total - Total items across all pages
 * @returns Complete paged response
 */
export function createPagedResponse<T>(
  items: T[],
  page: number,
  pageSize: number,
  total: number
): PagedResponse<T> {
  return {
    items,
    page,
    page_size: pageSize,
    total,
    pages: calculateTotalPages(total, pageSize),
  };
}

/**
 * Check if there is a next page available.
 *
 * @param pageInfo - Current page info
 * @returns True if there is a next page
 */
export function hasNextPage(pageInfo: PageInfo): boolean {
  return pageInfo.page < pageInfo.pages;
}

/**
 * Check if there is a previous page available.
 *
 * @param pageInfo - Current page info
 * @returns True if there is a previous page
 */
export function hasPreviousPage(pageInfo: PageInfo): boolean {
  return pageInfo.page > 1;
}

/**
 * Get the range of items being displayed.
 *
 * @param pageInfo - Current page info
 * @returns Object with start and end item numbers (1-indexed)
 *
 * @example
 * ```ts
 * const range = getItemRange({ page: 2, page_size: 20, total: 95, pages: 5 });
 * // { start: 21, end: 40 }
 * ```
 */
export function getItemRange(pageInfo: PageInfo): { start: number; end: number } {
  const start = (pageInfo.page - 1) * pageInfo.page_size + 1;
  const end = Math.min(pageInfo.page * pageInfo.page_size, pageInfo.total);
  return { start: Math.min(start, pageInfo.total), end };
}

/**
 * Generate an array of page numbers for pagination UI.
 *
 * @param currentPage - Current page number
 * @param totalPages - Total number of pages
 * @param maxVisible - Maximum number of page numbers to show (default: 5)
 * @returns Array of page numbers to display
 *
 * @example
 * ```ts
 * getPageNumbers(5, 10, 5); // [3, 4, 5, 6, 7]
 * getPageNumbers(1, 10, 5); // [1, 2, 3, 4, 5]
 * getPageNumbers(10, 10, 5); // [6, 7, 8, 9, 10]
 * ```
 */
export function getPageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 5
): number[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const halfVisible = Math.floor(maxVisible / 2);
  let start = Math.max(1, currentPage - halfVisible);
  let end = Math.min(totalPages, start + maxVisible - 1);

  // Adjust start if we're near the end
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

// ============================================================================
// Conversion Utilities (for backward compatibility)
// ============================================================================

/**
 * Normalize pagination response from API.
 * Handles legacy field names (per_page, total_pages) and converts to standard format.
 *
 * @param response - Raw API response with various pagination field names
 * @returns Normalized PagedResponse
 */
export function normalizePagedResponse<T>(
  response: {
    items: T[];
    page?: number;
    page_size?: number;
    per_page?: number;
    total?: number;
    pages?: number;
    total_pages?: number;
  }
): PagedResponse<T> {
  const pageSize = response.page_size ?? response.per_page ?? DEFAULT_PAGE_SIZE;
  const total = response.total ?? 0;
  const pages = response.pages ?? response.total_pages ?? calculateTotalPages(total, pageSize);

  return {
    items: response.items,
    page: response.page ?? DEFAULT_PAGE,
    page_size: pageSize,
    total,
    pages,
  };
}

/**
 * Convert PageRequest to URL search params.
 *
 * @param request - Page request parameters
 * @returns URLSearchParams with pagination parameters
 */
export function toSearchParams(request: PageRequest): URLSearchParams {
  const params = new URLSearchParams();
  if (request.page !== undefined) {
    params.set('page', String(request.page));
  }
  if (request.page_size !== undefined) {
    params.set('page_size', String(request.page_size));
  }
  return params;
}

/**
 * Parse pagination parameters from URL search params.
 *
 * @param params - URL search params
 * @returns PageRequest with parsed values
 */
export function fromSearchParams(params: URLSearchParams): PageRequest {
  const page = params.get('page');
  const pageSize = params.get('page_size') ?? params.get('per_page');

  return {
    page: page ? parseInt(page, 10) : undefined,
    page_size: pageSize ? parseInt(pageSize, 10) : undefined,
  };
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if an object is a valid PagedResponse.
 */
export function isPagedResponse<T>(obj: unknown): obj is PagedResponse<T> {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'items' in obj &&
    Array.isArray((obj as PagedResponse<T>).items) &&
    'page' in obj &&
    'page_size' in obj &&
    'total' in obj &&
    'pages' in obj
  );
}

// ============================================================================
// Empty/Default States
// ============================================================================

/**
 * Create an empty PagedResponse.
 * Useful for loading states or error fallbacks.
 */
export function emptyPagedResponse<T>(): PagedResponse<T> {
  return {
    items: [],
    page: 1,
    page_size: DEFAULT_PAGE_SIZE,
    total: 0,
    pages: 0,
  };
}
