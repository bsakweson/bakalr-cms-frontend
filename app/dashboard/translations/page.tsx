'use client';

import { useState, useEffect } from 'react';
import { translationApi, LocaleCreate, LocaleUpdate } from '@/lib/api/translation';
import type { Locale } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

export default function TranslationsPage() {
  const [locales, setLocales] = useState<Locale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingLocale, setEditingLocale] = useState<Locale | null>(null);
  const [formData, setFormData] = useState<LocaleCreate>({
    code: '',
    name: '',
    native_name: '',
    is_default: false,
    is_enabled: true,
    auto_translate: false,
  });

  useEffect(() => {
    loadLocales();
  }, []);

  const loadLocales = async () => {
    try {
      setLoading(true);
      const data = await translationApi.getLocales(false);
      setLocales(data);
    } catch (error) {
      console.error('Failed to load locales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await translationApi.createLocale(formData);
      setShowCreateDialog(false);
      resetForm();
      loadLocales();
    } catch (error: any) {
      console.error('Failed to create locale:', error);
      alert(error.response?.data?.detail || 'Failed to create locale');
    }
  };

  const handleUpdate = async () => {
    if (!editingLocale) return;
    try {
      const updateData: LocaleUpdate = {
        name: formData.name,
        native_name: formData.native_name,
        is_default: formData.is_default,
        is_enabled: formData.is_enabled,
        auto_translate: formData.auto_translate,
      };
      await translationApi.updateLocale(editingLocale.code, updateData);
      setEditingLocale(null);
      resetForm();
      loadLocales();
    } catch (error: any) {
      console.error('Failed to update locale:', error);
      alert(error.response?.data?.detail || 'Failed to update locale');
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm('Are you sure you want to delete this locale?')) return;
    try {
      await translationApi.deleteLocale(code);
      loadLocales();
    } catch (error: any) {
      console.error('Failed to delete locale:', error);
      alert(error.response?.data?.detail || 'Failed to delete locale');
    }
  };

  const handleToggleEnabled = async (locale: Locale) => {
    try {
      await translationApi.updateLocale(locale.code, {
        is_enabled: !locale.is_enabled,
      });
      loadLocales();
    } catch (error) {
      console.error('Failed to toggle locale:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      native_name: '',
      is_default: false,
      is_enabled: true,
      auto_translate: false,
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setEditingLocale(null);
    setShowCreateDialog(true);
  };

  const openEditDialog = (locale: Locale) => {
    setFormData({
      code: locale.code,
      name: locale.name,
      native_name: locale.native_name || '',
      is_default: locale.is_default,
      is_enabled: locale.is_enabled,
      auto_translate: locale.auto_translate,
    });
    setEditingLocale(locale);
    setShowCreateDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Translations & Locales</h1>
          <p className="text-muted-foreground">Manage content translations and language settings</p>
        </div>
        <Button onClick={openCreateDialog}>Add Locale</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Locales</CardDescription>
            <CardTitle className="text-3xl">{locales.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Enabled</CardDescription>
            <CardTitle className="text-3xl">
              {locales.filter((l) => l.is_enabled).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Auto-Translate</CardDescription>
            <CardTitle className="text-3xl">
              {locales.filter((l) => l.auto_translate).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Default Locale</CardDescription>
            <CardTitle className="text-xl">
              {locales.find((l) => l.is_default)?.name || 'None'}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Locales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Available Locales</CardTitle>
          <CardDescription>
            Manage languages for multi-language content support
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-muted-foreground">Loading locales...</div>
            </div>
          ) : locales.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No locales configured. Add your first locale to enable translations.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Native Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locales.map((locale) => (
                  <TableRow key={locale.code}>
                    <TableCell className="font-mono font-semibold">{locale.code}</TableCell>
                    <TableCell>{locale.name}</TableCell>
                    <TableCell>{locale.native_name || '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {locale.is_default && (
                          <Badge variant="default">Default</Badge>
                        )}
                        {locale.is_enabled ? (
                          <Badge variant="outline" className="bg-green-50">
                            Enabled
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Disabled</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {locale.auto_translate && (
                        <Badge variant="outline">Auto-Translate</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleEnabled(locale)}
                        >
                          {locale.is_enabled ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(locale)}
                        >
                          Edit
                        </Button>
                        {!locale.is_default && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(locale.code)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>
              {editingLocale ? 'Edit Locale' : 'Add New Locale'}
            </DialogTitle>
            <DialogDescription>
              {editingLocale
                ? 'Update locale settings'
                : 'Add a new language for content translation'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Locale Code*</Label>
              <Input
                id="code"
                placeholder="e.g., en, es, fr, de"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                disabled={!!editingLocale}
              />
              <p className="text-xs text-muted-foreground">
                ISO 639-1 language code (2 letters)
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Display Name*</Label>
              <Input
                id="name"
                placeholder="e.g., English, Spanish, French"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="native_name">Native Name</Label>
              <Input
                id="native_name"
                placeholder="e.g., English, Español, Français"
                value={formData.native_name}
                onChange={(e) =>
                  setFormData({ ...formData, native_name: e.target.value })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Default Locale</Label>
                <p className="text-xs text-muted-foreground">
                  Set as the default language
                </p>
              </div>
              <Switch
                checked={formData.is_default}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_default: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enabled</Label>
                <p className="text-xs text-muted-foreground">
                  Make this locale available
                </p>
              </div>
              <Switch
                checked={formData.is_enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_enabled: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-Translate</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically translate content
                </p>
              </div>
              <Switch
                checked={formData.auto_translate}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, auto_translate: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={editingLocale ? handleUpdate : handleCreate}>
              {editingLocale ? 'Update' : 'Create'} Locale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
