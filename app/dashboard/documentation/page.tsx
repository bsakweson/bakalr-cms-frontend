'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Book, 
  Search, 
  Bell, 
  Palette, 
  Shield,
  Webhook,
  FileText,
  Key,
  Lock,
  Zap,
  Globe,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

interface DocSection {
  id: string;
  title: string;
  description: string;
  icon: any;
  href: string;
  external?: boolean;
}

const docSections: DocSection[] = [
  {
    id: 'search',
    title: 'search',
    description: 'Full-text search with Meilisearch',
    icon: Search,
    href: 'https://github.com/bsakweson/bakalr-cms/blob/main/docs/search.md',
    external: true,
  },
  {
    id: 'webhooks',
    title: 'webhooks',
    description: 'Webhook configuration and logs',
    icon: Webhook,
    href: 'https://github.com/bsakweson/bakalr-cms/blob/main/docs/webhooks.md',
    external: true,
  },
  {
    id: 'notifications',
    title: 'notifications',
    description: 'In-app notifications',
    icon: Bell,
    href: '/dashboard/notifications',
    external: false,
  },
  {
    id: 'themes',
    title: 'themes',
    description: 'Custom theming',
    icon: Palette,
    href: '/dashboard/themes',
    external: false,
  },
  {
    id: 'audit',
    title: 'audit',
    description: 'Audit log viewer',
    icon: Shield,
    href: '/dashboard/audit-logs',
    external: false,
  },
  {
    id: 'analytics',
    title: 'analytics',
    description: 'Content and user analytics',
    icon: Zap,
    href: '/dashboard/analytics',
    external: false,
  },
  {
    id: 'getting-started',
    title: 'getting started',
    description: 'Installation and first steps',
    icon: Book,
    href: 'https://github.com/bsakweson/bakalr-cms/blob/main/docs/getting-started.md',
    external: true,
  },
  {
    id: 'authentication',
    title: 'authentication',
    description: 'JWT, 2FA, API keys, password reset',
    icon: Lock,
    href: 'https://github.com/bsakweson/bakalr-cms/blob/main/docs/authentication.md',
    external: true,
  },
  {
    id: 'api-reference',
    title: 'API reference',
    description: 'Interactive OpenAPI documentation',
    icon: FileText,
    href: `${process.env.NEXT_PUBLIC_API_URL || ''}/api/docs`,
    external: true,
  },
  {
    id: 'developer-guide',
    title: 'developer guide',
    description: 'Architecture and development',
    icon: Zap,
    href: 'https://github.com/bsakweson/bakalr-cms/blob/main/docs/developer-guide.md',
    external: true,
  },
  {
    id: 'deployment',
    title: 'deployment',
    description: 'Docker and production setup',
    icon: Globe,
    href: 'https://github.com/bsakweson/bakalr-cms/blob/main/docs/deployment.md',
    external: true,
  },
  {
    id: 'security',
    title: 'security',
    description: 'Best practices and hardening',
    icon: Key,
    href: 'https://github.com/bsakweson/bakalr-cms/blob/main/docs/security.md',
    external: true,
  },
];

export default function DocumentationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documentation</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive guides and references for Bakalr CMS features
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {docSections.map((section) => {
          const Icon = section.icon;
          const isExternal = section.external || section.href.startsWith('http');
          
          const CardComponent = (
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer group">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl">{section.title}</CardTitle>
                  </div>
                  {isExternal && (
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {section.description}
                </CardDescription>
              </CardContent>
            </Card>
          );

          if (isExternal) {
            return (
              <a
                key={section.id}
                href={section.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                {CardComponent}
              </a>
            );
          }

          return (
            <Link key={section.id} href={section.href}>
              {CardComponent}
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Additional Resources</CardTitle>
          <CardDescription>
            More information and community resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <a
              href="https://github.com/bsakweson/bakalr-cms"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm hover:underline text-primary"
            >
              <ExternalLink className="h-4 w-4" />
              GitHub Repository
            </a>
            <a
              href="https://github.com/bsakweson/bakalr-cms/blob/main/CHANGELOG.md"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm hover:underline text-primary"
            >
              <ExternalLink className="h-4 w-4" />
              Changelog
            </a>
            <a
              href="https://github.com/bsakweson/bakalr-cms/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm hover:underline text-primary"
            >
              <ExternalLink className="h-4 w-4" />
              Report an Issue
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
