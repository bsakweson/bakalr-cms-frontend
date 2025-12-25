'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/boutique-admin/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  getStoreSettings, 
  updateStoreSettings, 
  getPaymentMethods,
  getShippingMethods,
  getNotificationSettings,
  updateNotificationSettings,
  type StoreSettings,
  type PaymentMethod,
  type ShippingMethod,
  type NotificationSettings,
} from '@/lib/api/platform';
import { useAccessToken } from '@/hooks/use-access-token';

export default function SettingsPage() {
  const token = useAccessToken();
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Settings state
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);

  const fetchData = useCallback(async () => {
    // Wait for token to be available (null = loading, undefined = no token)
    if (token === null) return;
    
    setLoading(true);
    setError(null);
    try {
      const [storeData, paymentsData, shippingData, notificationsData] = await Promise.all([
        getStoreSettings(token || undefined),
        getPaymentMethods(token || undefined),
        getShippingMethods(token || undefined),
        getNotificationSettings(token || undefined),
      ]);
      setSettings(storeData);
      setPaymentMethods(paymentsData);
      setShippingMethods(shippingData);
      setNotificationSettings(notificationsData);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      setError('Failed to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await updateStoreSettings(settings, token || undefined);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationSave = async () => {
    if (!notificationSettings) return;
    setSaving(true);
    try {
      await updateNotificationSettings(notificationSettings, token || undefined);
    } catch (err) {
      console.error('Failed to save notification settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => {
    setSettings(prev => prev ? { ...prev, [key]: value } : null);
  };

  const updateNotificationSetting = <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => {
    setNotificationSettings(prev => prev ? { ...prev, [key]: value } : null);
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader
          icon={
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          title="Settings"
          description="Configure your store settings"
        />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <PageHeader
          icon={
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          title="Settings"
          description="Configure your store settings"
        />
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchData} className="mt-2">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        icon={
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
        title="Settings"
        description="Configure your store settings"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="store">Store</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <div className="border border-border rounded-lg p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Store Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input 
                    id="storeName" 
                    value={settings?.storeName || ''} 
                    onChange={(e) => updateSetting('storeName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeEmail">Store Email</Label>
                  <Input 
                    id="storeEmail" 
                    type="email" 
                    value={settings?.storeEmail || ''} 
                    onChange={(e) => updateSetting('storeEmail', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    value={settings?.storePhone || ''} 
                    onChange={(e) => updateSetting('storePhone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input 
                    id="address" 
                    value={settings?.storeAddress || ''} 
                    onChange={(e) => updateSetting('storeAddress', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-semibold mb-4">Regional Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <select 
                    id="currency" 
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                    value={settings?.currency || 'USD'}
                    onChange={(e) => updateSetting('currency', e.target.value)}
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select 
                    id="timezone" 
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                    value={settings?.timezone || 'America/New_York'}
                    onChange={(e) => updateSetting('timezone', e.target.value)}
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Default Language</Label>
                  <select 
                    id="language" 
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                    value={settings?.defaultLanguage || 'en'}
                    onChange={(e) => updateSetting('defaultLanguage', e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="store" className="mt-6">
          <div className="border border-border rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold">Store Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium">Enable guest checkout</p>
                  <p className="text-sm text-muted-foreground">Allow customers to checkout without creating an account</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings?.enableGuestCheckout ?? true} 
                  onChange={(e) => updateSetting('enableGuestCheckout', e.target.checked)}
                  className="w-5 h-5 rounded" 
                />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium">Show out of stock products</p>
                  <p className="text-sm text-muted-foreground">Display products that are currently out of stock</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings?.showOutOfStock ?? true} 
                  onChange={(e) => updateSetting('showOutOfStock', e.target.checked)}
                  className="w-5 h-5 rounded" 
                />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium">Enable product reviews</p>
                  <p className="text-sm text-muted-foreground">Allow customers to leave product reviews</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings?.enableReviews ?? true} 
                  onChange={(e) => updateSetting('enableReviews', e.target.checked)}
                  className="w-5 h-5 rounded" 
                />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium">Enable wishlist</p>
                  <p className="text-sm text-muted-foreground">Allow customers to save products to a wishlist</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings?.enableWishlist ?? true} 
                  onChange={(e) => updateSetting('enableWishlist', e.target.checked)}
                  className="w-5 h-5 rounded" 
                />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium">Default Page Size</p>
                  <p className="text-sm text-muted-foreground">Number of items to display per page in lists (10-100)</p>
                </div>
                <Input 
                  type="number"
                  min={10}
                  max={100}
                  value={settings?.defaultPageSize ?? 50} 
                  onChange={(e) => updateSetting('defaultPageSize', Math.min(100, Math.max(10, parseInt(e.target.value) || 50)))}
                  className="w-24 text-center" 
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <div className="border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Payment Methods</h3>
            <p className="text-muted-foreground mb-6">Configure your payment providers</p>
            
            <div className="space-y-4">
              {paymentMethods.length > 0 ? (
                paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                        <span className="text-lg">💳</span>
                      </div>
                      <div>
                        <span className="font-medium">{method.name}</span>
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                          method.enabled 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {method.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                ))
              ) : (
                ['Stripe', 'PayPal', 'Cash on Delivery', 'Bank Transfer'].map((method) => (
                  <div key={method} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                        <span className="text-lg">💳</span>
                      </div>
                      <span className="font-medium">{method}</span>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="shipping" className="mt-6">
          <div className="border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Shipping Settings</h3>
            <p className="text-muted-foreground mb-6">Configure shipping zones and rates</p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Free Shipping Threshold</Label>
                  <Input 
                    type="number" 
                    value={settings?.freeShippingThreshold ?? 50} 
                    onChange={(e) => updateSetting('freeShippingThreshold', parseFloat(e.target.value))}
                    placeholder="$50" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Default Shipping Rate</Label>
                  <Input 
                    type="number" 
                    value={settings?.defaultShippingRate ?? 5.99} 
                    onChange={(e) => updateSetting('defaultShippingRate', parseFloat(e.target.value))}
                    placeholder="$5.99" 
                  />
                </div>
              </div>
              
              {shippingMethods.length > 0 && (
                <div className="pt-4 space-y-2">
                  <Label>Active Shipping Methods</Label>
                  {shippingMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <span className="font-medium">{method.name}</span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          ${method.rate.toFixed(2)} • {method.estimatedDays} days
                        </span>
                      </div>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="pt-4">
                <Button variant="outline">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Shipping Zone
                </Button>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <div className="border border-border rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold">Notification Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium">New order notifications</p>
                  <p className="text-sm text-muted-foreground">Get notified when a new order is placed</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={notificationSettings?.orderNotifications ?? true} 
                  onChange={(e) => updateNotificationSetting('orderNotifications', e.target.checked)}
                  className="w-5 h-5 rounded" 
                />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium">Low stock alerts</p>
                  <p className="text-sm text-muted-foreground">Get notified when inventory is running low</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={notificationSettings?.lowStockAlerts ?? true} 
                  onChange={(e) => updateNotificationSetting('lowStockAlerts', e.target.checked)}
                  className="w-5 h-5 rounded" 
                />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium">Customer registration</p>
                  <p className="text-sm text-muted-foreground">Get notified when a new customer registers</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={notificationSettings?.customerRegistration ?? true} 
                  onChange={(e) => updateNotificationSetting('customerRegistration', e.target.checked)}
                  className="w-5 h-5 rounded" 
                />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium">Order status updates</p>
                  <p className="text-sm text-muted-foreground">Send customers email updates about their orders</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={notificationSettings?.orderStatusEmails ?? true} 
                  onChange={(e) => updateNotificationSetting('orderStatusEmails', e.target.checked)}
                  className="w-5 h-5 rounded" 
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleNotificationSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="mt-6">
          <div className="border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Integrations</h3>
            <p className="text-muted-foreground mb-6">Connect third-party services to your store</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'CMS API', description: 'Connected to Bakalr CMS', status: 'connected' },
                { name: 'Platform API', description: 'Boutique Platform services', status: 'connected' },
                { name: 'Email Service', description: 'Transactional emails', status: 'not_connected' },
                { name: 'Analytics', description: 'Google Analytics', status: 'not_connected' },
              ].map((integration) => (
                <div key={integration.name} className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{integration.name}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      integration.status === 'connected' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {integration.status === 'connected' ? 'Connected' : 'Not Connected'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{integration.description}</p>
                  <Button variant="outline" size="sm">
                    {integration.status === 'connected' ? 'Configure' : 'Connect'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
