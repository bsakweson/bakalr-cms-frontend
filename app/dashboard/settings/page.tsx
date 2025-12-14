'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { usePreferences } from '@/contexts/preferences-context';
import { authApi, deviceApi, sessionApi } from '@/lib/api';
import type { Device, DeviceListResponse } from '@/lib/api/devices';
import type { Session, SessionListResponse, LoginActivity, LoginActivityListResponse, SecurityOverview } from '@/lib/api/sessions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  Smartphone, 
  Monitor, 
  Tablet, 
  Globe, 
  Shield, 
  ShieldCheck, 
  ShieldAlert,
  MapPin, 
  Clock, 
  Trash2, 
  RefreshCw,
  LogOut,
  AlertTriangle,
  Check,
  X,
  Fingerprint,
  LayoutGrid,
  Settings2,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Palette
} from 'lucide-react';

interface TwoFactorStatus {
  enabled: boolean;
  verified: boolean;
  backup_codes_remaining: number;
  required: boolean;
}

interface TwoFactorSetup {
  secret: string;
  qr_code: string;
  backup_codes: string[];
  message?: string;
}

// Helper functions for device display
const getDeviceIcon = (device: Device | Session) => {
  const type = device.device_type;
  const isMobile = 'is_mobile' in device ? device.is_mobile : false;
  if (type === 'mobile' || isMobile) {
    return <Smartphone className="h-5 w-5" />;
  }
  if (type === 'tablet') {
    return <Tablet className="h-5 w-5" />;
  }
  return <Monitor className="h-5 w-5" />;
};

const getStatusBadge = (status: string, verified?: boolean) => {
  if (status === 'active' && verified) {
    return <Badge variant="default" className="bg-green-600">Active & Verified</Badge>;
  }
  if (status === 'active') {
    return <Badge variant="default">Active</Badge>;
  }
  if (status === 'suspended') {
    return <Badge variant="destructive">Suspended</Badge>;
  }
  if (status === 'revoked') {
    return <Badge variant="outline">Revoked</Badge>;
  }
  return <Badge variant="secondary">{status}</Badge>;
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
};

