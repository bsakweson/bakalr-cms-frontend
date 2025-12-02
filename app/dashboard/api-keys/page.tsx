'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function APIKeysRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect after 3 seconds
    const timer = setTimeout(() => {
      router.push('/dashboard/organization?tab=api-keys');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  const handleRedirect = () => {
    router.push('/dashboard/organization?tab=api-keys');
  };

  return (
    <div className="container mx-auto py-16 flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Page Moved</CardTitle>
          <CardDescription>
            API Keys management has been consolidated into Organization Settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You'll be automatically redirected to the new location in a few seconds, or click the button below.
          </p>
          <Button onClick={handleRedirect} className="w-full">
            Go to Organization Settings
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
