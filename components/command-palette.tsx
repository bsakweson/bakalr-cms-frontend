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

interface CommandPaletteProps {
  navigation: Array<{
    name: string;
    href: string;
    icon: string;
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
            {navigation.map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => {
                  runCommand(() => router.push(item.href));
                }}
              >
                <span className="mr-2">{item.icon}</span>
                <span>{item.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Quick Actions">
            <CommandItem
              onSelect={() => {
                runCommand(() => router.push('/dashboard/content/new'));
              }}
            >
              <span className="mr-2">➕</span>
              <span>Create New Content</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                runCommand(() => router.push('/dashboard/content-types/new'));
              }}
            >
              <span className="mr-2">📋</span>
              <span>Create Content Type</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                runCommand(() => router.push('/dashboard/media'));
              }}
            >
              <span className="mr-2">⬆️</span>
              <span>Upload Media</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                runCommand(() => router.push('/dashboard/users'));
              }}
            >
              <span className="mr-2">✉️</span>
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
              <span className="mr-2">⚙️</span>
              <span>User Settings</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                runCommand(() => router.push('/dashboard/organization'));
              }}
            >
              <span className="mr-2">🏢</span>
              <span>Organization Settings</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                runCommand(() => router.push('/dashboard/themes'));
              }}
            >
              <span className="mr-2">🎨</span>
              <span>Manage Themes</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