// Display Settings Component
function DisplaySettings() {
  const { preferences, updatePreference, updatePreferences, generatedTheme } = usePreferences();
  const pageSizeOptions = [6, 8, 12, 16, 20, 24];
  const presetColors = [
    { name: 'Bakalr Brown', color: '#8b4513' },
    { name: 'Ocean Blue', color: '#2563eb' },
    { name: 'Forest Green', color: '#16a34a' },
    { name: 'Royal Purple', color: '#7c3aed' },
    { name: 'Sunset Orange', color: '#ea580c' },
    { name: 'Rose Pink', color: '#e11d48' },
    { name: 'Teal', color: '#0d9488' },
    { name: 'Indigo', color: '#4f46e5' },
    { name: 'Amber', color: '#d97706' },
    { name: 'Slate', color: '#475569' },
  ];

  return (
    <TabsContent value="display" className="space-y-6">
      {/* Theme Section Header */}
      <div className="flex items-center gap-2 pb-2 border-b">
        <Palette className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Theme & Appearance</h3>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Theme Mode Card */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: preferences.primaryColor }} />
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${preferences.primaryColor}20` }}>
                {preferences.theme === 'dark' ? (
                  <Moon className="h-5 w-5" style={{ color: preferences.primaryColor }} />
                ) : preferences.theme === 'light' ? (
                  <Sun className="h-5 w-5" style={{ color: preferences.primaryColor }} />
                ) : (
                  <Monitor className="h-5 w-5" style={{ color: preferences.primaryColor }} />
                )}
              </div>
              <div>
                <CardTitle className="text-lg">Theme Mode</CardTitle>
                <CardDescription>Light, dark, or system</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {(['light', 'dark', 'system'] as const).map((mode) => (
                <Button
                  key={mode}
                  variant={preferences.theme === mode ? "default" : "outline"}
                  size="sm"
                  onClick={() => updatePreference('theme', mode)}
                  className="w-full capitalize"
                >
                  {mode === 'light' && <Sun className="h-3 w-3 mr-1" />}
                  {mode === 'dark' && <Moon className="h-3 w-3 mr-1" />}
                  {mode === 'system' && <Monitor className="h-3 w-3 mr-1" />}
                  {mode}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Theme Creator Card */}
        <Card className="relative overflow-hidden md:col-span-2">
          <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: preferences.primaryColor }} />
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${preferences.primaryColor}20` }}>
                <Palette className="h-5 w-5" style={{ color: preferences.primaryColor }} />
              </div>
              <div>
                <CardTitle className="text-lg">Theme Creator</CardTitle>
                <CardDescription>Pick a primary color to generate your theme</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Custom Color Picker */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="custom-color">Custom Color:</Label>
                <div className="relative">
                  <input
                    type="color"
                    id="custom-color"
                    value={preferences.primaryColor}
                    onChange={(e) => updatePreference('primaryColor', e.target.value)}
                    className="w-12 h-10 rounded-lg cursor-pointer border-2 border-border"
                  />
                </div>
                <Input
                  value={preferences.primaryColor}
                  onChange={(e) => {
                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                      updatePreference('primaryColor', e.target.value);
                    }
                  }}
                  className="w-28 font-mono text-sm"
                  placeholder="#8b4513"
                />
              </div>
            </div>

            {/* Preset Colors */}
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">Preset Themes:</Label>
              <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                {presetColors.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => updatePreference('primaryColor', preset.color)}
                    className={`group relative w-full aspect-square rounded-lg transition-all ${
                      preferences.primaryColor === preset.color 
                        ? 'ring-2 ring-offset-2 ring-primary scale-110' 
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: preset.color }}
                    title={preset.name}
                  >
                    {preferences.primaryColor === preset.color && (
                      <Check className="h-4 w-4 text-white absolute inset-0 m-auto drop-shadow-md" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Generated Theme Preview */}
            {generatedTheme && (
              <div className="mt-4 p-4 rounded-lg border bg-muted/30">
                <Label className="text-sm text-muted-foreground mb-3 block">Generated Theme Preview:</Label>
                <div className="grid grid-cols-6 gap-2">
                  <div className="space-y-1">
                    <div 
                      className="w-full h-8 rounded-md border"
                      style={{ backgroundColor: generatedTheme.light.primary }}
                      title="Primary"
                    />
                    <p className="text-[10px] text-center text-muted-foreground">Primary</p>
                  </div>
                  <div className="space-y-1">
                    <div 
                      className="w-full h-8 rounded-md border"
                      style={{ backgroundColor: generatedTheme.light.secondary }}
                      title="Secondary"
                    />
                    <p className="text-[10px] text-center text-muted-foreground">Secondary</p>
                  </div>
                  <div className="space-y-1">
                    <div 
                      className="w-full h-8 rounded-md border"
                      style={{ backgroundColor: generatedTheme.light.accent }}
                      title="Accent"
                    />
                    <p className="text-[10px] text-center text-muted-foreground">Accent</p>
                  </div>
                  <div className="space-y-1">
                    <div 
                      className="w-full h-8 rounded-md border"
                      style={{ backgroundColor: generatedTheme.light.muted }}
                      title="Muted"
                    />
                    <p className="text-[10px] text-center text-muted-foreground">Muted</p>
                  </div>
                  <div className="space-y-1">
                    <div 
                      className="w-full h-8 rounded-md border"
                      style={{ backgroundColor: generatedTheme.light.border }}
                      title="Border"
                    />
                    <p className="text-[10px] text-center text-muted-foreground">Border</p>
                  </div>
                  <div className="space-y-1">
                    <div 
                      className="w-full h-8 rounded-md border"
                      style={{ backgroundColor: generatedTheme.light.sidebar }}
                      title="Sidebar"
                    />
                    <p className="text-[10px] text-center text-muted-foreground">Sidebar</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Layout Section Header */}
      <div className="flex items-center gap-2 pb-2 border-b mt-8">
        <LayoutGrid className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Layout & Display</h3>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Pagination Card */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <LayoutGrid className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Items Per Page</CardTitle>
                <CardDescription>Content list pagination</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {pageSizeOptions.map((size) => (
                <Button
                  key={size}
                  variant={preferences.pageSize === size ? "default" : "outline"}
                  size="sm"
                  onClick={() => updatePreference('pageSize', size)}
                  className="w-full"
                >
                  {size}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Currently showing {preferences.pageSize} items per page
            </p>
          </CardContent>
        </Card>

        {/* Compact View Card */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Settings2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Compact View</CardTitle>
                <CardDescription>Reduce card spacing</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="compact-view">Enable compact mode</Label>
                <p className="text-xs text-muted-foreground">
                  Display more content in less space
                </p>
              </div>
              <Switch
                id="compact-view"
                checked={preferences.compactView}
                onCheckedChange={(checked) => updatePreference('compactView', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Show Descriptions Card */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                {preferences.showDescriptions ? (
                  <Eye className="h-5 w-5 text-primary" />
                ) : (
                  <EyeOff className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg">Descriptions</CardTitle>
                <CardDescription>Show content descriptions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-descriptions">Show descriptions</Label>
                <p className="text-xs text-muted-foreground">
                  Display subtitles on content cards
                </p>
              </div>
              <Switch
                id="show-descriptions"
                checked={preferences.showDescriptions}
                onCheckedChange={(checked) => updatePreference('showDescriptions', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reset Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Reset Preferences</CardTitle>
          <CardDescription>Restore all display settings to their default values</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="outline" 
            onClick={() => updatePreferences({
              pageSize: 12,
              theme: 'system',
              primaryColor: '#8b4513',
              compactView: false,
              showDescriptions: true,
            })}
          >
            Reset to Defaults
          </Button>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile state
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    bio: '',
    preferences: '',
    avatar_url: '',
  });

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // 2FA state
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus | null>(null);
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetup | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');

  // Device state
  const [devices, setDevices] = useState<Device[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [deviceToRemove, setDeviceToRemove] = useState<Device | null>(null);

  // Session state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionToRevoke, setSessionToRevoke] = useState<Session | null>(null);

  // Login activity state
  const [loginActivity, setLoginActivity] = useState<LoginActivity[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  // Security overview state
  const [securityOverview, setSecurityOverview] = useState<SecurityOverview | null>(null);

  useEffect(() => {
    if (user) {
      setProfileForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        username: user.username || '',
        bio: user.bio || '',
        preferences: user.preferences || '',
        avatar_url: user.avatar_url || '',
      });
      loadTwoFactorStatus();
      loadDevices();
      loadSessions();
      loadLoginActivity();
      loadSecurityOverview();
    }
  }, [user]);

  const loadTwoFactorStatus = async () => {
    try {
      const data = await authApi.get2FAStatus();
      setTwoFactorStatus(data);
    } catch (error) {
      console.error('Failed to load 2FA status:', error);
    }
  };

  const loadDevices = async () => {
    try {
      setDevicesLoading(true);
      const data = await deviceApi.listDevices();
      setDevices(data.devices);
    } catch (error) {
      console.error('Failed to load devices:', error);
    } finally {
      setDevicesLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      setSessionsLoading(true);
      const data = await sessionApi.listSessions();
      setSessions(data.sessions);
      setCurrentSessionId(data.current_session_id);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setSessionsLoading(false);
    }
  };

  const loadLoginActivity = async () => {
    try {
      setActivityLoading(true);
      const data = await sessionApi.getLoginActivity({ per_page: 20 });
      setLoginActivity(data.activities);
    } catch (error) {
      console.error('Failed to load login activity:', error);
    } finally {
      setActivityLoading(false);
    }
  };

  const loadSecurityOverview = async () => {
    try {
      const data = await sessionApi.getSecurityOverview();
      setSecurityOverview(data);
    } catch (error) {
      console.error('Failed to load security overview:', error);
    }
  };

  const handleUpdateProfile = async () => {
    setMessage(null);
    setLoading(true);
    try {
      await authApi.updateProfile(profileForm);
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setMessage(null);
    setLoading(true);
    try {
      const response = await authApi.changePassword(
        passwordForm.current_password,
        passwordForm.new_password
      );
      setMessage({ type: 'success', text: response.message });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    setMessage(null);
    setLoading(true);
    try {
      const data = await authApi.enable2FA();
      setTwoFactorSetup(data);
      setSetupDialogOpen(true);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to enable 2FA' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!verifyCode) return;

    setMessage(null);
    setLoading(true);
    try {
      await authApi.verifySetup2FA(verifyCode);
      setMessage({ type: 'success', text: '2FA enabled successfully' });
      setSetupDialogOpen(false);
      setTwoFactorSetup(null);
      setVerifyCode('');
      loadTwoFactorStatus();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Invalid verification code' });
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!disablePassword) return;

    setMessage(null);
    setLoading(true);
    try {
      await authApi.disable2FA(disablePassword);
      setMessage({ type: 'success', text: '2FA disabled successfully' });
      setDisablePassword('');
      loadTwoFactorStatus();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to disable 2FA' });
    } finally {
      setLoading(false);
    }
  };

  const handleTrustDevice = async (device: Device) => {
    try {
      await deviceApi.setTrust({ device_id: device.device_id, trust: !device.is_trusted });
      setMessage({ type: 'success', text: device.is_trusted ? 'Device untrusted' : 'Device trusted' });
      loadDevices();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to update device trust' });
    }
  };

  const handleRemoveDevice = async () => {
    if (!deviceToRemove) return;

    try {
      await deviceApi.revokeDevice(deviceToRemove.device_id);
      setMessage({ type: 'success', text: 'Device removed successfully' });
      setDeviceToRemove(null);
      loadDevices();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to remove device' });
    }
  };

  const handleRevokeSession = async () => {
    if (!sessionToRevoke) return;

    try {
      await sessionApi.revokeSession(sessionToRevoke.id);
      setMessage({ type: 'success', text: 'Session revoked successfully' });
      setSessionToRevoke(null);
      loadSessions();
      loadLoginActivity();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to revoke session' });
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    try {
      const result = await sessionApi.revokeAllOtherSessions();
      setMessage({ type: 'success', text: `Revoked ${result.revoked_count} sessions` });
      loadSessions();
      loadLoginActivity();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to revoke sessions' });
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences, security, and connected devices</p>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="display" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="display">Display</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>

        {/* Display Tab */}
        <DisplaySettings />

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={profileForm.first_name}
                    onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={profileForm.last_name}
                    onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={profileForm.username}
                  onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                  placeholder="Optional username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatar_url">Avatar URL</Label>
                <Input
                  id="avatar_url"
                  type="url"
                  value={profileForm.avatar_url}
                  onChange={(e) => setProfileForm({ ...profileForm, avatar_url: e.target.value })}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  maxLength={500}
                />
                <p className="text-sm text-muted-foreground">
                  {profileForm.bio.length}/500 characters
                </p>
              </div>
              <Button onClick={handleUpdateProfile} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Password Tab */}
        <TabsContent value="password" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">Current Password</Label>
                <Input
                  id="current_password"
                  type="password"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_password">New Password</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm New Password</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                />
              </div>
              <Button onClick={handleChangePassword} disabled={loading}>
                {loading ? 'Changing...' : 'Change Password'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab (2FA) */}
        <TabsContent value="security" className="space-y-4">
          {/* Security Overview Card */}
          {securityOverview && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Overview
                </CardTitle>
                <CardDescription>Summary of your account security status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-2xl font-bold">{securityOverview.active_sessions}</p>
                    <p className="text-sm text-muted-foreground">Active Sessions</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-2xl font-bold">{securityOverview.devices_count}</p>
                    <p className="text-sm text-muted-foreground">Registered Devices</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-2xl font-bold">{securityOverview.trusted_devices_count}</p>
                    <p className="text-sm text-muted-foreground">Trusted Devices</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    {securityOverview.mfa_enabled ? (
                      <ShieldCheck className="h-8 w-8 text-green-600 mx-auto" />
                    ) : (
                      <ShieldAlert className="h-8 w-8 text-yellow-600 mx-auto" />
                    )}
                    <p className="text-sm text-muted-foreground">
                      2FA {securityOverview.mfa_enabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>
                {securityOverview.suspicious_sessions > 0 && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {securityOverview.suspicious_sessions} suspicious session(s) detected. Review your sessions below.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* 2FA Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {twoFactorStatus && (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">2FA Status</p>
                    <p className="text-sm text-muted-foreground">
                      {twoFactorStatus.enabled ? 'Enabled' : 'Disabled'}
                    </p>
                    {twoFactorStatus.enabled && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Backup codes remaining: {twoFactorStatus.backup_codes_remaining}
                      </p>
                    )}
                  </div>
                  <Badge variant={twoFactorStatus.enabled ? 'default' : 'secondary'}>
                    {twoFactorStatus.enabled ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              )}

              {!twoFactorStatus?.enabled ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Protect your account with two-factor authentication using an authenticator app
                  </p>
                  <Button onClick={handleEnable2FA} disabled={loading}>
                    {loading ? 'Setting up...' : 'Enable 2FA'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="disable_password">Enter password to disable 2FA</Label>
                    <Input
                      id="disable_password"
                      type="password"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      placeholder="Your password"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleDisable2FA}
                    disabled={loading || !disablePassword}
                  >
                    {loading ? 'Disabling...' : 'Disable 2FA'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Login Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Login Activity</CardTitle>
              <CardDescription>Your recent sign-in history</CardDescription>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading activity...</div>
              ) : loginActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No login activity found</div>
              ) : (
                <div className="space-y-2">
                  {loginActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{activity.device_display}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {activity.location_display}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{formatRelativeTime(activity.created_at)}</p>
                        {activity.is_suspicious && (
                          <Badge variant="destructive" className="text-xs">Suspicious</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Registered Devices
              </CardTitle>
              <CardDescription>Manage devices that have accessed your account</CardDescription>
            </CardHeader>
            <CardContent>
              {devicesLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading devices...</div>
              ) : devices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No devices registered</div>
              ) : (
                <div className="space-y-4">
                  {devices.map((device) => (
                    <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {getDeviceIcon(device)}
                        <div>
                          <p className="font-medium">{device.display_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {device.os} {device.os_version} • {device.browser} {device.browser_version}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            Last used: {formatRelativeTime(device.last_used_at || device.created_at)}
                            {device.last_location && (
                              <>
                                <span className="mx-1">•</span>
                                <MapPin className="h-3 w-3" />
                                {device.last_location}
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(device.status, device.verified)}
                        {device.is_trusted && (
                          <Badge variant="outline" className="bg-blue-50">
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            Trusted
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTrustDevice(device)}
                          title={device.is_trusted ? 'Remove trust' : 'Trust device'}
                        >
                          {device.is_trusted ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeviceToRemove(device)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Active Sessions
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRevokeAllOtherSessions}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out all other sessions
                </Button>
              </CardTitle>
              <CardDescription>Sessions currently signed in to your account</CardDescription>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading sessions...</div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No active sessions</div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`flex items-center justify-between p-4 border rounded-lg ${
                        session.is_current ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''
                      } ${session.is_suspicious ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        {getDeviceIcon(session)}
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {session.device_display}
                            {session.is_current && (
                              <Badge variant="default" className="bg-green-600">Current</Badge>
                            )}
                            {session.is_suspicious && (
                              <Badge variant="destructive">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Suspicious
                              </Badge>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {session.location_display}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            IP: {session.ip_address} • Last active: {formatRelativeTime(session.last_active_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {session.mfa_verified && (
                          <Badge variant="outline">
                            <Fingerprint className="h-3 w-3 mr-1" />
                            2FA Verified
                          </Badge>
                        )}
                        {!session.is_current && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSessionToRevoke(session)}
                          >
                            <LogOut className="h-4 w-4 text-red-500" />
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
      </Tabs>

      {/* 2FA Setup Dialog */}
      <Dialog open={setupDialogOpen} onOpenChange={setSetupDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </DialogDescription>
          </DialogHeader>
          {twoFactorSetup && (
            <div className="space-y-4 py-4">
              <div className="flex justify-center">
                <img src={twoFactorSetup.qr_code} alt="QR Code" className="border rounded-lg p-2" />
              </div>
              <div className="space-y-2">
                <Label>Or enter this code manually:</Label>
                <code className="block p-2 bg-muted rounded text-sm">{twoFactorSetup.secret}</code>
              </div>
              <div className="space-y-2">
                <Label>Backup Codes (Save these in a safe place):</Label>
                <div className="p-3 bg-muted rounded space-y-1">
                  {twoFactorSetup.backup_codes.map((code, i) => (
                    <code key={i} className="block text-sm">
                      {code}
                    </code>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="verify_code">Enter verification code from your app:</Label>
                <Input
                  id="verify_code"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  placeholder="6-digit code"
                  maxLength={6}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSetupDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleVerify2FA} disabled={loading || !verifyCode || verifyCode.length !== 6}>
              {loading ? 'Verifying...' : 'Verify & Enable'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Device Dialog */}
      <Dialog open={!!deviceToRemove} onOpenChange={() => setDeviceToRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Device</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove &quot;{deviceToRemove?.display_name}&quot;? This device will need to be re-verified to access your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeviceToRemove(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveDevice}>
              Remove Device
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Session Dialog */}
      <Dialog open={!!sessionToRevoke} onOpenChange={() => setSessionToRevoke(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out this session? The user will be immediately logged out from {sessionToRevoke?.device_display}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSessionToRevoke(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRevokeSession}>
              Sign Out Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
