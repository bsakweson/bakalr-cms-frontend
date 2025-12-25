'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Plus,
  FileText,
  Upload,
  UserPlus,
  Settings,
  Building2,
  Palette,
} from 'lucide-react';

// Generic icon component type to match layout.tsx
type IconComponent = React.ComponentType<{ className?: string }>;

interface CommandPaletteProps {
  navigation: Array<{
    name: string;
    href: string;
    icon: IconComponent;
  }>;
}

export function CommandPalette({ navigation }: CommandPaletteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        data-search-trigger
        className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <span>Search...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          <CommandGroup heading="Navigation">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.href}
                  onSelect={() => {
                    runCommand(() => router.push(item.href));
                  }}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{item.name}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Quick Actions">
            <CommandItem
              onSelect={() => {
                runCommand(() => router.push('/dashboard/content/new'));
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              <span>Create New Content</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                runCommand(() => router.push('/dashboard/content-types/new'));
              }}
            >
              <FileText className="mr-2 h-4 w-4" />
              <span>Create Content Type</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                runCommand(() => router.push('/dashboard/media'));
              }}
            >
              <Upload className="mr-2 h-4 w-4" />
              <span>Upload Media</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                runCommand(() => router.push('/dashboard/users'));
              }}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              <span>Invite User</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Settings">
            <CommandItem
              onSelect={() => {
                runCommand(() => router.push('/dashboard/settings'));
              }}
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>User Settings</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                runCommand(() => router.push('/dashboard/organization'));
              }}
            >
              <Building2 className="mr-2 h-4 w-4" />
              <span>Organization Settings</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                runCommand(() => router.push('/dashboard/themes'));
              }}
            >
              <Palette className="mr-2 h-4 w-4" />
              <span>Manage Themes</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
