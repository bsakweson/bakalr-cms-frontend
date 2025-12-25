'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to get the current access token from localStorage
 * Returns null on server-side and during initial hydration
 */
export function useAccessToken(): string | null {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Only run on client-side
    const storedToken = localStorage.getItem('access_token');
    setToken(storedToken);

    // Listen for storage changes (e.g., token refresh, logout in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token') {
        setToken(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return token;
}
