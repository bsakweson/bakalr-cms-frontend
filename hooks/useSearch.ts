import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import debounce from 'lodash/debounce';

interface SearchResult {
  id: string;
  slug: string;
  title: string;
  content_type: string;
  fields: Record<string, any>;
  score: number;
}

interface UseSearchResult {
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  search: (query: string) => void;
  autocomplete: (query: string) => Promise<string[]>;
}

export function useSearch(initialQuery: string = ''): UseSearchResult {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performSearch = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        query: query.trim(),
        limit: '20',
      });

      const response = await apiClient.get(`/search?${params.toString()}`);
      setResults(response.data.results || []);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.response?.data?.message || 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((query: string) => performSearch(query), 300),
    []
  );

  const autocomplete = async (query: string): Promise<string[]> => {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      const params = new URLSearchParams({
        query: query.trim(),
        limit: '5',
      });

      const response = await apiClient.get(`/search/autocomplete?${params.toString()}`);
      return response.data.suggestions || [];
    } catch (err) {
      console.error('Autocomplete error:', err);
      return [];
    }
  };

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, []);

  return {
    results,
    loading,
    error,
    search: debouncedSearch,
    autocomplete,
  };
}
