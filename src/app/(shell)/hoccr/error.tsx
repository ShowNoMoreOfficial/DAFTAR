"use client";

import { AlertTriangle } from "lucide-react";

export default function HOCCRError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(239,68,68,0.1)]">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          HOCCR encountered an error
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          The HR operations module hit a problem. Your other modules should still work.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-[10px] text-[var(--text-muted)]">
            ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="mt-6 rounded-lg bg-[var(--accent-primary)] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-primary)]/90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
