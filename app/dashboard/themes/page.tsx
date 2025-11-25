'use client';

import { useState, useEffect } from 'react';
import { themeApi, Theme, ThemeCreate, ThemeColors } from '@/lib/api/themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function ThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [formData, setFormData] = useState<ThemeCreate>({
    name: '',
    display_name: '',
    description: '',
    colors: {
      primary: '#3D2817',
      secondary: '#6B4423',
      background: '#FFFFFF',
      foreground: '#000000',
      muted: '#F5F5F5',
      accent: '#8B5A2B',
    },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: { base: '16px' },
      fontWeight: { normal: '400', bold: '700' },
    },
    spacing: {
      base: '4px',
    },
    borderRadius: {
      sm: '4px',
      md: '8px',
      lg: '12px',
    },
  });

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    try {
      setLoading(true);
      const [themesRes, active] = await Promise.all([
        themeApi.listThemes({ include_system: true }),
        themeApi.getActiveTheme().catch(() => null),
      ]);
      setThemes(themesRes.themes);
      setActiveTheme(active);
    } catch (error) {
      console.error('Failed to load themes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      if (editingTheme) {
        await themeApi.updateTheme(editingTheme.id, formData);
      } else {
        await themeApi.createTheme(formData);
      }
      setShowDialog(false);
      resetForm();
      setEditingTheme(null);
      loadThemes();
    } catch (error: any) {
      alert(error.response?.data?.detail || `Failed to ${editingTheme ? 'update' : 'create'} theme`);
    }
  };

  const handleEdit = (theme: Theme) => {
    setEditingTheme(theme);
    setFormData({
      name: theme.name,
      display_name: theme.display_name,
      description: theme.description || '',
      colors: theme.colors,
      typography: theme.typography || {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: { base: '16px' },
        fontWeight: { normal: '400', bold: '700' },
      },
      spacing: theme.spacing || { base: '4px' },
      borderRadius: theme.borderRadius || { sm: '4px', md: '8px', lg: '12px' },
    });
    setShowDialog(true);
  };

  const handleExport = async (id: number, name: string) => {
    try {
      const exported = await themeApi.exportTheme(id);
      const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}-theme.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export theme:', error);
    }
  };

  const handleActivate = async (id: number) => {
    try {
      await themeApi.setActiveTheme(id);
      loadThemes();
    } catch (error) {
      console.error('Failed to activate theme:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this theme?')) return;
    try {
      await themeApi.deleteTheme(id);
      loadThemes();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      display_name: '',
      description: '',
      colors: {
        primary: '#3D2817',
        secondary: '#6B4423',
        background: '#FFFFFF',
        foreground: '#000000',
        muted: '#F5F5F5',
        accent: '#8B5A2B',
      },
      typography: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: { base: '16px' },
        fontWeight: { normal: '400', bold: '700' },
      },
      spacing: {
        base: '4px',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
      },
    });
    setEditingTheme(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Themes</h1>
          <p className="text-muted-foreground">Customize your CMS appearance and branding</p>
        </div>
        <Button onClick={() => { resetForm(); setShowDialog(true); }}>Create Theme</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Themes</CardDescription>
            <CardTitle className="text-3xl">{themes.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Custom Themes</CardDescription>
            <CardTitle className="text-3xl">{themes.filter(t => !t.is_system_theme).length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Theme</CardDescription>
            <CardTitle className="text-xl">{activeTheme?.display_name || 'None'}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {themes.map((theme) => (
          <Card key={theme.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{theme.display_name}</CardTitle>
                  <CardDescription className="mt-1">{theme.description}</CardDescription>
                </div>
                {theme.is_active && <Badge>Active</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="space-y-1">
                  <div className="w-full h-12 rounded" style={{ backgroundColor: theme.colors.primary }}></div>
                  <p className="text-xs text-center">Primary</p>
                </div>
                <div className="space-y-1">
                  <div className="w-full h-12 rounded" style={{ backgroundColor: theme.colors.secondary }}></div>
                  <p className="text-xs text-center">Secondary</p>
                </div>
                <div className="space-y-1">
                  <div className="w-full h-12 rounded border" style={{ backgroundColor: theme.colors.background }}></div>
                  <p className="text-xs text-center">BG</p>
                </div>
                <div className="space-y-1">
                  <div className="w-full h-12 rounded" style={{ backgroundColor: theme.colors.foreground }}></div>
                  <p className="text-xs text-center">FG</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {theme.is_system_theme && <Badge variant="outline">System</Badge>}
              </div>
              <div className="flex gap-2">
                {!theme.is_active && (
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleActivate(theme.id)}>Activate</Button>
                )}
                {!theme.is_system_theme && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(theme)}>Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => handleExport(theme.id, theme.name)}>Export</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(theme.id)}>Delete</Button>
                  </>
                )}
                {theme.is_system_theme && (
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleExport(theme.id, theme.name)}>Export</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTheme ? 'Edit Theme' : 'Create Theme'}</DialogTitle>
            <DialogDescription>
              {editingTheme ? 'Update your custom theme' : 'Create a custom theme for your CMS'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Theme ID*</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="dark-chocolate" />
            </div>
            <div className="grid gap-2">
              <Label>Display Name*</Label>
              <Input value={formData.display_name} onChange={(e) => setFormData({ ...formData, display_name: e.target.value })} placeholder="Dark Chocolate" />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe your theme" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Primary Color</Label>
                <div className="flex gap-2">
                  <Input type="color" value={formData.colors.primary} onChange={(e) => setFormData({ ...formData, colors: { ...formData.colors, primary: e.target.value } })} className="w-20" />
                  <Input value={formData.colors.primary} onChange={(e) => setFormData({ ...formData, colors: { ...formData.colors, primary: e.target.value } })} placeholder="#3D2817" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Secondary Color</Label>
                <div className="flex gap-2">
                  <Input type="color" value={formData.colors.secondary} onChange={(e) => setFormData({ ...formData, colors: { ...formData.colors, secondary: e.target.value } })} className="w-20" />
                  <Input value={formData.colors.secondary} onChange={(e) => setFormData({ ...formData, colors: { ...formData.colors, secondary: e.target.value } })} placeholder="#6B4423" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Background</Label>
                <div className="flex gap-2">
                  <Input type="color" value={formData.colors.background} onChange={(e) => setFormData({ ...formData, colors: { ...formData.colors, background: e.target.value } })} className="w-20" />
                  <Input value={formData.colors.background} onChange={(e) => setFormData({ ...formData, colors: { ...formData.colors, background: e.target.value } })} placeholder="#FFFFFF" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Foreground</Label>
                <div className="flex gap-2">
                  <Input type="color" value={formData.colors.foreground} onChange={(e) => setFormData({ ...formData, colors: { ...formData.colors, foreground: e.target.value } })} className="w-20" />
                  <Input value={formData.colors.foreground} onChange={(e) => setFormData({ ...formData, colors: { ...formData.colors, foreground: e.target.value } })} placeholder="#000000" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Muted Color</Label>
                <div className="flex gap-2">
                  <Input type="color" value={formData.colors.muted || '#F5F5F5'} onChange={(e) => setFormData({ ...formData, colors: { ...formData.colors, muted: e.target.value } })} className="w-20" />
                  <Input value={formData.colors.muted || '#F5F5F5'} onChange={(e) => setFormData({ ...formData, colors: { ...formData.colors, muted: e.target.value } })} placeholder="#F5F5F5" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Accent Color</Label>
                <div className="flex gap-2">
                  <Input type="color" value={formData.colors.accent || '#8B5A2B'} onChange={(e) => setFormData({ ...formData, colors: { ...formData.colors, accent: e.target.value } })} className="w-20" />
                  <Input value={formData.colors.accent || '#8B5A2B'} onChange={(e) => setFormData({ ...formData, colors: { ...formData.colors, accent: e.target.value } })} placeholder="#8B5A2B" />
                </div>
              </div>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Typography</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Font Family</Label>
                  <Input 
                    value={formData.typography?.fontFamily || ''} 
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      typography: { ...formData.typography!, fontFamily: e.target.value } 
                    })} 
                    placeholder="Inter, system-ui, sans-serif" 
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Base Font Size</Label>
                  <Input 
                    value={formData.typography?.fontSize?.base || ''} 
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      typography: { 
                        ...formData.typography!, 
                        fontSize: { ...formData.typography?.fontSize, base: e.target.value } 
                      } 
                    })} 
                    placeholder="16px" 
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleCreate}>{editingTheme ? 'Update Theme' : 'Create Theme'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
