'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { KeyboardShortcutsHelp, useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Content', href: '/dashboard/content', icon: '📝' },
  { name: 'Content Types', href: '/dashboard/content-types', icon: '📋' },
  { name: 'Media', href: '/dashboard/media', icon: '🖼️' },
  { name: 'Users', href: '/dashboard/users', icon: '👥' },
  { name: 'Roles', href: '/dashboard/roles', icon: '🔐' },
  { name: 'Translations', href: '/dashboard/translations', icon: '🌍' },
  { name: 'Templates', href: '/dashboard/templates', icon: '📄' },
  { name: 'Themes', href: '/dashboard/themes', icon: '🎨' },
  { name: 'Organization', href: '/dashboard/organization', icon: '🏢' },
  { name: 'Audit Logs', href: '/dashboard/audit-logs', icon: '📋' },
  { name: 'API Docs', href: 'http://localhost:8000/api/docs', icon: '📖', external: true },
  { name: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
];

// Sidebar component defined outside render
function Sidebar({ 
  user, 
  pathname, 
  setIsMobileMenuOpen 
}: { 
  user: any; 
  pathname: string | null; 
  setIsMobileMenuOpen: (open: boolean) => void;
}) {
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-2xl font-bold text-primary">Bakalr CMS</h1>
      </div>
      <nav className="flex-1 space-y-1 px-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          
          // External links (like API docs)
          if (item.external) {
            return (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <span className="text-xl">{item.icon}</span>
                {item.name}
                <span className="ml-auto text-xs">↗</span>
              </a>
            );
          }
          
          // Internal links
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>
      <Separator />
      <div className="px-4 pb-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm font-medium">Organization</p>
          <p className="text-xs text-muted-foreground">
            {user?.organization?.name || 'Default Org'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const { isLoading } = useRequireAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

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

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user?.first_name) return user.first_name;
    if (user?.last_name) return user.last_name;
    if (user?.username) return user.username;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const getUserInitialsFromUser = () => {
    if (user?.first_name && user?.last_name) {
      return (user.first_name[0] + user.last_name[0]).toUpperCase();
    }
    if (user?.first_name) return user.first_name.slice(0, 2).toUpperCase();
    if (user?.last_name) return user.last_name.slice(0, 2).toUpperCase();
    if (user?.username) return getUserInitials(user.username);
    if (user?.email) {
      const emailName = user.email.split('@')[0];
      return getUserInitials(emailName);
    }
    return 'U';
  };

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
      <aside className="hidden w-64 border-r bg-card lg:block">
        <Sidebar user={user} pathname={pathname} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      </aside>

      {/* Mobile Menu */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar user={user} pathname={pathname} setIsMobileMenuOpen={setIsMobileMenuOpen} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-card px-6">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="outline" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
                  ☰
                </Button>
              </SheetTrigger>
            </Sheet>
            <h2 className="text-xl font-semibold">
              {navigation.find((item) => pathname === item.href || pathname?.startsWith(item.href + '/'))?.name || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <CommandPalette navigation={navigation} />
            <OrganizationSelector />
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getUserInitialsFromUser()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{getUserDisplayName()}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          <DynamicBreadcrumbs />
          {children}
        </main>
      </div>
    </div>
  );
}
