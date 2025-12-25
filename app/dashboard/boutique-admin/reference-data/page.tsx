'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccessToken } from '@/hooks/use-access-token';
import { useReferenceDataPage, interpolate } from '@/hooks/use-admin-page';
import apiClient from '@/lib/api/client';
import { getStoreSettings } from '@/lib/api/platform';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Building2, 
  UserCircle, 
  Activity,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { AdminPageLoading } from '@/components/boutique-admin/ui';

// ============================================================================
// Types
// ============================================================================

interface ReferenceDataEntry {
  id: string;
  title: string;
  slug: string;
  status: string;
  data: {
    data_type: 'department' | 'role' | 'status';
    code: string;
    label: string;
    description?: string;
    icon?: string;
    color?: string;
    metadata?: Record<string, unknown>;
    is_system: boolean;
    is_active: boolean;
    sort_order: number;
  };
  created_at: string;
  updated_at: string;
}

interface FormData {
  data_type: 'department' | 'role' | 'status';
  code: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  is_active: boolean;
  sort_order: number;
  metadata: string; // JSON string for metadata
}

const DEFAULT_FORM_DATA: FormData = {
  data_type: 'department',
  code: '',
  label: '',
  description: '',
  icon: '',
  color: '#6B7280',
  is_active: true,
  sort_order: 50,
  metadata: '{}',
};

// ============================================================================
// Component
// ============================================================================

