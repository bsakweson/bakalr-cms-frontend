import { describe, it, expect } from 'vitest';
import {
  createPageRequest,
  calculateOffset,
  calculateTotalPages,
  createPageInfo,
  createPagedResponse,
  hasNextPage,
  hasPreviousPage,
  getItemRange,
  getPageNumbers,
  normalizePagedResponse,
  toSearchParams,
  fromSearchParams,
  isPagedResponse,
  emptyPagedResponse,
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE,
  MAX_PAGE_SIZE,
  type PageRequest,
  type PageInfo,
  type PagedResponse,
} from './pagination';

describe('Pagination Module', () => {
  describe('Constants', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_PAGE_SIZE).toBe(20);
      expect(DEFAULT_PAGE).toBe(1);
      expect(MAX_PAGE_SIZE).toBe(100);
    });
  });

  describe('createPageRequest', () => {
    it('should return defaults when no params provided', () => {
      const request = createPageRequest();
      expect(request).toEqual({ page: 1, page_size: 20 });
    });

    it('should use provided page number', () => {
      const request = createPageRequest({ page: 5 });
      expect(request).toEqual({ page: 5, page_size: 20 });
    });

    it('should use provided page_size', () => {
      const request = createPageRequest({ page_size: 50 });
      expect(request).toEqual({ page: 1, page_size: 50 });
    });

    it('should cap page_size at MAX_PAGE_SIZE', () => {
      const request = createPageRequest({ page_size: 200 });
      expect(request.page_size).toBe(100);
    });

    it('should handle all params together', () => {
      const request = createPageRequest({ page: 3, page_size: 25 });
      expect(request).toEqual({ page: 3, page_size: 25 });
    });
  });

  describe('calculateOffset', () => {
    it('should calculate offset for page 1', () => {
      expect(calculateOffset(1, 20)).toBe(0);
    });

    it('should calculate offset for page 2', () => {
      expect(calculateOffset(2, 20)).toBe(20);
    });

    it('should calculate offset for page 5 with size 10', () => {
      expect(calculateOffset(5, 10)).toBe(40);
    });

    it('should handle page 0 as page 1', () => {
      expect(calculateOffset(0, 20)).toBe(0);
    });

    it('should handle negative pages as page 1', () => {
      expect(calculateOffset(-1, 20)).toBe(0);
    });
  });

  describe('calculateTotalPages', () => {
    it('should calculate pages for exact division', () => {
      expect(calculateTotalPages(100, 20)).toBe(5);
    });

    it('should round up for partial pages', () => {
      expect(calculateTotalPages(95, 20)).toBe(5);
      expect(calculateTotalPages(101, 20)).toBe(6);
    });

    it('should return 1 for zero items', () => {
      expect(calculateTotalPages(0, 20)).toBe(1);
    });

    it('should return 1 for negative items', () => {
      expect(calculateTotalPages(-10, 20)).toBe(1);
    });

    it('should handle zero page size', () => {
      expect(calculateTotalPages(100, 0)).toBe(1);
    });

    it('should handle single item', () => {
      expect(calculateTotalPages(1, 20)).toBe(1);
    });
  });

  describe('createPageInfo', () => {
    it('should create correct page info', () => {
      const info = createPageInfo(2, 20, 95);
      expect(info).toEqual({
        page: 2,
        page_size: 20,
        total: 95,
        pages: 5,
      });
    });

    it('should calculate pages correctly', () => {
      const info = createPageInfo(1, 10, 100);
      expect(info.pages).toBe(10);
    });
  });

  describe('createPagedResponse', () => {
    it('should create correct paged response', () => {
      const items = [{ id: 1 }, { id: 2 }];
      const response = createPagedResponse(items, 2, 20, 95);

      expect(response).toEqual({
        items,
        page: 2,
        page_size: 20,
        total: 95,
        pages: 5,
      });
    });

    it('should work with empty items', () => {
      const response = createPagedResponse([], 1, 20, 0);

      expect(response.items).toEqual([]);
      expect(response.total).toBe(0);
      expect(response.pages).toBe(1);
    });
  });

  describe('hasNextPage', () => {
    it('should return true when more pages exist', () => {
      const pageInfo: PageInfo = { page: 2, page_size: 20, total: 100, pages: 5 };
      expect(hasNextPage(pageInfo)).toBe(true);
    });

    it('should return false on last page', () => {
      const pageInfo: PageInfo = { page: 5, page_size: 20, total: 100, pages: 5 };
      expect(hasNextPage(pageInfo)).toBe(false);
    });

    it('should return false on single page', () => {
      const pageInfo: PageInfo = { page: 1, page_size: 20, total: 10, pages: 1 };
      expect(hasNextPage(pageInfo)).toBe(false);
    });
  });

  describe('hasPreviousPage', () => {
    it('should return false on first page', () => {
      const pageInfo: PageInfo = { page: 1, page_size: 20, total: 100, pages: 5 };
      expect(hasPreviousPage(pageInfo)).toBe(false);
    });

    it('should return true when not on first page', () => {
      const pageInfo: PageInfo = { page: 2, page_size: 20, total: 100, pages: 5 };
      expect(hasPreviousPage(pageInfo)).toBe(true);
    });
  });

  describe('getItemRange', () => {
    it('should return correct range for first page', () => {
      const pageInfo: PageInfo = { page: 1, page_size: 20, total: 95, pages: 5 };
      expect(getItemRange(pageInfo)).toEqual({ start: 1, end: 20 });
    });

    it('should return correct range for middle page', () => {
      const pageInfo: PageInfo = { page: 2, page_size: 20, total: 95, pages: 5 };
      expect(getItemRange(pageInfo)).toEqual({ start: 21, end: 40 });
    });

    it('should cap end at total for last page', () => {
      const pageInfo: PageInfo = { page: 5, page_size: 20, total: 95, pages: 5 };
      expect(getItemRange(pageInfo)).toEqual({ start: 81, end: 95 });
    });

    it('should handle empty results', () => {
      const pageInfo: PageInfo = { page: 1, page_size: 20, total: 0, pages: 1 };
      expect(getItemRange(pageInfo)).toEqual({ start: 0, end: 0 });
    });

    it('should handle single item', () => {
      const pageInfo: PageInfo = { page: 1, page_size: 20, total: 1, pages: 1 };
      expect(getItemRange(pageInfo)).toEqual({ start: 1, end: 1 });
    });
  });

  describe('getPageNumbers', () => {
    it('should return all pages when total is less than maxVisible', () => {
      expect(getPageNumbers(1, 3, 5)).toEqual([1, 2, 3]);
    });

    it('should return first pages when on page 1', () => {
      expect(getPageNumbers(1, 10, 5)).toEqual([1, 2, 3, 4, 5]);
    });

    it('should center around current page in middle', () => {
      expect(getPageNumbers(5, 10, 5)).toEqual([3, 4, 5, 6, 7]);
    });

    it('should return last pages when near end', () => {
      expect(getPageNumbers(10, 10, 5)).toEqual([6, 7, 8, 9, 10]);
    });

    it('should handle page 9 of 10', () => {
      expect(getPageNumbers(9, 10, 5)).toEqual([6, 7, 8, 9, 10]);
    });

    it('should work with default maxVisible', () => {
      const result = getPageNumbers(5, 10);
      expect(result.length).toBe(5);
      expect(result).toContain(5);
    });

    it('should handle single page', () => {
      expect(getPageNumbers(1, 1, 5)).toEqual([1]);
    });
  });

  describe('normalizePagedResponse', () => {
    it('should normalize standard response', () => {
      const raw = {
        items: [1, 2, 3],
        page: 2,
        page_size: 20,
        total: 100,
        pages: 5,
      };

      const normalized = normalizePagedResponse(raw);

      expect(normalized).toEqual({
        items: [1, 2, 3],
        page: 2,
        page_size: 20,
        total: 100,
        pages: 5,
      });
    });

    it('should handle per_page legacy field', () => {
      const raw = {
        items: [1, 2],
        page: 1,
        per_page: 10,
        total: 50,
        total_pages: 5,
      };

      const normalized = normalizePagedResponse(raw);

      expect(normalized.page_size).toBe(10);
      expect(normalized.pages).toBe(5);
    });

    it('should prefer page_size over per_page', () => {
      const raw = {
        items: [],
        page_size: 20,
        per_page: 10,
        total: 100,
      };

      const normalized = normalizePagedResponse(raw);
      expect(normalized.page_size).toBe(20);
    });

    it('should calculate pages if not provided', () => {
      const raw = {
        items: [],
        page: 1,
        page_size: 20,
        total: 95,
      };

      const normalized = normalizePagedResponse(raw);
      expect(normalized.pages).toBe(5);
    });

    it('should use defaults for missing fields', () => {
      const raw = { items: [] };

      const normalized = normalizePagedResponse(raw);

      expect(normalized.page).toBe(1);
      expect(normalized.page_size).toBe(20);
      expect(normalized.total).toBe(0);
    });
  });

  describe('toSearchParams', () => {
    it('should convert page request to search params', () => {
      const request: PageRequest = { page: 2, page_size: 50 };
      const params = toSearchParams(request);

      expect(params.get('page')).toBe('2');
      expect(params.get('page_size')).toBe('50');
    });

    it('should handle partial request', () => {
      const request: PageRequest = { page: 3 };
      const params = toSearchParams(request);

      expect(params.get('page')).toBe('3');
      expect(params.has('page_size')).toBe(false);
    });

    it('should handle empty request', () => {
      const params = toSearchParams({});

      expect(params.has('page')).toBe(false);
      expect(params.has('page_size')).toBe(false);
    });
  });

  describe('fromSearchParams', () => {
    it('should parse page and page_size', () => {
      const params = new URLSearchParams('page=2&page_size=50');
      const request = fromSearchParams(params);

      expect(request).toEqual({ page: 2, page_size: 50 });
    });

    it('should handle per_page legacy param', () => {
      const params = new URLSearchParams('page=2&per_page=30');
      const request = fromSearchParams(params);

      expect(request).toEqual({ page: 2, page_size: 30 });
    });

    it('should return undefined for missing params', () => {
      const params = new URLSearchParams('');
      const request = fromSearchParams(params);

      expect(request.page).toBeUndefined();
      expect(request.page_size).toBeUndefined();
    });
  });

  describe('isPagedResponse', () => {
    it('should return true for valid paged response', () => {
      const response: PagedResponse<number> = {
        items: [1, 2, 3],
        page: 1,
        page_size: 20,
        total: 100,
        pages: 5,
      };

      expect(isPagedResponse(response)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isPagedResponse(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isPagedResponse(undefined)).toBe(false);
    });

    it('should return false for missing items', () => {
      expect(isPagedResponse({ page: 1, page_size: 20, total: 0, pages: 0 })).toBe(false);
    });

    it('should return false for non-array items', () => {
      expect(isPagedResponse({ items: 'not an array', page: 1, page_size: 20, total: 0, pages: 0 })).toBe(false);
    });

    it('should return false for missing pagination fields', () => {
      expect(isPagedResponse({ items: [] })).toBe(false);
      expect(isPagedResponse({ items: [], page: 1 })).toBe(false);
      expect(isPagedResponse({ items: [], page: 1, page_size: 20 })).toBe(false);
      expect(isPagedResponse({ items: [], page: 1, page_size: 20, total: 0 })).toBe(false);
    });
  });

  describe('emptyPagedResponse', () => {
    it('should return empty response with defaults', () => {
      const empty = emptyPagedResponse<string>();

      expect(empty).toEqual({
        items: [],
        page: 1,
        page_size: 20,
        total: 0,
        pages: 0,
      });
    });

    it('should be typed correctly', () => {
      const empty = emptyPagedResponse<{ id: number }>();
      // TypeScript should infer items as { id: number }[]
      expect(Array.isArray(empty.items)).toBe(true);
    });
  });
});
