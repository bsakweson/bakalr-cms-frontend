'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { searchApi, SearchResponse, SearchResult } from '@/lib/api/search';

interface UseSearchOptions {
  contentTypeId?: string;
  status?: string;
  limit?: number;
  debounceMs?: number;
  minQueryLength?: number;
}

interface UseSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: SearchResult[];
  isSearching: boolean;
  isSearchMode: boolean;
  total: number;
  error: string | null;
  clearSearch: () => void;
}

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const { contentTypeId, status, limit = 50, debounceMs = 500, minQueryLength = 2 } = options;
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Track if we're in search mode (user has typed enough characters)
  const isSearchMode = query.trim().length >= minQueryLength;
  
  // Use ref to track the latest query for the debounced callback
  const queryRef = useRef(query);
  queryRef.current = query;
  
  // Debounce timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Perform the actual search
  const performSearch = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    
    if (!trimmed) {
      setResults([]);
      setTotal(0);
      setError(null);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    setError(null);
    
    try {
      const response = await searchApi.search({
        q: trimmed,
        content_type_id: contentTypeId,
        status,
        limit,
      });
      
      // Only update if this is still the current query
      if (queryRef.current.trim() === trimmed) {
        setResults(response.results);
        setTotal(response.total);
      }
    } catch (err) {
      console.error('Search error:', err);
      if (queryRef.current.trim() === trimmed) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults([]);
        setTotal(0);
      }
    } finally {
      if (queryRef.current.trim() === trimmed) {
        setIsSearching(false);
      }
    }
  }, [contentTypeId, status, limit]);
  
  // Debounced search effect
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    const trimmed = query.trim();
    
    // If empty or too short, clear results immediately
    if (trimmed.length < minQueryLength) {
      setResults([]);
      setTotal(0);
      setError(null);
      setIsSearching(false);
      return;
    }
    
    // Set searching state immediately for UI feedback
    setIsSearching(true);
    
    // Debounce the actual API call
    timerRef.current = setTimeout(() => {
      performSearch(query);
    }, debounceMs);
    
    // Cleanup
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [query, performSearch, debounceMs, minQueryLength]);
  
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setTotal(0);
    setError(null);
    setIsSearching(false);
  }, []);
  
  return {
    query,
    setQuery,
    results,
    isSearching,
    isSearchMode,
    total,
    error,
    clearSearch,
  };
}
