'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { authApi } from '@/lib/api/auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Mail, X, Loader2 } from 'lucide-react';

export function EmailVerificationBanner() {
  const { user } = useAuth();
  const [isHidden, setIsHidden] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Don't show banner if user is verified or banner is hidden
  if (!user || user.is_email_verified || isHidden) {
    return null;
  }

  const handleResendVerification = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const result = await authApi.resendVerification();
      setMessage({ type: 'success', text: result.message });
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to send verification email' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
        <Mail className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <AlertDescription className="text-yellow-900 dark:text-yellow-100">
              <strong>Verify your email address</strong> to access all features.
              {!message && (
                <>
                  {' '}Check your inbox for the verification link or{' '}
                  <button
                    onClick={handleResendVerification}
                    disabled={loading}
                    className="font-semibold underline hover:no-underline disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'resend verification email'}
                  </button>
                  .
                </>
              )}
            </AlertDescription>
            
            {message && (
              <AlertDescription 
                className={message.type === 'error' 
                  ? 'text-red-600 dark:text-red-400 mt-2' 
                  : 'text-green-600 dark:text-green-400 mt-2'
                }
              >
                {message.text}
              </AlertDescription>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsHidden(true)}
            className="h-6 w-6 p-0 text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>
      </Alert>
    </div>
  );
}
