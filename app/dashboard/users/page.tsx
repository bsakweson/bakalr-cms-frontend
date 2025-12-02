'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { userApi } from '@/lib/api';
import type { UserListItem, Role } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, MoreVertical, Mail, Shield, Trash2, Calendar, AlertCircle } from 'lucide-react';

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [userToRemove, setUserToRemove] = useState<{ id: string; name: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role_id: '',
    send_invite_email: true
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadOrganization();
    loadUsers();
    loadRoles();
  }, []);

  const loadOrganization = async () => {
    try {
      const { organizationApi } = await import('@/lib/api');
      const profile = await organizationApi.getProfile();
      setOwnerId(profile.owner_id || null);
    } catch (error) {
      console.error('Failed to load organization:', error);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userApi.listUsers();
      setUsers(data.users);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const data = await userApi.listRoles();
      setRoles(data.roles);
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteForm.email || !inviteForm.first_name || !inviteForm.last_name || !inviteForm.role_id) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);
      await userApi.inviteUser({
        email: inviteForm.email,
        first_name: inviteForm.first_name,
        last_name: inviteForm.last_name,
        role_id: inviteForm.role_id,
        send_invite_email: inviteForm.send_invite_email
      });
      
      setInviteOpen(false);
      setInviteForm({ email: '', first_name: '', last_name: '', role_id: '', send_invite_email: true });
      await loadUsers();
    } catch (error: any) {
      setErrorMessage(error.response?.data?.detail || 'Failed to invite user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (userId: string, roleId: string) => {
    try {
      setErrorMessage(null);
      await userApi.updateUserRole(userId, { role_id: roleId });
      await loadUsers();
    } catch (error: any) {
      setErrorMessage(error.response?.data?.detail || 'Failed to update user role');
    }
  };

  const openRemoveDialog = (userId: string, userName: string) => {
    setUserToRemove({ id: userId, name: userName });
    setRemoveDialogOpen(true);
  };

  const handleRemoveUser = async () => {
    if (!userToRemove) return;

    try {
      setErrorMessage(null);
      await userApi.removeUser(userToRemove.id);
      setRemoveDialogOpen(false);
      setUserToRemove(null);
      await loadUsers();
    } catch (error: any) {
      setErrorMessage(error.response?.data?.detail || 'Failed to remove user');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground mt-1">
            Manage users and their roles within your organization
          </p>
        </div>
        
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite User</DialogTitle>
              <DialogDescription>
                Send an invitation to add a new user to your organization
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  placeholder="John"
                  value={inviteForm.first_name}
                  onChange={(e) => setInviteForm({ ...inviteForm, first_name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  placeholder="Doe"
                  value={inviteForm.last_name}
                  onChange={(e) => setInviteForm({ ...inviteForm, last_name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={inviteForm.role_id}
                  onValueChange={(value) => setInviteForm({ ...inviteForm, role_id: value })}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleInviteUser} disabled={submitting}>
                {submitting ? 'Inviting...' : 'Send Invite'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Loading users...</p>
          </CardContent>
        </Card>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UserPlus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No users yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by inviting your first team member
            </p>
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite User
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {users.map((user) => {
            const displayName = user.first_name && user.last_name 
              ? `${user.first_name} ${user.last_name}`.trim()
              : user.first_name || user.last_name || user.email.split('@')[0];
            const initials = user.first_name 
              ? user.first_name.charAt(0).toUpperCase() + (user.last_name?.charAt(0).toUpperCase() || '')
              : user.email.charAt(0).toUpperCase();
            
            return (
            <Card key={user.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      {initials}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{displayName}</h3>
                        {ownerId === user.id && (
                          <Badge variant="default">Owner</Badge>
                        )}
                        {!user.is_active && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Joined {formatDate(user.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role, idx) => (
                        <Badge key={idx} variant="outline">
                          <Shield className="mr-1 h-3 w-3" />
                          {role}
                        </Badge>
                      ))}
                    </div>
                    
                    <Select
                      value={user.roles[0] || ''}
                      onValueChange={(value) => {
                        const role = roles.find(r => r.name === value);
                        if (role) {
                          handleRoleChange(user.id, role.id);
                        }
                      }}
                      disabled={ownerId === user.id}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Change role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.name}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {ownerId !== user.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => openRemoveDialog(user.id, displayName)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove from organization
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      {/* Remove User Confirmation Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove User</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {userToRemove?.name} from this organization? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveUser}>
              Remove User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
