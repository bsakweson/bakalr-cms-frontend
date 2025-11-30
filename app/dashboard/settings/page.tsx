'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and security</p>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <div className="space-y-2">
                <Label htmlFor="preferences">Preferences (JSON)</Label>
                <Textarea
                  id="preferences"
                  value={profileForm.preferences}
                  onChange={(e) => setProfileForm({ ...profileForm, preferences: e.target.value })}
                  placeholder='{"theme":"dark","language":"en"}'
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  Store user preferences as JSON (theme, language, notifications, etc.)
                </p>
              </div>
              <Button onClick={handleUpdateProfile} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

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

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
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
    </div>
  );
}
