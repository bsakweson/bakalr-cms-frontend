'use client';

import { useState, useEffect } from 'react';
import { organizationApi } from '@/lib/api';
import type { OrganizationProfile, Locale, CreateLocaleRequest, UpdateLocaleRequest } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function OrganizationSettingsPage() {
  const [profile, setProfile] = useState<OrganizationProfile | null>(null);
  const [locales, setLocales] = useState<Locale[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
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
  const [localeForm, setLocaleForm] = useState({
    code: '',
    name: '',
    is_default: false,
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileData, localesData] = await Promise.all([
        organizationApi.getProfile(),
        organizationApi.listLocales(),
      ]);
      
      setProfile(profileData);
      setProfileForm({
        name: profileData.name,
        description: profileData.description || '',
        email: profileData.email || '',
        website: profileData.website || '',
        logo_url: profileData.logo_url || '',
      });
      setLocales(localesData.locales);
    } catch (error) {
      console.error('Failed to load organization data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const updated = await organizationApi.updateProfile(profileForm);
      setProfile(updated);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateLocale = async () => {
    if (!localeForm.code || !localeForm.name) return;

    try {
      setSaving(true);
      const newLocale = await organizationApi.createLocale(localeForm);
      setLocales([...locales, newLocale]);
      setLocaleDialogOpen(false);
      setLocaleForm({ code: '', name: '', is_default: false, is_active: true });
    } catch (error) {
      console.error('Failed to create locale:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateLocale = async (locale: Locale, updates: UpdateLocaleRequest) => {
    try {
      const updated = await organizationApi.updateLocale(locale.id, updates);
      setLocales(locales.map((l) => (l.id === locale.id ? updated : l)));
    } catch (error) {
      console.error('Failed to update locale:', error);
    }
  };

  const handleDeleteLocale = async (localeId: number) => {
    if (!confirm('Are you sure you want to delete this locale? All translations will remain but will not be accessible.')) return;

    try {
      await organizationApi.deleteLocale(localeId);
      setLocales(locales.filter((l) => l.id !== localeId));
    } catch (error) {
      console.error('Failed to delete locale:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
        <p className="text-muted-foreground">Manage your organization profile and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="locales">Languages</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
        </TabsList>

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

        <TabsContent value="locales" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Languages & Locales</CardTitle>
                  <CardDescription>Manage available languages for your content</CardDescription>
                </div>
                <Dialog open={localeDialogOpen} onOpenChange={setLocaleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>Add Language</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Language</DialogTitle>
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
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="locale-default"
                          checked={localeForm.is_default}
                          onCheckedChange={(checked: boolean) => setLocaleForm({ ...localeForm, is_default: checked })}
                        />
                        <Label htmlFor="locale-default">Set as default language</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setLocaleDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateLocale} disabled={saving || !localeForm.code || !localeForm.name}>
                        {saving ? 'Adding...' : 'Add Language'}
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
                          <p className="text-sm text-muted-foreground">{locale.code}</p>
                        </div>
                        <div className="flex gap-2">
                          {locale.is_default && <Badge>Default</Badge>}
                          {!locale.is_active && <Badge variant="secondary">Inactive</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={locale.is_active}
                          onCheckedChange={(checked: boolean) =>
                            handleUpdateLocale(locale, { is_active: checked })
                          }
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleUpdateLocale(locale, { is_default: true })
                          }
                          disabled={locale.is_default}
                        >
                          Set Default
                        </Button>
                        {!locale.is_default && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLocale(locale.id)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage API keys for programmatic access</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                API key management coming soon. Visit the API Keys page in the main navigation.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
