'use client';

import { usePathname } from 'next/navigation';
import { Breadcrumbs } from '@/components/breadcrumbs';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  content: 'Content',
  'content-types': 'Content Types',
  media: 'Media',
  users: 'Users',
  roles: 'Roles',
  translations: 'Translations',
  templates: 'Templates',
  themes: 'Themes',
  organization: 'Organization',
  'audit-logs': 'Audit Logs',
  settings: 'Settings',
  new: 'New',
  edit: 'Edit',
};

export function DynamicBreadcrumbs() {
  const pathname = usePathname();

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (!pathname) return [];

    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Get label from route labels or capitalize segment
      const label = routeLabels[segment] || 
        segment.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

      // Don't link the last segment (current page)
      breadcrumbs.push({
        label,
        href: index === segments.length - 1 ? undefined : currentPath,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumbs on root dashboard
  if (breadcrumbs.length <= 1) return null;

  return (
    <div className="mb-4">
      <Breadcrumbs items={breadcrumbs} />
    </div>
  );
}
