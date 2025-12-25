'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { getMediaUrl } from '@/lib/api/client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Menu,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  FileText,
  FolderTree,
  Compass,
  Image,
  FileStack,
  Palette,
  Store,
  ShoppingCart,
  Users,
  Package,
  UserCog,
  BarChart3,
  Settings,
  Shield,
  Building2,
  ClipboardList,
  BookOpen,
  Cog,
  User as UserIcon,
  LogOut,
  HelpCircle,
  Loader2,
  Database,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { OrganizationSelector } from '@/components/organization-selector';
import { CommandPalette } from '@/components/command-palette';
import { OnboardingTour } from '@/components/onboarding-tour';
import { DynamicBreadcrumbs } from '@/components/dynamic-breadcrumbs';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { KeyboardShortcutsHelp, useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { EmailVerificationBanner } from '@/components/EmailVerificationBanner';
import type { User } from '@/types';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Icon component type for navigation items
 */
export type IconComponent = React.ComponentType<{ className?: string }>;

/**
 * Navigation link item with optional permission requirements
 */
export interface NavLink {
  /** Display name for the navigation item */
  name: string;
  /** Route path */
  href: string;
  /** Lucide icon component */
  icon: IconComponent;
  /** Unique key for React reconciliation and permission checking */
  key: string;
  /** Required permissions (user needs ANY of these to see the item) */
  permissions?: readonly string[];
  /** Optional badge count for notifications */
  badge?: number;
}

/**
 * Collapsible navigation section containing multiple NavLinks
 */
export interface NavSection {
  /** Discriminator for type narrowing */
  type: 'section';
  /** Display label for the section header */
  label: string;
  /** Unique key for React reconciliation and state management */
  key: string;
  /** Required permissions to see the section (user needs ANY of these) */
  permissions?: readonly string[];
  /** Navigation items within this section */
  items: readonly NavLink[];
}

/**
 * Union type for all navigation item types
 */
export type NavItem = NavLink | NavSection;

/**
 * Type guard to check if a NavItem is a NavSection
 */
export function isNavSection(item: NavItem): item is NavSection {
  return 'type' in item && item.type === 'section';
}

/**
 * Type guard to check if a NavItem is a NavLink
 */
export function isNavLink(item: NavItem): item is NavLink {
  return !isNavSection(item);
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Permission definitions - centralized and type-safe
 * Using 'as const' for literal types and better autocomplete
 */
export const PERMISSIONS = {
  // CMS Content Permissions
  CONTENT_READ: 'content.read',
  CONTENT_WRITE: 'content.write',
  CONTENT_DELETE: 'content.delete',
  CONTENT_TYPES_READ: 'content.type.read',
  CONTENT_TYPES_WRITE: 'content.type.create',
  MEDIA_READ: 'media.read',
  MEDIA_UPLOAD: 'media.upload',
  MEDIA_DELETE: 'media.delete',
  TEMPLATES_READ: 'template.read',
  TEMPLATES_WRITE: 'template.create',
  THEMES_READ: 'theme.read',
  THEMES_WRITE: 'theme.create',
  NAVIGATION_READ: 'navigation.read',
  NAVIGATION_WRITE: 'navigation.create',
  
  // Store Management Permissions
  STORE_READ: 'inventory.read',
  STORE_ADMIN: 'inventory.manage',
  ORDERS_READ: 'order.read',
  ORDERS_WRITE: 'order.create',
  ORDERS_PROCESS: 'order.process',
  CUSTOMERS_READ: 'customer.read',
  CUSTOMERS_WRITE: 'customer.create',
  INVENTORY_READ: 'inventory.read',
  INVENTORY_WRITE: 'inventory.create',
  INVENTORY_ADJUST: 'inventory.adjust',
  EMPLOYEES_READ: 'employee.read',
  EMPLOYEES_WRITE: 'employee.create',
  ANALYTICS_READ: 'analytics.read',
  
  // Administration Permissions
  USERS_READ: 'user.read',
  USERS_WRITE: 'user.create',
  USERS_DELETE: 'user.delete',
  ROLES_READ: 'role.read',
  ROLES_WRITE: 'role.create',
  ORG_READ: 'organization.read',
  ORG_WRITE: 'organization.create',
  AUDIT_READ: 'audit.logs',
  SETTINGS_READ: 'organization.settings.view',
  SETTINGS_WRITE: 'organization.settings.manage',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Navigation structure with sections - immutable configuration
 */
export const navigationConfig: readonly NavItem[] = [
  // Top-level items (CMS core features)
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: LayoutDashboard, 
    key: 'dashboard' 
  },
  { 
    name: 'Content', 
    href: '/dashboard/content', 
    icon: FileText, 
    key: 'content', 
    permissions: [PERMISSIONS.CONTENT_READ] 
  },
  { 
    name: 'Content Types', 
    href: '/dashboard/content-types', 
    icon: FolderTree, 
    key: 'content-types', 
    permissions: [PERMISSIONS.CONTENT_TYPES_READ] 
  },
  { 
    name: 'Navigation', 
    href: '/dashboard/navigation', 
    icon: Compass, 
    key: 'navigation',
    permissions: [PERMISSIONS.NAVIGATION_READ]
  },
  { 
    name: 'Media', 
    href: '/dashboard/media', 
    icon: Image, 
    key: 'media', 
    permissions: [PERMISSIONS.MEDIA_READ] 
  },
  { 
    name: 'Templates', 
    href: '/dashboard/templates', 
    icon: FileStack, 
    key: 'templates', 
    permissions: [PERMISSIONS.TEMPLATES_READ] 
  },
  { 
    name: 'Themes', 
    href: '/dashboard/themes', 
    icon: Palette, 
    key: 'themes', 
    permissions: [PERMISSIONS.THEMES_READ] 
  },
  
  // Store Management Section
  {
    type: 'section',
    label: 'Store Management',
    key: 'store-management',
    permissions: [
      PERMISSIONS.STORE_READ, 
      PERMISSIONS.ORDERS_READ, 
      PERMISSIONS.INVENTORY_READ,
      PERMISSIONS.CUSTOMERS_READ
    ],
    items: [
      { 
        name: 'Store Dashboard', 
        href: '/dashboard/boutique-admin', 
        icon: Store, 
        key: 'store-dashboard', 
        permissions: [PERMISSIONS.STORE_READ] 
      },
      { 
        name: 'Orders', 
        href: '/dashboard/boutique-admin/orders', 
        icon: ShoppingCart, 
        key: 'orders', 
        permissions: [PERMISSIONS.ORDERS_READ] 
      },
      { 
        name: 'Customers', 
        href: '/dashboard/boutique-admin/customers', 
        icon: Users, 
        key: 'customers', 
        permissions: [PERMISSIONS.CUSTOMERS_READ] 
      },
      { 
        name: 'Inventory', 
        href: '/dashboard/inventory', 
        icon: Package, 
        key: 'inventory', 
        permissions: [PERMISSIONS.INVENTORY_READ] 
      },
      { 
        name: 'Employees', 
        href: '/dashboard/boutique-admin/employees', 
        icon: UserCog, 
        key: 'employees', 
        permissions: [PERMISSIONS.EMPLOYEES_READ] 
      },
      { 
        name: 'Reference Data', 
        href: '/dashboard/boutique-admin/reference-data', 
        icon: Database, 
        key: 'reference-data', 
        permissions: [PERMISSIONS.STORE_ADMIN] 
      },
      { 
        name: 'Analytics', 
        href: '/dashboard/boutique-admin/analytics', 
        icon: BarChart3, 
        key: 'analytics', 
        permissions: [PERMISSIONS.ANALYTICS_READ] 
      },
      { 
        name: 'Store Settings', 
        href: '/dashboard/boutique-admin/settings', 
        icon: Settings, 
        key: 'store-settings', 
        permissions: [PERMISSIONS.STORE_ADMIN] 
      },
    ],
  },
  
  // Administration Section
  {
    type: 'section',
    label: 'Administration',
    key: 'administration',
    permissions: [
      PERMISSIONS.USERS_READ, 
      PERMISSIONS.ROLES_READ, 
      PERMISSIONS.ORG_READ, 
      PERMISSIONS.AUDIT_READ
    ],
    items: [
      { 
        name: 'Users', 
        href: '/dashboard/users', 
        icon: Users, 
        key: 'users', 
        permissions: [PERMISSIONS.USERS_READ] 
      },
      { 
        name: 'Roles', 
        href: '/dashboard/roles', 
        icon: Shield, 
        key: 'roles', 
        permissions: [PERMISSIONS.ROLES_READ] 
      },
      { 
        name: 'Organization', 
        href: '/dashboard/organization', 
        icon: Building2, 
        key: 'organization', 
        permissions: [PERMISSIONS.ORG_READ] 
      },
      { 
        name: 'Audit Logs', 
        href: '/dashboard/audit-logs', 
        icon: ClipboardList, 
        key: 'audit-logs', 
        permissions: [PERMISSIONS.AUDIT_READ] 
      },
      { 
        name: 'Documentation', 
        href: '/dashboard/documentation', 
        icon: BookOpen, 
        key: 'documentation'
        // No permissions - accessible to all authenticated users
      },
      { 
        name: 'Settings', 
        href: '/dashboard/settings', 
        icon: Cog, 
        key: 'settings', 
        permissions: [PERMISSIONS.SETTINGS_READ] 
      },
    ],
  },
] as const;

/** LocalStorage key for sidebar expanded sections state */
const SIDEBAR_STORAGE_KEY = 'bakalr-sidebar-sections-v1';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get user initials from a full name string
 * @param name - Full name to extract initials from
 * @returns Up to 2 uppercase initials
 * 
 * @example
 * getUserInitials('John Doe') // 'JD'
 * getUserInitials('Alice Bob Charlie') // 'AB'
 * getUserInitials('X') // 'X'
 * getUserInitials('') // ''
 */
export function getUserInitials(name: string): string {
  if (!name || typeof name !== 'string') {
    return '';
  }
  
  return name
    .trim()
    .split(/\s+/)
    .filter(part => part.length > 0)
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Get display name from user object with fallback chain
 * @param user - User object or null
 * @returns Display name string
 * 
 * Priority: full_name > first_name + last_name > first_name > last_name > username > email local part > 'User'
 */
export function getUserDisplayName(user: User | null): string {
  if (!user) return 'User';
  
  // Check for computed full_name first
  if (user.full_name && user.full_name.trim()) {
    return user.full_name.trim();
  }
  
  // Combine first and last name
  const firstName = user.first_name?.trim() || '';
  const lastName = user.last_name?.trim() || '';
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  if (firstName) return firstName;
  if (lastName) return lastName;
  
  // Fall back to username
  if (user.username && user.username.trim()) {
    return user.username.trim();
  }
  
  // Fall back to email local part
  if (user.email) {
    const localPart = user.email.split('@')[0];
    if (localPart) return localPart;
  }
  
  return 'User';
}

/**
 * Get user initials from user object with fallback chain
 * @param user - User object or null
 * @returns Up to 2 uppercase initials
 */
export function getUserInitialsFromUser(user: User | null): string {
  if (!user) return 'U';
  
  // Try first + last name initials
  const firstName = user.first_name?.trim() || '';
  const lastName = user.last_name?.trim() || '';
  
  if (firstName && lastName) {
    return (firstName[0] + lastName[0]).toUpperCase();
  }
  
  // Try first name only
  if (firstName && firstName.length >= 2) {
    return firstName.slice(0, 2).toUpperCase();
  }
  if (firstName) {
    return firstName[0].toUpperCase();
  }
  
  // Try last name only
  if (lastName && lastName.length >= 2) {
    return lastName.slice(0, 2).toUpperCase();
  }
  if (lastName) {
    return lastName[0].toUpperCase();
  }
  
  // Try username
  if (user.username) {
    return getUserInitials(user.username) || user.username.slice(0, 2).toUpperCase();
  }
  
  // Try email
  if (user.email) {
    const localPart = user.email.split('@')[0];
    if (localPart) {
      return getUserInitials(localPart) || localPart.slice(0, 2).toUpperCase();
    }
  }
  
  return 'U';
}

/**
 * Get flat array of all navigation links (excluding section wrappers)
 * Memoized for performance
 */
export function getFlatNavigation(): NavLink[] {
  const items: NavLink[] = [];
  
  for (const item of navigationConfig) {
    if (isNavSection(item)) {
      items.push(...item.items);
    } else {
      items.push(item);
    }
  }
  
  return items;
}

/**
 * Check if a pathname matches a navigation href
 * @param pathname - Current pathname
 * @param href - Navigation item href
 * @returns true if active
 */
export function isNavItemActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  
  // Exact match
  if (pathname === href) return true;
  
  // Dashboard is only active on exact match
  if (href === '/dashboard') return false;
  
  // Check if current path starts with href (for nested routes)
  return pathname.startsWith(href + '/');
}

/**
 * Safe localStorage getter with JSON parsing
 * @param key - Storage key
 * @param defaultValue - Default value if key doesn't exist or parse fails
 */
function getStorageValue<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return defaultValue;
    return JSON.parse(stored);
  } catch {
    return defaultValue;
  }
}

