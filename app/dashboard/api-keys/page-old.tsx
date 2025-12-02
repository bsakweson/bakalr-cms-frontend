'use client';

import { useState, useEffect } from 'react';
import { apiKeysApi, type APIKey, type APIKeyWithSecret } from '@/lib/api/api-keys';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Key, Plus, Trash2, AlertTriangle } from 'lucide-react';

const AVAILABLE_SCOPES = [
  { value: 'read:content', label: 'Read Content', description: 'View content entries and types' },
  { value: 'write:content', label: 'Write Content', description: 'Create and update content' },
  { value: 'delete:content', label: 'Delete Content', description: 'Delete content entries' },
  { value: 'read:media', label: 'Read Media', description: 'Access media files' },
  { value: 'write:media', label: 'Upload Media', description: 'Upload media files' },
  { value: 'delete:media', label: 'Delete Media', description: 'Delete media files' },
  { value: 'read:translation', label: 'Read Translations', description: 'Access translations' },
  { value: 'read:analytics', label: 'Read Analytics', description: 'View analytics data' },
];

export default function APIKeysPage() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSecretDialog, setShowSecretDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<{ id: string; name: string } | null>(null);
  const [generatedKey, setGeneratedKey] = useState<APIKeyWithSecret | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Create form state
  const [createForm, setCreateForm] = useState({
    name: '',
    scopes: [] as string[],
    expires_at: '',
  });

  useEffect(() => {
    loadAPIKeys();
  }, []);

  const loadAPIKeys = async () => {
    try {
      setLoading(true);
      const response = await apiKeysApi.listAPIKeys();
      setApiKeys(response.items || []);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to load API keys' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!createForm.name.trim()) {
      setMessage({ type: 'error', text: 'Please enter a name for the API key' });
      return;
    }

    if (createForm.scopes.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one permission scope' });
      return;
    }

    try {
      setCreating(true);
      setMessage(null);

      const payload: any = {
        name: createForm.name,
        scopes: createForm.scopes,
      };

      if (createForm.expires_at) {
        payload.expires_at = new Date(createForm.expires_at).toISOString();
      }

      const response = await apiKeysApi.createAPIKey(payload);

      setGeneratedKey(response);
      setShowCreateDialog(false);
      setShowSecretDialog(true);
      setCreateForm({ name: '', scopes: [], expires_at: '' });
      await loadAPIKeys();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to create API key' });
    } finally {
      setCreating(false);
    }
  };

  const confirmDeleteKey = (keyId: string, keyName: string) => {
    setKeyToDelete({ id: keyId, name: keyName });
    setShowDeleteDialog(true);
  };

  const handleDeleteKey = async () => {
    if (!keyToDelete) return;

    try {
      await apiKeysApi.deleteAPIKey(keyToDelete.id);
      setMessage({ type: 'success', text: 'API key deleted successfully' });
      setShowDeleteDialog(false);
      setKeyToDelete(null);
      await loadAPIKeys();
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
    setCreateForm(prev => ({
      ...prev,
      scopes: prev.scopes.includes(scope)
        ? prev.scopes.filter(s => s !== scope)
        : [...prev.scopes, scope],
    }));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const isExpired = (dateString: string | null) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage API keys for programmatic access to your CMS content
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Generate New Key
        </Button>
      </div>

      {message && (
        <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">Loading API keys...</p>
          </CardContent>
        </Card>
      ) : apiKeys.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Key className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 mb-4">No API keys yet</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Generate Your First Key
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your API Keys</CardTitle>
            <CardDescription>Manage keys for your organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
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
                    <p className="text-sm text-gray-500 font-mono mb-2">
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
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Created: {formatDate(key.created_at)}</p>
                      {key.expires_at && (
                        <p className={isExpired(key.expires_at) ? 'text-red-500' : ''}>
                          Expires: {formatDate(key.expires_at)}
                        </p>
                      )}
                      {key.last_used_at && <p>Last used: {formatDate(key.last_used_at)}</p>}
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => confirmDeleteKey(key.id, key.name)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create API Key Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate New API Key</DialogTitle>
            <DialogDescription>
              Create a new API key for programmatic access to your CMS
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Key Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Mobile App, Marketing Website"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              />
            </div>

            <div>
              <Label>Permissions (Select at least one) *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {AVAILABLE_SCOPES.map((scope) => (
                  <div
                    key={scope.value}
                    className={`p-3 border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      createForm.scopes.includes(scope.value) ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                    onClick={() => toggleScope(scope.value)}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={createForm.scopes.includes(scope.value)}
                        onChange={() => {}}
                        className="rounded"
                      />
                      <div>
                        <p className="font-medium text-sm">{scope.label}</p>
                        <p className="text-xs text-gray-500">{scope.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="expires_at">Expires At (Optional)</Label>
              <Input
                id="expires_at"
                type="datetime-local"
                value={createForm.expires_at}
                onChange={(e) => setCreateForm({ ...createForm, expires_at: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty for keys that never expire</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateKey} disabled={creating}>
              {creating ? 'Generating...' : 'Generate Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show Generated Key Dialog */}
      <Dialog open={showSecretDialog} onOpenChange={setShowSecretDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              API Key Generated Successfully
            </DialogTitle>
            <DialogDescription>
              <strong className="text-red-500">Important:</strong> Copy this key now. You won't be able to see it again!
            </DialogDescription>
          </DialogHeader>

          {generatedKey && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Your API Key:</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={generatedKey.key}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button onClick={handleCopyKey} size="sm">
                    <Copy className="w-4 h-4" />
                    {copiedKey ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertDescription className="text-sm">
                  <p className="font-semibold mb-2">Usage:</p>
                  <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs">
                    curl -H "X-API-Key: {generatedKey.key}" \<br />
                    &nbsp;&nbsp;https://your-cms.com/api/v1/content/entries
                  </code>
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => {
              setShowSecretDialog(false);
              setGeneratedKey(null);
              setCopiedKey(false);
            }}>
              I've Copied the Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the API key "{keyToDelete?.name}"? This action cannot be undone and will immediately revoke access.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteDialog(false);
                setKeyToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteKey}>
              Delete Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
