'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Processing authentication...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get data from URL hash
        const hash = window.location.hash.substring(1);
        if (!hash) {
          // Check for error in query params
          const searchParams = new URLSearchParams(window.location.search);
          const errorParam = searchParams.get('error');
          if (errorParam) {
            setError(errorParam);
            return;
          }
          setError('No authentication data received');
          return;
        }

        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const userJson = params.get('user');
        const isNewUser = params.get('is_new_user') === 'true';

        if (!accessToken || !refreshToken || !userJson) {
          setError('Incomplete authentication data');
          return;
        }

        // Parse user data
        const user = JSON.parse(decodeURIComponent(userJson));

        // Store tokens and user in localStorage
        setStatus('Saving authentication...');
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        // Clear the hash from URL for security
        window.history.replaceState(null, '', window.location.pathname);

        setStatus('Login successful! Redirecting...');

        // Small delay for UX
        await new Promise(resolve => setTimeout(resolve, 500));

        // Redirect based on whether user is new
        if (isNewUser) {
          // New users might want to complete their profile
          router.push('/dashboard?welcome=true');
        } else {
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Callback processing error:', err);
        setError('Failed to process authentication');
      }
    };

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Authentication Failed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
            <div className="text-center">
              <a
                href="/login"
                className="text-primary hover:underline"
              >
                Return to login
              </a>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Completing Sign In</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-muted-foreground">{status}</p>
        </CardContent>
      </Card>
    </main>
  );
}
