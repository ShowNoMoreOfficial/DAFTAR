'use client';

import { AlertTriangle } from 'lucide-react';

export default function CreateError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="rounded-xl bg-[var(--bg-elevated)] border border-red-500/20 p-8 text-center space-y-4">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Something went wrong
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          {error.message || 'An unexpected error occurred in the Create page.'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-medium hover:opacity-90 transition"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
