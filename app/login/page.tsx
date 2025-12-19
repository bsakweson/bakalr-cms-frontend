'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { socialLoginApi, SocialProvider, SocialProviderInfo, PROVIDER_INFO } from '@/lib/api/social-login';

// SVG Icon component for social providers
function ProviderIcon({ provider, className }: { provider: SocialProvider; className?: string }) {
  const info = PROVIDER_INFO[provider];
  if (!info) return null;
  
  return (
    <svg 
      className={className} 
      viewBox={provider === 'microsoft' ? '0 0 500 500' : '0 0 496 512'}
      fill="currentColor"
    >
      <path d={info.icon} />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [socialProviders, setSocialProviders] = useState<SocialProviderInfo[]>([]);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  // Check for OAuth error in URL params
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      // Clear the error from URL
      router.replace('/login', { scroll: false });
    }
  }, [searchParams, router]);

  // Fetch available social login providers on mount
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await socialLoginApi.getProviders();
        setSocialProviders(response.providers);
      } catch (err) {
        console.log('Social login providers not available');
      }
    };
    fetchProviders();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Clear any stale tokens before attempting login
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');

    try {
      console.log('Attempting login with:', email);
      await login({ email, password });
      console.log('Login successful, redirecting to dashboard');
      // Small delay to ensure state is synchronized, then use client-side navigation
      await new Promise(resolve => setTimeout(resolve, 100));
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      console.error('Error response:', err?.response?.data);
      const errorMessage = err?.response?.data?.detail || err?.message || 'Login failed. Please check your credentials.';
      console.log('Setting error message:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: SocialProvider) => {
    setError('');
    setLoadingProvider(provider);

    try {
      const redirectUri = `${window.location.origin}/api/auth/callback/${provider}`;
      const response = await socialLoginApi.getAuthorizationUrl(provider, redirectUri, false);
      
      // Store state in sessionStorage for verification
      sessionStorage.setItem('oauth_state', response.state);
      sessionStorage.setItem('oauth_provider', provider);
      sessionStorage.setItem('oauth_redirect_uri', redirectUri);
      
      // Redirect to provider
      window.location.href = response.authorization_url;
    } catch (err: any) {
      console.error('Social login error:', err);
      const errorMessage = err?.response?.data?.detail || 'Failed to initiate social login';
      setError(errorMessage);
      setLoadingProvider(null);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold text-primary">Bakalr CMS</CardTitle>
          <h1 className="text-2xl font-semibold">Sign in to your account</h1>
        </CardHeader>
        <CardContent>
          {/* Social Login Buttons */}
          {socialProviders.length > 0 && (
            <>
              <div className="grid gap-2">
                {socialProviders.map((providerInfo) => {
                  const provider = providerInfo.provider.toLowerCase() as SocialProvider;
                  const info = PROVIDER_INFO[provider];
                  if (!info) return null;
                  
                  return (
                    <Button
                      key={provider}
                      variant="outline"
                      className={`w-full ${info.bgColor} ${info.textColor} border-gray-300`}
                      onClick={() => handleSocialLogin(provider)}
                      disabled={isLoading || loadingProvider !== null}
                    >
                      {loadingProvider === provider ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Connecting...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <ProviderIcon provider={provider} className="h-4 w-4" />
                          Continue with {info.name}
                        </span>
                      )}
                    </Button>
                  );
                })}
              </div>
              
              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading || loadingProvider !== null}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading || loadingProvider !== null}
              />
            </div>
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading || loadingProvider !== null}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Don't have an account?{' '}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
