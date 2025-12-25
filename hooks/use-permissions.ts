'use client';

import { useState, useEffect, useCallback } from 'react';
import { roleApi } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

export interface UserPermissions {
  roles: string[];
  permissions: string[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

// Permission definitions for navigation items
export const NAV_PERMISSIONS = {
  // CMS Content
  'content': ['content.read', 'content.create'],
  'content-types': ['content.type.read', 'content.type.create'],
  'navigation': ['content.read', 'content.update'],
  'media': ['media.read', 'media.upload'],
  'templates': ['template.read', 'template.create'],
  'themes': ['theme.read', 'theme.create'],
  
  // Store Management
  'boutique-admin': ['inventory.read', 'orders.read'],
  'orders': ['orders.read', 'orders.create'],
  'customers': ['customers.read', 'customers.create'],
  'inventory': ['inventory.read', 'inventory.create'],
  'employees': ['employees.read', 'employees.create'],
  'analytics': ['analytics.view'],
  'store-settings': ['organization.settings.view'],
  
  // Administration
  'users': ['user.read', 'user.create'],
  'roles': ['role.read', 'role.create'],
  'organization': ['organization.read', 'organization.update'],
  'audit-logs': ['audit.logs'],
  'settings': ['organization.settings.view', 'organization.settings.manage'],
} as const;

// Section visibility requirements
export const SECTION_PERMISSIONS = {
  'Store Management': ['inventory.read', 'orders.read', 'customers.read', 'employees.read'],
  'Administration': ['user.read', 'role.read', 'organization.read', 'audit.logs'],
} as const;

export function usePermissions(): UserPermissions & { 
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  canAccessNavItem: (itemKey: string) => boolean;
  canAccessSection: (sectionLabel: string) => boolean;
  isLoading: boolean;
} {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUserPermissions() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch user's roles and their permissions
        const rolesResponse = await roleApi.listRoles();
        
        // For now, assume user has admin role - in production, 
        // this should come from user.roles or a dedicated endpoint
        const userRoles = rolesResponse.roles || [];
        const roleNames = userRoles.map(r => r.name);
        
        // Collect all permissions from user's roles
        const allPermissions = new Set<string>();
        userRoles.forEach(role => {
          if (role.permissions) {
            role.permissions.forEach(p => allPermissions.add(p));
          }
        });

        setRoles(roleNames);
        setPermissions(Array.from(allPermissions));
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
        // Default to basic permissions on error
        setRoles(['viewer']);
        setPermissions([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserPermissions();
  }, [user]);

  const isAdmin = roles.includes('admin') || roles.includes('super_admin');
  const isSuperAdmin = roles.includes('super_admin');

  const hasPermission = useCallback((permission: string): boolean => {
    // Super admins have all permissions
    if (isSuperAdmin) return true;
    // Admins have most permissions
    if (isAdmin) return true;
    return permissions.includes(permission);
  }, [permissions, isAdmin, isSuperAdmin]);

  const hasAnyPermission = useCallback((perms: string[]): boolean => {
    if (isSuperAdmin || isAdmin) return true;
    return perms.some(p => permissions.includes(p));
  }, [permissions, isAdmin, isSuperAdmin]);

  const canAccessNavItem = useCallback((itemKey: string): boolean => {
    // Always allow dashboard access
    if (itemKey === 'dashboard' || itemKey === 'documentation') return true;
    
    const requiredPerms = NAV_PERMISSIONS[itemKey as keyof typeof NAV_PERMISSIONS];
    if (!requiredPerms) return true; // If no permission defined, allow access
    
    return hasAnyPermission(requiredPerms as unknown as string[]);
  }, [hasAnyPermission]);

  const canAccessSection = useCallback((sectionLabel: string): boolean => {
    const requiredPerms = SECTION_PERMISSIONS[sectionLabel as keyof typeof SECTION_PERMISSIONS];
    if (!requiredPerms) return true;
    
    return hasAnyPermission(requiredPerms as unknown as string[]);
  }, [hasAnyPermission]);

  return {
    roles,
    permissions,
    isAdmin,
    isSuperAdmin,
    hasPermission,
    hasAnyPermission,
    canAccessNavItem,
    canAccessSection,
    isLoading,
  };
}