export default function ReferenceDataPage() {
  const token = useAccessToken();
  const { content: pageContent, loading: contentLoading } = useReferenceDataPage();
  const [entries, setEntries] = useState<ReferenceDataEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [contentTypeId, setContentTypeId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'department' | 'role' | 'status'>('department');
  
  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ReferenceDataEntry | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<ReferenceDataEntry | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number>(50); // Default page size

  // Helper to get translated label with interpolation
  const t = useCallback((key: string, values?: Record<string, string>): string => {
    if (!pageContent) return key;
    const keys = key.split('.');
    let value: unknown = pageContent;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return key;
      }
    }
    const result = typeof value === 'string' ? value : key;
    return values ? interpolate(result, values) : result;
  }, [pageContent]);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const fetchSettings = useCallback(async () => {
    // Wait for token to be available
    if (token === null) return;
    
    try {
      const settings = await getStoreSettings(token || undefined);
      if (settings?.defaultPageSize) {
        setPageSize(settings.defaultPageSize);
      }
    } catch (error) {
      console.error('Failed to fetch store settings:', error);
      // Use default page size if settings fail to load
    }
  }, [token]);

  const fetchContentTypeId = useCallback(async () => {
    try {
      const response = await apiClient.get('/content/types');
      const types = response.data;
      const refDataType = types.find((t: { api_id: string }) => t.api_id === 'organization_reference_data');
      if (refDataType) {
        setContentTypeId(refDataType.id);
        return refDataType.id;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch content types:', error);
      return null;
    }
  }, []);

  const fetchEntries = useCallback(async (size?: number) => {
    setLoading(true);
    try {
      // Always use at least 100 to ensure we get all reference data
      const effectivePageSize = Math.max(size || pageSize, 100);
      const response = await apiClient.get('/content/entries', {
        params: {
          content_type_slug: 'organization_reference_data',
          page_size: effectivePageSize,
        },
      });
      setEntries(response.data?.items || []);
    } catch (error) {
      console.error('Failed to fetch reference data:', error);
      setErrorMessage('Failed to load reference data. The content type may not exist yet.');
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    // Wait for token to be available before initializing
    if (token === null) return;
    
    const init = async () => {
      await fetchSettings();
      await fetchContentTypeId();
      await fetchEntries();
    };
    init();
  }, [token, fetchContentTypeId, fetchEntries, fetchSettings]);

  // ============================================================================
  // Filter entries by type
  // ============================================================================

  const filteredEntries = entries.filter(e => e.data?.data_type === activeTab);
  const sortedEntries = [...filteredEntries].sort((a, b) => 
    (a.data?.sort_order || 99) - (b.data?.sort_order || 99)
  );

  // ============================================================================
  // Form Handlers
  // ============================================================================

  const resetForm = () => {
    setFormData({ ...DEFAULT_FORM_DATA, data_type: activeTab });
    setEditingEntry(null);
    setErrorMessage(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setCreateOpen(true);
  };

  const openEditDialog = (entry: ReferenceDataEntry) => {
    setFormData({
      data_type: entry.data.data_type,
      code: entry.data.code,
      label: entry.data.label,
      description: entry.data.description || '',
      icon: entry.data.icon || '',
      color: entry.data.color || '#6B7280',
      is_active: entry.data.is_active,
      sort_order: entry.data.sort_order,
      metadata: JSON.stringify(entry.data.metadata || {}, null, 2),
    });
    setEditingEntry(entry);
    setCreateOpen(true);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.code.trim()) {
      setErrorMessage('Code is required');
      return;
    }
    if (!formData.label.trim()) {
      setErrorMessage('Label is required');
      return;
    }

    // Validate code format (uppercase with underscores)
    const codePattern = /^[A-Z][A-Z0-9_]*$/;
    if (!codePattern.test(formData.code)) {
      setErrorMessage('Code must be uppercase letters, numbers, and underscores (e.g., CUSTOM_ROLE)');
      return;
    }

    // Parse metadata
    let metadata = {};
    try {
      metadata = JSON.parse(formData.metadata || '{}');
    } catch {
      setErrorMessage('Invalid JSON in metadata field');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const slug = `${formData.data_type}-${formData.code.toLowerCase().replace(/_/g, '-')}`;
      const payload = {
        content_type_id: contentTypeId,
        slug,
        status: 'published',
        data: {
          data_type: formData.data_type,
          code: formData.code.toUpperCase(),
          label: formData.label,
          description: formData.description || null,
          icon: formData.icon || null,
          color: formData.color || null,
          metadata,
          is_system: false, // Custom entries are never system
          is_active: formData.is_active,
          sort_order: formData.sort_order,
        },
      };

      if (editingEntry) {
        // Update
        await apiClient.put(`/content/entries/${editingEntry.id}`, payload);
        setSuccessMessage('Reference data updated successfully');
      } else {
        // Create
        await apiClient.post('/content/entries', payload);
        setSuccessMessage('Reference data created successfully');
      }

      setCreateOpen(false);
      resetForm();
      await fetchEntries();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: unknown) {
      console.error('Failed to save reference data:', error);
      const apiError = error as { response?: { data?: { detail?: string } } };
      setErrorMessage(apiError.response?.data?.detail || 'Failed to save reference data');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!entryToDelete) return;

    // Don't allow deleting system entries
    if (entryToDelete.data.is_system) {
      setErrorMessage('Cannot delete system entries');
      setDeleteDialogOpen(false);
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.delete(`/content/entries/${entryToDelete.id}`);
      setSuccessMessage('Reference data deleted successfully');
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
      await fetchEntries();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: unknown) {
      console.error('Failed to delete reference data:', error);
      const apiError = error as { response?: { data?: { detail?: string } } };
      setErrorMessage(apiError.response?.data?.detail || t('messages.error_deleting', { type: getSingularLabel(entryToDelete.data.data_type) }));
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  const getTabIcon = (type: string) => {
    switch (type) {
      case 'department': return <Building2 className="h-4 w-4" />;
      case 'role': return <UserCircle className="h-4 w-4" />;
      case 'status': return <Activity className="h-4 w-4" />;
      default: return null;
    }
  };

  const getTabLabel = (type: string) => {
    return t(`labels.${type}s`) || t(`tabs.${type}`) || type;
  };

  const getSingularLabel = (type: string) => {
    return t(`labels.${type}`) || type;
  };

  if (loading || contentLoading) {
    return (
      <div className="container mx-auto py-8">
        <AdminPageLoading
          title={t('loading.title')}
          message={t('loading.message')}
          showStats={false}
          showTabs={true}
          tabCount={3}
          showCards={true}
          cardCount={6}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchEntries()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('buttons.refresh')}
          </Button>
          <Dialog open={createOpen} onOpenChange={(open) => {
            setCreateOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                {t('buttons.add_custom', { type: getSingularLabel(activeTab) })}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingEntry 
                    ? t('messages.edit_title', { type: getSingularLabel(formData.data_type) })
                    : t('messages.create_title', { type: getSingularLabel(formData.data_type) })}
                </DialogTitle>
                <DialogDescription>
                  {t('messages.dialog_description', { type: formData.data_type })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Type Selector */}
                <div className="space-y-2">
                  <Label htmlFor="data_type">{t('form_labels.type')}</Label>
                  <Select 
                    value={formData.data_type} 
                    onValueChange={(value) => setFormData({ ...formData, data_type: value as FormData['data_type'] })}
                    disabled={!!editingEntry}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('form_labels.type')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="department">{t('select_options.department')}</SelectItem>
                      <SelectItem value="role">{t('select_options.role')}</SelectItem>
                      <SelectItem value="status">{t('select_options.status')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Code */}
                <div className="space-y-2">
                  <Label htmlFor="code">{t('form_labels.code')} *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder={t('form_placeholders.code')}
                    disabled={!!editingEntry}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('form_help.code')}
                  </p>
                </div>

                {/* Label */}
                <div className="space-y-2">
                  <Label htmlFor="label">{t('form_labels.label')} *</Label>
                  <Input
                    id="label"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder={t('form_placeholders.label')}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">{t('form_labels.description')}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t('form_placeholders.description')}
                    rows={2}
                  />
                </div>

                {/* Icon & Color */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="icon">{t('form_labels.icon')}</Label>
                    <Input
                      id="icon"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder={t('form_placeholders.icon')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">{t('form_labels.color')}</Label>
                    <div className="flex gap-2">
                      <Input
                        id="color"
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        placeholder={t('form_placeholders.color')}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Sort Order & Active */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sort_order">{t('form_labels.sort_order')}</Label>
                    <Input
                      id="sort_order"
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 50 })}
                      min={1}
                      max={999}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('form_labels.active')}</Label>
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                      <span className="text-sm text-muted-foreground">
                        {formData.is_active ? t('select_options.enabled') : t('select_options.disabled')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metadata (JSON) - Only for roles */}
                {formData.data_type === 'role' && (
                  <div className="space-y-2">
                    <Label htmlFor="metadata">{t('form_labels.metadata')}</Label>
                    <Textarea
                      id="metadata"
                      value={formData.metadata}
                      onChange={(e) => setFormData({ ...formData, metadata: e.target.value })}
                      placeholder={t('form_placeholders.metadata')}
                      rows={3}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('form_help.metadata')}
                    </p>
                  </div>
                )}

                {errorMessage && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  {t('buttons.cancel')}
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingEntry ? t('buttons.update') : t('buttons.create')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}
      {errorMessage && !createOpen && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Content Type Check */}
      {!contentTypeId && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('messages.content_type_missing')}
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="department" className="flex items-center gap-2">
            {getTabIcon('department')}
            {t('tabs.department')}
          </TabsTrigger>
          <TabsTrigger value="role" className="flex items-center gap-2">
            {getTabIcon('role')}
            {t('tabs.role')}
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center gap-2">
            {getTabIcon('status')}
            {t('tabs.status')}
          </TabsTrigger>
        </TabsList>

        {['department', 'role', 'status'].map((tabType) => (
          <TabsContent key={tabType} value={tabType} className="mt-6">
            {sortedEntries.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  {getTabIcon(tabType)}
                  <h3 className="mt-4 text-lg font-semibold">{t('empty_states.no_custom', { type: getTabLabel(tabType).toLowerCase() })}</h3>
                  <p className="text-muted-foreground mt-2">
                    {t('empty_states.add_custom_hint', { type: getTabLabel(tabType).toLowerCase() })}
                  </p>
                  <Button onClick={openCreateDialog} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('empty_states.add_first', { type: getSingularLabel(tabType) })}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedEntries.map((entry) => (
                  <Card key={entry.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          {entry.data.color && (
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: entry.data.color }}
                            />
                          )}
                          <CardTitle className="text-lg">{entry.data.label}</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          {entry.data.is_system && (
                            <Badge variant="secondary">{t('labels.system')}</Badge>
                          )}
                          {!entry.data.is_active && (
                            <Badge variant="outline">{t('labels.inactive')}</Badge>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(entry)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                {t('buttons.edit')}
                              </DropdownMenuItem>
                              {!entry.data.is_system && (
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setEntryToDelete(entry);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {t('buttons.delete')}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <CardDescription className="font-mono text-xs">
                        {entry.data.code}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {entry.data.description && (
                        <p className="text-sm text-muted-foreground">
                          {entry.data.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span>{t('labels.order')}: {entry.data.sort_order}</span>
                        {entry.data.icon && <span>• {t('labels.icon')}: {entry.data.icon}</span>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('messages.delete_title')}</DialogTitle>
            <DialogDescription>
              {t('messages.delete_confirm', { label: entryToDelete?.data.label || '' })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('buttons.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('buttons.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
