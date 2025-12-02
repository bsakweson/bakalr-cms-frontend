'use client';

import React, { useState, useEffect } from 'react';
import { useLocales } from '@/hooks/useLocales';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, Check } from 'lucide-react';

interface LanguageSwitcherProps {
  onLocaleChange?: (locale: string) => void;
  className?: string;
}

export function LanguageSwitcher({ onLocaleChange, className }: LanguageSwitcherProps) {
  const { locales, loading } = useLocales();
  const [currentLocale, setCurrentLocale] = useState('en');

  // Load saved locale from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('preferredLocale');
    if (saved) {
      setCurrentLocale(saved);
    }
  }, []);

  // Handle locale change
  const handleLocaleChange = (localeCode: string) => {
    setCurrentLocale(localeCode);
    localStorage.setItem('preferredLocale', localeCode);
    
    // Notify parent component
    if (onLocaleChange) {
      onLocaleChange(localeCode);
    }
    
    // Reload page to apply translations
    window.location.reload();
  };

  const currentLocaleName = locales.find(l => l.code === currentLocale)?.name || 'English';

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled className={className}>
        <Globe className="h-4 w-4 mr-2" />
        Loading...
      </Button>
    );
  }

  // Don't show if only English is available
  if (locales.length <= 1) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Globe className="h-4 w-4 mr-2" />
          {currentLocaleName}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale.code}
            onClick={() => handleLocaleChange(locale.code)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col">
                <span className="font-medium">{locale.name}</span>
                {locale.native_name && locale.native_name !== locale.name && (
                  <span className="text-xs text-gray-500">{locale.native_name}</span>
                )}
              </div>
              {currentLocale === locale.code && (
                <Check className="h-4 w-4 text-[#3D2817]" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Compact version for mobile
export function LanguageSwitcherCompact({ onLocaleChange, className }: LanguageSwitcherProps) {
  const { locales, loading } = useLocales();
  const [currentLocale, setCurrentLocale] = useState('en');

  useEffect(() => {
    const saved = localStorage.getItem('preferredLocale');
    if (saved) {
      setCurrentLocale(saved);
    }
  }, []);

  const handleLocaleChange = (localeCode: string) => {
    setCurrentLocale(localeCode);
    localStorage.setItem('preferredLocale', localeCode);
    
    if (onLocaleChange) {
      onLocaleChange(localeCode);
    }
    
    window.location.reload();
  };

  if (loading || locales.length <= 1) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={className}>
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale.code}
            onClick={() => handleLocaleChange(locale.code)}
            className="cursor-pointer"
          >
            <Badge
              variant={currentLocale === locale.code ? 'default' : 'outline'}
              className="mr-2"
            >
              {locale.code.toUpperCase()}
            </Badge>
            {locale.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Hook to get current locale
export function useCurrentLocale() {
  const [locale, setLocale] = useState('en');

  useEffect(() => {
    const saved = localStorage.getItem('preferredLocale');
    if (saved) {
      setLocale(saved);
    }
  }, []);

  return locale;
}
