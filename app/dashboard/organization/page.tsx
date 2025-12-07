'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { organizationApi } from '@/lib/api';
import { apiKeysApi, type APIKey, type APIKeyWithSecret } from '@/lib/api/api-keys';
import { translationApi, LocaleCreate, LocaleUpdate } from '@/lib/api/translation';
import type { OrganizationProfile, Locale } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Key, Plus, Trash2, AlertTriangle, Pencil, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const AVAILABLE_SCOPES = [
  { value: 'read:content', label: 'Read Content', description: 'View content entries and types' },
  { value: 'write:content', label: 'Write Content', description: 'Create and update content' },
  { value: 'delete:content', label: 'Delete Content', description: 'Delete content entries' },
  { value: 'read:media', label: 'Read Media', description: 'Access media files' },
  { value: 'write:media', label: 'Upload Media', description: 'Upload media files' },
  { value: 'delete:media', label: 'Delete Media', description: 'Delete media files' },
  { value: 'read:translation', label: 'Read Translations', description: 'Access translations' },
  { value: 'read:analytics', label: 'Read Analytics', description: 'View analytics data' },
  { value: 'themes.read', label: 'Read Themes', description: 'View themes' },
];

export default function OrganizationSettingsPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'profile');
  
  const [profile, setProfile] = useState<OrganizationProfile | null>(null);
  const [locales, setLocales] = useState<Locale[]>([]);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Update active tab when URL param changes
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    description: '',
    email: '',
    website: '',
    logo_url: '',
  });

  // Locale dialog state
  const [localeDialogOpen, setLocaleDialogOpen] = useState(false);
  const [editingLocale, setEditingLocale] = useState<Locale | null>(null);
  const [deleteLocaleDialogOpen, setDeleteLocaleDialogOpen] = useState(false);
  const [localeToDelete, setLocaleToDelete] = useState<{ id: string; name: string } | null>(null);
  const [localeForm, setLocaleForm] = useState<LocaleCreate>({
    code: '',
    name: '',
    native_name: '',
    is_default: false,
    is_enabled: true,
    auto_translate: false,
  });

  // API Key dialog state
  const [showCreateKeyDialog, setShowCreateKeyDialog] = useState(false);
  const [showEditKeyDialog, setShowEditKeyDialog] = useState(false);
  const [showSecretDialog, setShowSecretDialog] = useState(false);
  const [showDeleteKeyDialog, setShowDeleteKeyDialog] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<{ id: string; name: string } | null>(null);
  const [editingKey, setEditingKey] = useState<APIKey | null>(null);
  const [generatedKey, setGeneratedKey] = useState<APIKeyWithSecret | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);
  const [updatingKey, setUpdatingKey] = useState(false);
  const [createKeyForm, setCreateKeyForm] = useState({
    name: '',
    scopes: [] as string[],
    expires_at: '',
  });
  const [editKeyForm, setEditKeyForm] = useState({
    name: '',
    scopes: [] as string[],
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileData, localesData, apiKeysData] = await Promise.all([
        organizationApi.getProfile(),
        translationApi.getLocales(false),
        apiKeysApi.listAPIKeys(),
      ]);

      setProfile(profileData);
      setProfileForm({
        name: profileData.name,
        description: profileData.description || '',
        email: profileData.email || '',
        website: profileData.website || '',
        logo_url: profileData.logo_url || '',
      });
      setLocales(localesData);
      setApiKeys(apiKeysData.items || []);
    } catch (error) {
      console.error('Failed to load organization data:', error);
      setMessage({ type: 'error', text: 'Failed to load organization data' });
    } finally {
      setLoading(false);
    }
  };

  // Profile handlers
  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const updated = await organizationApi.updateProfile(profileForm);
      setProfile(updated);
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (error) {
      console.error('Failed to update profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  // Locale handlers
  const handleCreateLocale = async () => {
    if (!localeForm.code || !localeForm.name) return;

    try {
      setSaving(true);
      if (editingLocale) {
        const updateData: LocaleUpdate = {
          name: localeForm.name,
          native_name: localeForm.native_name,
          is_default: localeForm.is_default,
          is_enabled: localeForm.is_enabled,
          auto_translate: localeForm.auto_translate,
        };
        await translationApi.updateLocale(editingLocale.code, updateData);
        setMessage({ type: 'success', text: 'Locale updated successfully' });
      } else {
        await translationApi.createLocale(localeForm);
        setMessage({ type: 'success', text: 'Locale created successfully' });
      }
      setLocaleDialogOpen(false);
      setEditingLocale(null);
      setLocaleForm({
        code: '',
        name: '',
        native_name: '',
        is_default: false,
        is_enabled: true,
        auto_translate: false,
      });
      await loadData();
    } catch (error: any) {
      console.error('Failed to save locale:', error);
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to save locale' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleLocale = async (locale: Locale) => {
    try {
      await translationApi.updateLocale(locale.id, {
        is_enabled: !locale.is_enabled,
      });
      await loadData();
      setMessage({ type: 'success', text: 'Locale updated successfully' });
    } catch (error) {
      console.error('Failed to toggle locale:', error);
      setMessage({ type: 'error', text: 'Failed to toggle locale' });
    }
  };

  const handleSetDefaultLocale = async (locale: Locale) => {
    try {
      await translationApi.updateLocale(locale.id, {
        is_default: true,
      });
      await loadData();
      setMessage({ type: 'success', text: 'Default locale updated' });
    } catch (error) {
      console.error('Failed to set default locale:', error);
      setMessage({ type: 'error', text: 'Failed to set default locale' });
    }
  };

  const openDeleteLocaleDialog = (id: string, name: string) => {
    setLocaleToDelete({ id, name });
    setDeleteLocaleDialogOpen(true);
  };

  const handleDeleteLocale = async () => {
    if (!localeToDelete) return;

    try {
      await translationApi.deleteLocale(localeToDelete.id);
      setDeleteLocaleDialogOpen(false);
      setLocaleToDelete(null);
      await loadData();
      setMessage({ type: 'success', text: 'Locale deleted successfully' });
    } catch (error: any) {
      console.error('Failed to delete locale:', error);
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to delete locale' });
      setDeleteLocaleDialogOpen(false);
    }
  };

  const openEditLocale = (locale: Locale) => {
    setEditingLocale(locale);
    setLocaleForm({
      code: locale.code,
      name: locale.name,
      native_name: locale.native_name || '',
      is_default: locale.is_default,
      is_enabled: locale.is_enabled,
      auto_translate: locale.auto_translate,
    });
    setLocaleDialogOpen(true);
  };

  // API Key handlers
  const handleCreateKey = async () => {
    if (!createKeyForm.name.trim()) {
      setMessage({ type: 'error', text: 'Please enter a name for the API key' });
      return;
    }

    if (createKeyForm.scopes.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one permission scope' });
      return;
    }

    try {
      setCreatingKey(true);
      setMessage(null);

      const payload: any = {
        name: createKeyForm.name,
        scopes: createKeyForm.scopes,
      };

      if (createKeyForm.expires_at) {
        payload.expires_at = new Date(createKeyForm.expires_at).toISOString();
      }

      const response = await apiKeysApi.createAPIKey(payload);

      setGeneratedKey(response);
      setShowCreateKeyDialog(false);
      setShowSecretDialog(true);
      setCreateKeyForm({ name: '', scopes: [], expires_at: '' });
      await loadData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to create API key' });
    } finally {
      setCreatingKey(false);
    }
  };

  const confirmDeleteKey = (keyId: string, keyName: string) => {
    setKeyToDelete({ id: keyId, name: keyName });
    setShowDeleteKeyDialog(true);
  };

  const handleDeleteKey = async () => {
    if (!keyToDelete) return;

    try {
      await apiKeysApi.deleteAPIKey(keyToDelete.id);
      setMessage({ type: 'success', text: 'API key deleted successfully' });
      setShowDeleteKeyDialog(false);
      setKeyToDelete(null);
      await loadData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to delete API key' });
    }
  };

  const handleCopyKey = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey.key);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const toggleScope = (scope: string) => {
    setCreateKeyForm((prev) => ({
      ...prev,
      scopes: prev.scopes.includes(scope)
        ? prev.scopes.filter((s) => s !== scope)
        : [...prev.scopes, scope],
    }));
  };

  const toggleEditScope = (scope: string) => {
    setEditKeyForm((prev) => ({
      ...prev,
      scopes: prev.scopes.includes(scope)
        ? prev.scopes.filter((s) => s !== scope)
        : [...prev.scopes, scope],
    }));
  };

  const openEditDialog = (key: APIKey) => {
    setEditingKey(key);
    setEditKeyForm({
      name: key.name,
      scopes: [...key.scopes],
      is_active: key.is_active,
    });
    setShowEditKeyDialog(true);
  };

  const handleUpdateKey = async () => {
    if (!editingKey) return;

    if (!editKeyForm.name.trim()) {
      setMessage({ type: 'error', text: 'Please provide a name for the API key' });
      return;
    }

    try {
      setUpdatingKey(true);
      setMessage(null);

      await apiKeysApi.updateAPIKey(editingKey.id, {
        name: editKeyForm.name,
        scopes: editKeyForm.scopes,
        is_active: editKeyForm.is_active,
      });

      setMessage({ type: 'success', text: 'API key updated successfully' });
      setShowEditKeyDialog(false);
      setEditingKey(null);
      setEditKeyForm({ name: '', scopes: [], is_active: true });
      await loadData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to update API key' });
    } finally {
      setUpdatingKey(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isExpired = (dateString: string | null) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Organization Settings</h1>
        <p className="text-muted-foreground">Manage your organization profile, languages, and API access</p>
      </div>

      {message && (
        <Alert className={message.type === 'error' ? 'border-red-500' : 'border-green-500'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="languages">Languages</TabsTrigger>
          <TabsTrigger value="translations">Translations</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Organization Profile</CardTitle>
              <CardDescription>Update your organization's public information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name</Label>
                  <Input
                    id="name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Contact Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={profileForm.description}
                  onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={profileForm.website}
                    onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input
                    id="logo_url"
                    type="url"
                    value={profileForm.logo_url}
                    onChange={(e) => setProfileForm({ ...profileForm, logo_url: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>

              {profile && (
                <div className="pt-4 border-t space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Slug:</span>
                    <span className="font-mono">{profile.slug}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Plan:</span>
                    <Badge variant="outline">{profile.plan_type}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span>{formatDate(profile.created_at)}</span>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Languages Tab */}
        <TabsContent value="languages" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Languages & Locales</CardTitle>
                  <CardDescription>Manage available languages for your content</CardDescription>
                </div>
                <Dialog open={localeDialogOpen} onOpenChange={setLocaleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      {editingLocale ? 'Edit Language' : 'Add Language'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingLocale ? 'Edit Language' : 'Add New Language'}</DialogTitle>
                      <DialogDescription>Define a new locale for translations</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="locale-code">Locale Code</Label>
                        <Input
                          id="locale-code"
                          value={localeForm.code}
                          onChange={(e) => setLocaleForm({ ...localeForm, code: e.target.value })}
                          placeholder="e.g., en, fr, es, de"
                          disabled={!!editingLocale}
                        />
                        <p className="text-xs text-muted-foreground">ISO 639-1 language code</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="locale-name">Display Name</Label>
                        <Input
                          id="locale-name"
                          value={localeForm.name}
                          onChange={(e) => setLocaleForm({ ...localeForm, name: e.target.value })}
                          placeholder="e.g., English, French, Spanish"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="locale-native">Native Name (Optional)</Label>
                        <Input
                          id="locale-native"
                          value={localeForm.native_name}
                          onChange={(e) => setLocaleForm({ ...localeForm, native_name: e.target.value })}
                          placeholder="e.g., English, Français, Español"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="locale-default"
                          checked={localeForm.is_default}
                          onCheckedChange={(checked: boolean) => setLocaleForm({ ...localeForm, is_default: checked })}
                        />
                        <Label htmlFor="locale-default">Set as default language</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="locale-auto"
                          checked={localeForm.auto_translate}
                          onCheckedChange={(checked: boolean) => setLocaleForm({ ...localeForm, auto_translate: checked })}
                        />
                        <Label htmlFor="locale-auto">Enable auto-translation</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => {
                        setLocaleDialogOpen(false);
                        setEditingLocale(null);
                      }}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateLocale} disabled={saving || !localeForm.code || !localeForm.name}>
                        {saving ? 'Saving...' : (editingLocale ? 'Update' : 'Add Language')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {locales.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-4">No languages configured yet</p>
                  <Button onClick={() => setLocaleDialogOpen(true)}>Add Your First Language</Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {locales.map((locale) => (
                    <div
                      key={locale.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{locale.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {locale.code}
                            {locale.native_name && ` • ${locale.native_name}`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {locale.is_default && <Badge>Default</Badge>}
                          {!locale.is_enabled && <Badge variant="secondary">Inactive</Badge>}
                          {locale.auto_translate && <Badge variant="outline">Auto-translate</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={locale.is_enabled}
                          onCheckedChange={() => handleToggleLocale(locale)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditLocale(locale)}
                        >
                          Edit
                        </Button>
                        {!locale.is_default && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetDefaultLocale(locale)}
                            >
                              Set Default
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteLocaleDialog(locale.id, locale.name)}
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Translations Tab */}
        <TabsContent value="translations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Translation Statistics</CardTitle>
              <CardDescription>Overview of your multi-language content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Locales</p>
                  <p className="text-3xl font-bold">{locales.length}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Enabled</p>
                  <p className="text-3xl font-bold">{locales.filter((l) => l.is_enabled).length}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Auto-Translate</p>
                  <p className="text-3xl font-bold">{locales.filter((l) => l.auto_translate).length}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Default Locale</p>
                  <p className="text-xl font-bold">{locales.find((l) => l.is_default)?.name || 'None'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Translation Guidelines</CardTitle>
              <CardDescription>Best practices for managing translations</CardDescription>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <ul className="space-y-2">
                <li>Enable <strong>Auto-translate</strong> on locales to automatically translate content using machine translation.</li>
                <li>Set a <strong>Default locale</strong> - this is the fallback language when translations are missing.</li>
                <li>Disable unused locales instead of deleting them to preserve translations.</li>
                <li>Manage individual content translations from the <strong>Content</strong> page.</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>Manage API keys for programmatic access</CardDescription>
                </div>
                <Button onClick={() => setShowCreateKeyDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate New Key
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {apiKeys.length === 0 ? (
                <div className="text-center py-8">
                  <Key className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No API keys yet</p>
                  <Button onClick={() => setShowCreateKeyDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Generate Your First Key
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {apiKeys.map((key) => (
                    <div
                      key={key.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{key.name}</h3>
                          {key.is_active && !isExpired(key.expires_at) ? (
                            <Badge className="bg-green-500">Active</Badge>
                          ) : (
                            <Badge variant="destructive">
                              {isExpired(key.expires_at) ? 'Expired' : 'Inactive'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground font-mono mb-2">
                          {key.key_prefix}••••••••••••••••••••
                        </p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {key.scopes.slice(0, 3).map((scope) => (
                            <Badge key={scope} variant="secondary" className="text-xs">
                              {scope}
                            </Badge>
                          ))}
                          {key.scopes.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{key.scopes.length - 3} more
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>Created: {formatDate(key.created_at)}</p>
                          {key.expires_at && (
                            <p className={isExpired(key.expires_at) ? 'text-red-500' : ''}>
                              Expires: {formatDate(key.expires_at)}
                            </p>
                          )}
                          {key.last_used_at && <p>Last used: {formatDate(key.last_used_at)}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(key)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => confirmDeleteKey(key.id, key.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create API Key Dialog */}
      <Dialog open={showCreateKeyDialog} onOpenChange={setShowCreateKeyDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate New API Key</DialogTitle>
            <DialogDescription>
              Create a new API key with specific permissions. You'll only see the key once.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="key-name">Key Name</Label>
              <Input
                id="key-name"
                value={createKeyForm.name}
                onChange={(e) => setCreateKeyForm({ ...createKeyForm, name: e.target.value })}
                placeholder="e.g., Production API, Mobile App, Webhook Integration"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expires-at">Expiration Date (Optional)</Label>
              <Input
                id="expires-at"
                type="datetime-local"
                value={createKeyForm.expires_at}
                onChange={(e) => setCreateKeyForm({ ...createKeyForm, expires_at: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Leave empty for no expiration</p>
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="border rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto">
                {AVAILABLE_SCOPES.map((scope) => (
                  <div key={scope.value} className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id={`scope-${scope.value}`}
                      checked={createKeyForm.scopes.includes(scope.value)}
                      onChange={() => toggleScope(scope.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor={`scope-${scope.value}`} className="font-medium">
                        {scope.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{scope.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateKeyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateKey} disabled={creatingKey}>
              {creatingKey ? 'Generating...' : 'Generate Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show Secret Dialog */}
      <Dialog open={showSecretDialog} onOpenChange={setShowSecretDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Generated!</DialogTitle>
            <DialogDescription>
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              Copy this key now. You won't be able to see it again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-mono break-all">{generatedKey?.key}</p>
            </div>
            <Button onClick={handleCopyKey} className="w-full">
              <Copy className="w-4 h-4 mr-2" />
              {copiedKey ? 'Copied!' : 'Copy to Clipboard'}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSecretDialog(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit API Key Dialog */}
      <Dialog open={showEditKeyDialog} onOpenChange={setShowEditKeyDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit API Key</DialogTitle>
            <DialogDescription>
              Update the name, permissions, or active status of this API key.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-key-name">Key Name</Label>
              <Input
                id="edit-key-name"
                value={editKeyForm.name}
                onChange={(e) => setEditKeyForm({ ...editKeyForm, name: e.target.value })}
                placeholder="e.g., Production API, Mobile App"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-key-active"
                checked={editKeyForm.is_active}
                onCheckedChange={(checked: boolean) => setEditKeyForm({ ...editKeyForm, is_active: checked })}
              />
              <Label htmlFor="edit-key-active">Active</Label>
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="border rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto">
                {AVAILABLE_SCOPES.map((scope) => (
                  <div key={scope.value} className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id={`edit-scope-${scope.value}`}
                      checked={editKeyForm.scopes.includes(scope.value)}
                      onChange={() => toggleEditScope(scope.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor={`edit-scope-${scope.value}`} className="font-medium">
                        {scope.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{scope.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditKeyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateKey} disabled={updatingKey}>
              {updatingKey ? 'Updating...' : 'Update Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Key Dialog */}
      <Dialog open={showDeleteKeyDialog} onOpenChange={setShowDeleteKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{keyToDelete?.name}"? This action cannot be undone and will immediately revoke access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteKeyDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteKey}>
              Delete Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Locale Confirmation Dialog */}
      <Dialog open={deleteLocaleDialogOpen} onOpenChange={setDeleteLocaleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Locale</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the locale &quot;{localeToDelete?.name}&quot;? 
              All translations will remain in the database but will not be accessible. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteLocaleDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteLocale}>
              Delete Locale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
