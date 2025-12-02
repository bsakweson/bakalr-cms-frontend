import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

interface Locale {
  id: number;
  code: string;
  name: string;
  native_name?: string;
  enabled: boolean;
}

interface UseLocalesResult {
  locales: Locale[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useLocales(): UseLocalesResult {
  const [locales, setLocales] = useState<Locale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocales = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get('/translation/locales');
      
      // Handle both array and object with items
      const data = response.data;
      const localeList = Array.isArray(data) ? data : (data.items || []);
      
      // Filter only enabled locales
      const enabledLocales = localeList.filter((locale: Locale) => locale.enabled);
      
      // Always include English as default
      const hasEnglish = enabledLocales.some((l: Locale) => l.code === 'en');
      if (!hasEnglish) {
        enabledLocales.unshift({
          id: 0,
          code: 'en',
          name: 'English',
          native_name: 'English',
          enabled: true,
        });
      }
      
      setLocales(enabledLocales);
    } catch (err: any) {
      console.error('Error fetching locales:', err);
      setError(err.response?.data?.message || 'Failed to load languages');
      
      // Fallback to English only
      setLocales([{
        id: 0,
        code: 'en',
        name: 'English',
        native_name: 'English',
        enabled: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocales();
  }, []);

  return {
    locales,
    loading,
    error,
    refetch: fetchLocales,
  };
}
