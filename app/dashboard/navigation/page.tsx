'use client';

import { useEffect, useState, useCallback } from 'react';
import { contentApi, translationApi } from '@/lib/api';
import { ContentEntry, ContentType, Locale } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NavigationEditor } from '@/components/content';
import { 
  Save, 
  Loader2, 
  Menu, 
  Plus,
  Globe,
  Settings,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface NavigationItem {
  label: string;
  href: string;
  order?: number;
  icon?: string;
  children?: NavigationItem[];
}

interface NavigationData {
  menu_key: string;
  items: NavigationItem[];
  sign_in_text?: string;
  sign_up_text?: string;
  search_placeholder?: string;
  view_cart_text?: string;
}

export default function NavigationPage() {
  const [contentType, setContentType] = useState<ContentType | null>(null);
  const [navigationEntries, setNavigationEntries] = useState<ContentEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<ContentEntry | null>(null);
  const [locales, setLocales] = useState<Locale[]>([]);
  const [selectedLocale, setSelectedLocale] = useState<string>('default');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Form data
  const [formData, setFormData] = useState<NavigationData>({
    menu_key: '',
    items: []
  });
  const [status, setStatus] = useState('draft');

  const loadContentType = useCallback(async () => {
    try {
      const types = await contentApi.getContentTypes();
      const navType = (Array.isArray(types) ? types : []).find(
        (t: ContentType) => t.api_id === 'navigation' || t.slug === 'navigation'
      );
      if (navType) {
        setContentType(navType);
        return navType;
      }
      return null;
    } catch (err) {
      console.error('Failed to load content types:', err);
      return null;
    }
  }, []);

  const loadNavigationEntries = useCallback(async (typeId: string) => {
    try {
      const data = await contentApi.getContentEntries({ content_type_id: typeId });
      const entries = data.items || [];
      setNavigationEntries(entries);
      if (entries.length > 0 && !selectedEntry) {
        setSelectedEntry(entries[0]);
        const entryData = entries[0].data || entries[0].content_data || {};
        setFormData({
          menu_key: entryData.menu_key || '',
          items: entryData.items || [],
          sign_in_text: entryData.sign_in_text,
          sign_up_text: entryData.sign_up_text,
          search_placeholder: entryData.search_placeholder,
          view_cart_text: entryData.view_cart_text
        });
        setStatus(entries[0].status || 'draft');
      }
    } catch (err) {
      console.error('Failed to load navigation entries:', err);
    }
  }, [selectedEntry]);

  const loadLocales = useCallback(async () => {
    try {
      const data = await translationApi.getLocales();
      setLocales(Array.isArray(data) ? data.filter((l: Locale) => l.is_enabled) : []);
    } catch (err) {
      console.error('Failed to load locales:', err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const [navType] = await Promise.all([loadContentType(), loadLocales()]);
        if (navType) {
          await loadNavigationEntries(navType.id);
        }
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [loadContentType, loadNavigationEntries, loadLocales]);

  const handleEntrySelect = (entry: ContentEntry) => {
    setSelectedEntry(entry);
    const entryData = entry.data || entry.content_data || {};
    setFormData({
      menu_key: entryData.menu_key || '',
      items: entryData.items || [],
      sign_in_text: entryData.sign_in_text,
      sign_up_text: entryData.sign_up_text,
      search_placeholder: entryData.search_placeholder,
      view_cart_text: entryData.view_cart_text
    });
    setStatus(entry.status || 'draft');
    setSelectedLocale('default');
  };

  const handleSave = async () => {
    if (!selectedEntry) return;

    try {
      setIsSaving(true);
      const updated = await contentApi.updateContentEntry(selectedEntry.id, {
        slug: selectedEntry.slug,
        status: status as 'draft' | 'published' | 'archived',
        data: formData
      });
      
      // Update the entry in our list
      setNavigationEntries(prev => 
        prev.map(e => e.id === updated.id ? updated : e)
      );
      setSelectedEntry(updated);
      
      toast.success('Navigation saved successfully');
      
      // Trigger translation if needed
      if (locales.length > 0) {
        try {
          // The CMS should auto-translate on save
          toast.success('Translations will be updated automatically');
        } catch (err) {
          console.error('Translation trigger failed:', err);
        }
      }
    } catch (error: any) {
      console.error('Failed to save:', error);
      toast.error(error.response?.data?.detail || 'Failed to save navigation');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNew = async () => {
    if (!contentType) return;

    try {
      setIsSaving(true);
      const newEntry = await contentApi.createContentEntry({
        content_type_id: contentType.id,
        slug: `nav-${Date.now()}`,
        status: 'draft',
        data: {
          menu_key: 'new-menu',
          items: []
        }
      });
      
      setNavigationEntries(prev => [...prev, newEntry]);
      handleEntrySelect(newEntry);
      toast.success('New navigation menu created');
    } catch (error: any) {
      console.error('Failed to create:', error);
      toast.error(error.response?.data?.detail || 'Failed to create navigation');
    } finally {
      setIsSaving(false);
    }
  };

  const getMenuIcon = (menuKey: string) => {
    switch (menuKey) {
      case 'header':
        return '🏠';
      case 'footer':
        return '👣';
      case 'mobile':
        return '📱';
      default:
        return '📋';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!contentType) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Menu className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Navigation Management</h1>
        </div>
        <Card>
          <CardContent className="flex items-center gap-4 py-8">
            <AlertCircle className="h-8 w-8 text-amber-500" />
            <div>
              <h3 className="font-semibold">Navigation Content Type Not Found</h3>
              <p className="text-sm text-muted-foreground">
                Please create a "Navigation" content type with an api_id of "navigation" first.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Menu className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Navigation Management</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleCreateNew} disabled={isSaving}>
            <Plus className="h-4 w-4 mr-2" />
            New Menu
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !selectedEntry}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Menu Selector */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">Navigation Menus</CardTitle>
            <CardDescription>Select a menu to edit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {navigationEntries.map((entry) => {
              const data = entry.data || entry.content_data || {};
              const menuKey = data.menu_key || entry.slug;
              const isSelected = selectedEntry?.id === entry.id;
              
              return (
                <button
                  key={entry.id}
                  onClick={() => handleEntrySelect(entry)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                    isSelected 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                  }`}
                >
                  <span className="text-xl">{getMenuIcon(menuKey)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium capitalize truncate">
                      {menuKey.replace(/-/g, ' ')}
                    </div>
                    <div className={`text-xs ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {(data.items || []).length} items
                    </div>
                  </div>
                  <Badge 
                    variant={entry.status === 'published' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {entry.status}
                  </Badge>
                </button>
              );
            })}

            {navigationEntries.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <Menu className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No menus yet</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={handleCreateNew}
                >
                  Create First Menu
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Editor */}
        <Card className="lg:col-span-3">
          {selectedEntry ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="capitalize">
                      {formData.menu_key.replace(/-/g, ' ')} Menu
                    </CardTitle>
                    <CardDescription>
                      Edit menu items and UI strings
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Status:</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="items" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="items">Menu Items</TabsTrigger>
                    {formData.menu_key === 'header' && (
                      <TabsTrigger value="ui-strings">UI Strings</TabsTrigger>
                    )}
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                    {locales.length > 0 && (
                      <TabsTrigger value="translations">
                        <Globe className="h-4 w-4 mr-1" />
                        Translations
                      </TabsTrigger>
                    )}
                  </TabsList>

                  <TabsContent value="items" className="space-y-4">
                    <NavigationEditor
                      items={formData.items}
                      onChange={(items) => setFormData(prev => ({ ...prev, items }))}
                      allowChildren={formData.menu_key === 'header'}
                      maxDepth={2}
                    />
                  </TabsContent>

                  {formData.menu_key === 'header' && (
                    <TabsContent value="ui-strings" className="space-y-6">
                      <p className="text-sm text-muted-foreground">
                        These text strings appear in the header UI and will be automatically translated.
                      </p>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="sign_in_text">Sign In Button</Label>
                          <Input
                            id="sign_in_text"
                            value={formData.sign_in_text || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, sign_in_text: e.target.value }))}
                            placeholder="Sign In"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sign_up_text">Sign Up Button</Label>
                          <Input
                            id="sign_up_text"
                            value={formData.sign_up_text || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, sign_up_text: e.target.value }))}
                            placeholder="Sign Up"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="search_placeholder">Search Placeholder</Label>
                          <Input
                            id="search_placeholder"
                            value={formData.search_placeholder || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, search_placeholder: e.target.value }))}
                            placeholder="Search products..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="view_cart_text">View Cart Button</Label>
                          <Input
                            id="view_cart_text"
                            value={formData.view_cart_text || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, view_cart_text: e.target.value }))}
                            placeholder="View Cart"
                          />
                        </div>
                      </div>
                    </TabsContent>
                  )}

                  <TabsContent value="settings" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="menu_key">Menu Key (Identifier)</Label>
                      <Input
                        id="menu_key"
                        value={formData.menu_key}
                        onChange={(e) => setFormData(prev => ({ ...prev, menu_key: e.target.value }))}
                        placeholder="header, footer, mobile, etc."
                      />
                      <p className="text-xs text-muted-foreground">
                        This is used to identify the menu in your frontend application.
                      </p>
                    </div>
                  </TabsContent>

                  {locales.length > 0 && (
                    <TabsContent value="translations" className="space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <Globe className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Automatic Translation</p>
                          <p className="text-sm text-muted-foreground">
                            All localized fields are automatically translated when you save.
                            Available locales: {locales.map(l => l.name).join(', ')}
                          </p>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        {locales.map((locale) => (
                          <div key={locale.id} className="flex items-center gap-2 p-2 border rounded">
                            <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded">
                              {locale.code}
                            </span>
                            <span>{locale.name}</span>
                            <Badge variant="outline" className="ml-auto">
                              {locale.is_enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a menu from the list to edit</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
