'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (token) {
      verifyEmail();
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      const result = await authApi.verifyEmail(token);
      setStatus('success');
      setMessage(result.message);
      if (result.email) {
        setEmail(result.email);
      }
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: any) {
      setStatus('error');
      setMessage(error.response?.data?.detail || 'Failed to verify email. The link may be invalid or expired.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'loading' && (
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            )}
            {status === 'error' && (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === 'loading' && 'Verifying Your Email...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we verify your email address'}
            {status === 'success' && `Your email ${email} has been successfully verified`}
            {status === 'error' && 'We couldn\'t verify your email address'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {message && (
            <Alert variant={status === 'error' ? 'destructive' : 'default'}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  ✅ What's Next?
                </h3>
                <ul className="text-sm text-green-800 dark:text-green-200 space-y-1 list-disc list-inside">
                  <li>You can now access all platform features</li>
                  <li>Your account is fully activated</li>
                  <li>You'll receive important notifications</li>
                </ul>
              </div>
              
              <p className="text-sm text-muted-foreground text-center">
                Redirecting you to login in 3 seconds...
              </p>
              
              <Button 
                onClick={() => router.push('/login')} 
                className="w-full"
              >
                Go to Login Now
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                  💡 Troubleshooting
                </h3>
                <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1 list-disc list-inside">
                  <li>The verification link may have expired (valid for 24 hours)</li>
                  <li>The link may have already been used</li>
                  <li>Try requesting a new verification email</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={() => router.push('/login')}
                  variant="outline"
                  className="flex-1"
                >
                  Back to Login
                </Button>
                <Button 
                  onClick={() => router.push('/dashboard')}
                  className="flex-1"
                >
                  Go to Dashboard
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                You can request a new verification email from your account settings
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
