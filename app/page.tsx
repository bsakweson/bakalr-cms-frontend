import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-linear-to-b from-background to-muted/30">
      <main className="container flex flex-col items-center gap-8 px-4 text-center">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold tracking-tight text-primary">
            Bakalr CMS
          </h1>
          <p className="text-xl text-muted-foreground">
            Modern Headless Content Management System
          </p>
        </div>
        
        <p className="max-w-2xl text-lg text-muted-foreground">
          Build powerful content experiences with our headless CMS featuring
          multi-language support, advanced theming, GraphQL API, and real-time collaboration.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Button asChild size="lg" className="min-w-[200px]">
            <Link href="/login">
              Sign In
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="min-w-[200px]">
            <Link href="/register">
              Get Started
            </Link>
          </Button>
        </div>

        <div className="mt-12 w-full max-w-4xl">
          <h2 className="mb-6 text-2xl font-semibold">Key Features</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-2 rounded-lg border bg-card p-6">
              <div className="text-3xl">🌍</div>
              <h3 className="font-semibold text-lg">Multi-Language</h3>
              <p className="text-sm text-muted-foreground">
                Automatic translation to multiple languages
              </p>
            </div>
            <div className="space-y-2 rounded-lg border bg-card p-6">
              <div className="text-3xl">🎨</div>
              <h3 className="font-semibold text-lg">Custom Theming</h3>
              <p className="text-sm text-muted-foreground">
                Beautiful dark chocolate brown theme
              </p>
            </div>
            <div className="space-y-2 rounded-lg border bg-card p-6">
              <div className="text-3xl">⚡</div>
              <h3 className="font-semibold text-lg">GraphQL API</h3>
              <p className="text-sm text-muted-foreground">
                Flexible querying with REST & GraphQL
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
