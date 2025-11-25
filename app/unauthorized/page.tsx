'use client';

export default function Unauthorized() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold text-destructive">403</h1>
      <h2 className="text-2xl font-semibold">Access Denied</h2>
      <p className="text-muted-foreground max-w-md text-center">
        You don't have permission to access this resource.
      </p>
      <a
        href="/dashboard"
        className="mt-4 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Go to Dashboard
      </a>
    </div>
  );
}