/**
 * Safe localStorage setter with JSON serialization
 * @param key - Storage key
 * @param value - Value to store
 */
function setStorageValue<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to save to localStorage: ${key}`, error);
  }
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook for checking user permissions
 * Returns memoized permission checking functions
 */
export function useUserPermissions() {
  const { user } = useAuth();
  
  /**
   * Check if user has a specific permission
   * TODO: Replace with actual permission fetching from API
   */
  const hasPermission = useCallback((permission: string): boolean => {
    // For now, all logged-in users have access
    // In production: check user.roles, user.permissions, or fetch from API
    return !!user;
  }, [user]);

  /**
   * Check if user has any of the specified permissions
   * Returns true if permissions array is empty (no restriction)
   */
  const hasAnyPermission = useCallback((permissions?: readonly string[]): boolean => {
    if (!permissions || permissions.length === 0) return true;
    return permissions.some(p => hasPermission(p));
  }, [hasPermission]);

  /**
   * Check if user has all of the specified permissions
   */
  const hasAllPermissions = useCallback((permissions?: readonly string[]): boolean => {
    if (!permissions || permissions.length === 0) return true;
    return permissions.every(p => hasPermission(p));
  }, [hasPermission]);

  return useMemo(() => ({
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAuthenticated: !!user,
  }), [hasPermission, hasAnyPermission, hasAllPermissions, user]);
}

/**
 * Hook for managing sidebar expanded sections state
 * Persists state to localStorage
 */
function useSidebarSections() {
  const pathname = usePathname();
  
  // Initialize from localStorage
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    const saved = getStorageValue<string[]>(SIDEBAR_STORAGE_KEY, []);
    return new Set(saved);
  });

  // Track initial render to prevent auto-expand on page load
  const [isInitialRender, setIsInitialRender] = useState(true);
  
  useEffect(() => {
    setIsInitialRender(false);
  }, []);

  // Auto-expand section when navigating to a page within it
  useEffect(() => {
    if (!pathname || isInitialRender) return;
    
    for (const item of navigationConfig) {
      if (isNavSection(item)) {
        const hasActiveItem = item.items.some(navItem => 
          isNavItemActive(pathname, navItem.href)
        );
        
        if (hasActiveItem && !expandedSections.has(item.key)) {
          setExpandedSections(prev => new Set([...prev, item.key]));
        }
      }
    }
  }, [pathname, isInitialRender, expandedSections]);

  // Persist to localStorage
  useEffect(() => {
    setStorageValue(SIDEBAR_STORAGE_KEY, [...expandedSections]);
  }, [expandedSections]);

  const toggleSection = useCallback((key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const expandSection = useCallback((key: string) => {
    setExpandedSections(prev => new Set([...prev, key]));
  }, []);

  const collapseSection = useCallback((key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedSections(new Set());
  }, []);

  return {
    expandedSections,
    toggleSection,
    expandSection,
    collapseSection,
    collapseAll,
    isExpanded: useCallback((key: string) => expandedSections.has(key), [expandedSections]),
  };
}

// ============================================================================
// COMPONENTS
// ============================================================================

interface NavLinkItemProps {
  item: NavLink;
  isActive: boolean;
  onClick?: () => void;
  indented?: boolean;
}

/**
 * Individual navigation link item with proper icon rendering
 */
const NavLinkItem = memo(function NavLinkItem({ 
  item, 
  isActive, 
  onClick,
  indented = false,
}: NavLinkItemProps) {
  const Icon = item.icon;
  
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
        isActive
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <Icon 
        className={`${indented ? 'h-4 w-4' : 'h-5 w-5'} shrink-0 transition-transform group-hover:scale-110`} 
        aria-hidden="true" 
      />
      <span className="truncate">{item.name}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-medium text-destructive-foreground">
          {item.badge > 99 ? '99+' : item.badge}
        </span>
      )}
    </Link>
  );
});

interface CollapsibleSectionProps {
  section: NavSection;
  pathname: string | null;
  isExpanded: boolean;
  onToggle: () => void;
  onNavClick?: () => void;
  hasAnyPermission: (permissions?: readonly string[]) => boolean;
}

/**
 * Collapsible navigation section with accessibility support
 */
const CollapsibleSection = memo(function CollapsibleSection({
  section,
  pathname,
  isExpanded,
  onToggle,
  onNavClick,
  hasAnyPermission,
}: CollapsibleSectionProps) {
  // Filter items based on permissions
  const visibleItems = useMemo(() => 
    section.items.filter(item => hasAnyPermission(item.permissions)),
    [section.items, hasAnyPermission]
  );
  
  // Don't render section if no items are visible
  if (visibleItems.length === 0) return null;
  
  // Check if any item in section is active
  const hasActiveItem = visibleItems.some(item => 
    isNavItemActive(pathname, item.href)
  );

  const sectionId = `nav-section-${section.key}`;
  const contentId = `nav-section-content-${section.key}`;

  return (
    <div className="mt-2" role="group" aria-labelledby={sectionId}>
      <button
        id={sectionId}
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
          hasActiveItem ? 'text-primary' : 'text-muted-foreground'
        }`}
      >
        <span className="uppercase tracking-wider text-xs">{section.label}</span>
        <ChevronDown 
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      
      <div 
        id={contentId}
        role="region"
        aria-labelledby={sectionId}
        hidden={!isExpanded}
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav 
          className="ml-2 space-y-1 border-l border-border pl-2 mt-1"
          aria-label={`${section.label} navigation`}
        >
          {visibleItems.map((item) => (
            <NavLinkItem
              key={item.key}
              item={item}
              isActive={isNavItemActive(pathname, item.href)}
              onClick={onNavClick}
              indented
            />
          ))}
        </nav>
      </div>
    </div>
  );
});

