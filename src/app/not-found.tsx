import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-abyss)] p-6">
      <div className="max-w-md text-center">
        <p className="text-6xl font-bold text-[var(--accent-primary)]">404</p>
        <h1 className="mt-4 text-xl font-semibold text-[var(--text-primary)]">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-lg bg-[var(--accent-primary)] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-primary)]/90"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
