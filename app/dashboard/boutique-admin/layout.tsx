'use client';

import { useRequireAuth } from '@/hooks/use-require-auth';

/**
 * Boutique Admin Layout
 * 
 * This is a pass-through layout for boutique admin pages.
 * Navigation is handled by the main dashboard sidebar.
 * Role-based access control can be added here in the future.
 */
export default function BoutiqueAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useRequireAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Simple pass-through - navigation is in main dashboard sidebar
  return <>{children}</>;
}