interface SidebarProps {
  user: User | null;
  pathname: string | null;
  onNavClick?: () => void;
  expandedSections: Set<string>;
  toggleSection: (key: string) => void;
}

/**
 * Main sidebar navigation component
 */
const Sidebar = memo(function Sidebar({ 
  user, 
  pathname, 
  onNavClick,
  expandedSections,
  toggleSection,
}: SidebarProps) {
  const { hasAnyPermission } = useUserPermissions();

  return (
    <div className="flex h-full flex-col">
      {/* Logo/Brand */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="text-2xl font-bold text-primary hover:opacity-80 transition-opacity">
          Bakalr CMS
        </Link>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-4 overflow-y-auto" aria-label="Main navigation">
        {navigationConfig.map((item) => {
          // Handle collapsible sections
          if (isNavSection(item)) {
            // Check if user has permission to see this section
            if (!hasAnyPermission(item.permissions)) return null;
            
            return (
              <CollapsibleSection
                key={item.key}
                section={item}
                pathname={pathname}
                isExpanded={expandedSections.has(item.key)}
                onToggle={() => toggleSection(item.key)}
                onNavClick={onNavClick}
                hasAnyPermission={hasAnyPermission}
              />
            );
          }

          // Handle top-level navigation items
          if (!hasAnyPermission(item.permissions)) return null;
          
          return (
            <NavLinkItem
              key={item.key}
              item={item}
              isActive={isNavItemActive(pathname, item.href)}
              onClick={onNavClick}
            />
          );
        })}
      </nav>
      
      {/* Organization Info */}
      <Separator />
      <div className="px-4 py-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm font-medium">Organization</p>
          <p className="text-xs text-muted-foreground truncate" title={user?.organization?.name}>
            {user?.organization?.name || 'Default Organization'}
          </p>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Dashboard layout component with sidebar navigation
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const { isLoading } = useRequireAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Sidebar state management
  const { expandedSections, toggleSection } = useSidebarSections();

  // Close mobile menu on navigation
  const handleNavClick = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  // Global keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'n',
      metaKey: true,
      description: 'Create new content',
      action: () => router.push('/dashboard/content/new'),
    },
    {
      key: 's',
      metaKey: true,
      description: 'Focus search',
      action: () => {
        const searchButton = document.querySelector('[data-search-trigger]') as HTMLElement;
        searchButton?.click();
      },
    },
    {
      key: 'h',
      metaKey: true,
      description: 'Go to dashboard home',
      action: () => router.push('/dashboard'),
    },
    {
      key: 'u',
      metaKey: true,
      description: 'Go to users',
      action: () => router.push('/dashboard/users'),
    },
    {
      key: ',',
      metaKey: true,
      description: 'Open settings',
      action: () => router.push('/dashboard/settings'),
    },
  ]);

  // Memoize flat navigation for header and command palette
  const flatNavigation = useMemo(() => getFlatNavigation(), []);
  
  // Find current page from navigation
  const currentNav = useMemo(() => 
    flatNavigation.find(item => isNavItemActive(pathname, item.href)),
    [flatNavigation, pathname]
  );

  // Handle logout
  const handleLogout = useCallback(async () => {
    await logout();
    window.location.href = '/login';
  }, [logout]);

  // Compute display values
  const displayName = useMemo(() => getUserDisplayName(user), [user]);
  const userInitials = useMemo(() => getUserInitialsFromUser(user), [user]);

  // Loading state with proper spinner
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background" role="status" aria-live="polite">
        <head>
          <title>Loading Dashboard - Bakalr CMS</title>
        </head>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
          <span className="sr-only">Loading, please wait</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <OnboardingTour />
      <KeyboardShortcutsHelp shortcuts={[
        { key: 'k', metaKey: true, description: 'Open command palette' },
        { key: 'n', metaKey: true, description: 'Create new content' },
        { key: 's', metaKey: true, description: 'Focus search' },
        { key: 'h', metaKey: true, description: 'Go to dashboard home' },
        { key: 'u', metaKey: true, description: 'Go to users' },
        { key: ',', metaKey: true, description: 'Open settings' },
        { key: '?', shiftKey: true, description: 'Show keyboard shortcuts' },
      ]} />
      
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 border-r bg-card lg:block" aria-label="Sidebar">
        <Sidebar 
          user={user} 
          pathname={pathname} 
          onNavClick={handleNavClick}
          expandedSections={expandedSections}
          toggleSection={toggleSection}
        />
      </aside>

      {/* Mobile Menu */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar 
            user={user} 
            pathname={pathname} 
            onNavClick={handleNavClick}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-card px-6">
          <div className="flex items-center gap-4">
            {/* Mobile menu trigger */}
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden"
              aria-label="Open navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
            
            {/* Current page indicator */}
            <div className="flex items-center gap-3">
              {currentNav && (
                <currentNav.icon className="h-6 w-6 text-primary" aria-hidden="true" />
              )}
              <h1 className="text-xl font-semibold">
                {currentNav?.name || 'Dashboard'}
              </h1>
            </div>
          </div>

          {/* Header actions */}
          <div className="flex items-center gap-3">
            <CommandPalette navigation={flatNavigation} />
            <LanguageSwitcher />
            <OrganizationSelector />
            
            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-10 w-10 rounded-full ring-offset-background transition-all hover:ring-2 hover:ring-primary hover:ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  aria-label={`User menu for ${displayName}`}
                >
                  <Avatar className="h-10 w-10">
                    {user?.avatar_url && (
                      <AvatarImage src={getMediaUrl(user.avatar_url)} alt={displayName} />
                    )}
                    <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile" className="flex items-center gap-2 cursor-pointer">
                    <UserIcon className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="flex items-center gap-2 cursor-pointer">
                    <Cog className="h-4 w-4" />
                    <span>Settings</span>
                    <span className="ml-auto text-xs text-muted-foreground">⌘,</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/documentation" className="flex items-center gap-2 cursor-pointer">
                    <HelpCircle className="h-4 w-4" />
                    <span>Help & Docs</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Email Verification Banner */}
        <EmailVerificationBanner />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          <DynamicBreadcrumbs />
          {children}
        </main>
      </div>
    </div>
  );
}
