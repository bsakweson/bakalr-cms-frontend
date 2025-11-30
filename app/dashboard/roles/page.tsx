'use client';

import { useState, useEffect } from 'react';
import { roleApi } from '@/lib/api';
import type { Role, Permission, CreateRoleRequest } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permission_ids: [] as number[],
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading roles...');
      const data = await roleApi.listRoles();
      console.log('✅ Roles loaded:', data);
      console.log('Roles array:', data.roles);
      console.log('Roles count:', data.roles?.length);
      setRoles(data.roles);
    } catch (error: any) {
      console.error('Failed to load roles:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async () => {
    try {
      console.log('🔄 Loading permissions...');
      const data = await roleApi.listPermissions();
      console.log('✅ Permissions loaded:', data);
      setPermissions(data.permissions);
    } catch (error: any) {
      console.error('Failed to load permissions:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    }
  };

  const handleCreateRole = async () => {
    if (!formData.name.trim()) return;

    try {
      setSubmitting(true);
      const request: CreateRoleRequest = {
        name: formData.name,
        description: formData.description || undefined,
        permission_ids: formData.permission_ids.length > 0 ? formData.permission_ids : undefined,
      };
      await roleApi.createRole(request);
      setCreateOpen(false);
      setFormData({ name: '', description: '', permission_ids: [] });
      loadRoles();
    } catch (error) {
      console.error('Failed to create role:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditRole = async () => {
    if (!editingRole) return;

    try {
      setSubmitting(true);
      await roleApi.updateRole(editingRole.id, {
        name: formData.name || undefined,
        description: formData.description || undefined,
        permission_ids: formData.permission_ids,
      });
      setEditingRole(null);
      setFormData({ name: '', description: '', permission_ids: [] });
      loadRoles();
    } catch (error) {
      console.error('Failed to update role:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!confirm('Are you sure? Users with this role will lose their permissions.')) return;

    try {
      await roleApi.deleteRole(roleId);
      loadRoles();
    } catch (error) {
      console.error('Failed to delete role:', error);
    }
  };

  const openEditDialog = async (role: Role) => {
    try {
      const details = await roleApi.getRole(role.id);
      setEditingRole(role);
      setFormData({
        name: role.name,
        description: role.description || '',
        permission_ids: details.permissions.map((p) => p.id),
      });
    } catch (error) {
      console.error('Failed to load role details:', error);
    }
  };

  const togglePermission = (permissionId: number) => {
    setFormData((prev) => ({
      ...prev,
      permission_ids: prev.permission_ids.includes(permissionId)
        ? prev.permission_ids.filter((id) => id !== permissionId)
        : [...prev.permission_ids, permissionId],
    }));
  };

  const groupedPermissions = permissions.reduce((acc, perm) => {
    const category = perm.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-muted-foreground">Loading roles...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Roles & Permissions</h1>
          <p className="text-muted-foreground">Manage user roles and access control</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>Create Role</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>Define a custom role with specific permissions</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Role Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Content Editor"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What can users with this role do?"
                  rows={3}
                />
              </div>
              <div className="space-y-3">
                <Label>Permissions</Label>
                {Object.entries(groupedPermissions).map(([category, perms]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="font-medium text-sm">{category}</h4>
                    <div className="grid grid-cols-2 gap-2 pl-4">
                      {perms.map((perm) => (
                        <div key={perm.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`perm-${perm.id}`}
                            checked={formData.permission_ids.includes(perm.id)}
                            onCheckedChange={() => togglePermission(perm.id)}
                          />
                          <label
                            htmlFor={`perm-${perm.id}`}
                            className="text-sm cursor-pointer"
                            title={perm.description}
                          >
                            {perm.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleCreateRole} disabled={submitting || !formData.name.trim()}>
                {submitting ? 'Creating...' : 'Create Role'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {roles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No roles yet. Create your first role to get started.</p>
            <Button onClick={() => setCreateOpen(true)}>Create First Role</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <Card key={role.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {role.name}
                      {role.is_system_role && (
                        <Badge variant="secondary" className="text-xs">
                          System
                        </Badge>
                      )}
                    </CardTitle>
                    {role.description && (
                      <CardDescription className="text-sm">{role.description}</CardDescription>
                    )}
                  </div>
                  {!role.is_system_role && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          ⋮
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(role)}>
                          Edit Role
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteRole(role.id)}
                          className="text-destructive"
                        >
                          Delete Role
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Users:</span>
                    <span className="font-medium">{role.user_count || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Permissions:</span>
                    <span className="font-medium">{role.permissions?.length || 0}</span>
                  </div>
                  {role.permissions && role.permissions.length > 0 && (
                    <div className="pt-2">
                      <p className="text-muted-foreground mb-1">Includes:</p>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 3).map((perm) => (
                          <Badge key={perm} variant="outline" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                        {role.permissions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{role.permissions.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editingRole} onOpenChange={(open) => !open && setEditingRole(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>Update role details and permissions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Role Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-3">
              <Label>Permissions</Label>
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <div key={category} className="space-y-2">
                  <h4 className="font-medium text-sm">{category}</h4>
                  <div className="grid grid-cols-2 gap-2 pl-4">
                    {perms.map((perm) => (
                      <div key={perm.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-perm-${perm.id}`}
                          checked={formData.permission_ids.includes(perm.id)}
                          onCheckedChange={() => togglePermission(perm.id)}
                        />
                        <label
                          htmlFor={`edit-perm-${perm.id}`}
                          className="text-sm cursor-pointer"
                          title={perm.description}
                        >
                          {perm.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRole(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleEditRole} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
