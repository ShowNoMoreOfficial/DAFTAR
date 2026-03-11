"use client";

import { AlertTriangle } from "lucide-react";

export default function ShellError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold text-[#1A1A1A]">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-[#6B7280]">
          This page encountered an error. Your other pages should still work.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-[10px] text-[#9CA3AF]">
            ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="mt-6 rounded-lg bg-[#2E86AB] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2E86AB]/90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
