'use client';

import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-8">
      <AlertTriangle className="h-10 w-10 text-amber-400" />
      <h2 className="text-xl font-semibold text-[var(--text-primary)]">Something went wrong</h2>
      <p className="text-sm text-[var(--text-secondary)] text-center max-w-md">
        {error.message || 'An unexpected error occurred.'}
      </p>
      {error.digest && (
        <p className="text-xs text-[var(--text-muted)]">Error ID: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="mt-2 px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white hover:opacity-90 transition-opacity"
      >
        Try again
      </button>
    </div>
  );
}
