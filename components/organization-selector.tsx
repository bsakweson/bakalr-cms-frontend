'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { tenantApi } from '@/lib/api';
import type { OrganizationMembership } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function OrganizationSelector() {
  const { user, login } = useAuth();
  const [organizations, setOrganizations] = useState<OrganizationMembership[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    if (user) {
      loadOrganizations();
    }
  }, [user]);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const data = await tenantApi.listOrganizations();
      setOrganizations(data.organizations);
      setCurrentOrgId(data.current_organization_id);
    } catch (error) {
      console.error('Failed to load organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchOrganization = async (orgId: string) => {
    if (orgId === currentOrgId) return;

    try {
      setSwitching(true);
      const response = await tenantApi.switchOrganization({ organization_id: orgId });
      
      // Update tokens in auth context
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      
      // Reload the page to update all contexts
      window.location.reload();
    } catch (error) {
      console.error('Failed to switch organization:', error);
    } finally {
      setSwitching(false);
    }
  };

  const currentOrg = organizations.find((org) => org.organization_id === currentOrgId);

  if (loading || organizations.length <= 1) {
    return null; // Don't show selector if only one org
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={switching}>
          <span className="text-lg">🏢</span>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">
              {currentOrg?.organization_name || 'Select Organization'}
            </span>
            {currentOrg?.roles && currentOrg.roles.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {currentOrg.roles[0]}
                {currentOrg.roles.length > 1 && `, +${currentOrg.roles.length - 1}`}
              </span>
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Switch Organization</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.organization_id}
            onClick={() => handleSwitchOrganization(org.organization_id)}
            disabled={switching || org.organization_id === currentOrgId}
            className="flex flex-col items-start py-2"
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-medium">{org.organization_name}</span>
              {org.organization_id === currentOrgId && (
                <Badge variant="secondary" className="text-xs">
                  Current
                </Badge>
              )}
              {org.is_default && org.organization_id !== currentOrgId && (
                <Badge variant="outline" className="text-xs">
                  Default
                </Badge>
              )}
            </div>
            {org.roles && org.roles.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {org.roles.join(', ')}
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
