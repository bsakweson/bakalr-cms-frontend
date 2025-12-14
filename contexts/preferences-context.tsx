'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { generateTheme, applyTheme, type GeneratedTheme } from '@/lib/theme-generator';

interface Preferences {
  pageSize: number;
  theme: 'light' | 'dark' | 'system';
  primaryColor: string;
  compactView: boolean;
  showDescriptions: boolean;
}

interface PreferencesContextType {
  preferences: Preferences;
  generatedTheme: GeneratedTheme | null;
  updatePreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  updatePreferences: (newPreferences: Partial<Preferences>) => void;
  resetPreferences: () => void;
  applyCurrentTheme: () => void;
}

const defaultPreferences: Preferences = {
  pageSize: 12,
  theme: 'system',
  primaryColor: '#8b4513', // Bakalr Brown
  compactView: false,
  showDescriptions: true,
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [generatedTheme, setGeneratedTheme] = useState<GeneratedTheme | null>(null);
  const [mounted, setMounted] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('cms_preferences');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPreferences({ ...defaultPreferences, ...parsed });
      } catch (e) {
        console.error('Failed to parse preferences:', e);
      }
    }
  }, []);

  // Generate and apply theme when preferences change
  useEffect(() => {
    if (mounted) {
      const theme = generateTheme(preferences.primaryColor, 'Custom');
      setGeneratedTheme(theme);
      applyTheme(theme, preferences.theme);
      
      // Handle dark mode class
      const isDark = preferences.theme === 'dark' || 
        (preferences.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.classList.toggle('dark', isDark);
    }
  }, [preferences.primaryColor, preferences.theme, mounted]);

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted) return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (preferences.theme === 'system' && generatedTheme) {
        applyTheme(generatedTheme, 'system');
        document.documentElement.classList.toggle('dark', mediaQuery.matches);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [preferences.theme, generatedTheme, mounted]);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('cms_preferences', JSON.stringify(preferences));
    }
  }, [preferences, mounted]);

  const updatePreference = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const updatePreferences = (newPreferences: Partial<Preferences>) => {
    setPreferences((prev) => ({ ...prev, ...newPreferences }));
  };

  const resetPreferences = () => {
    setPreferences(defaultPreferences);
    localStorage.removeItem('cms_preferences');
  };

  const applyCurrentTheme = () => {
    if (generatedTheme) {
      applyTheme(generatedTheme, preferences.theme);
    }
  };

  return (
    <PreferencesContext.Provider value={{ 
      preferences, 
      generatedTheme,
      updatePreference, 
      updatePreferences, 
      resetPreferences,
      applyCurrentTheme 
    }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
