import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] p-6">
      <div className="max-w-md text-center">
        <p className="text-6xl font-bold text-[#2E86AB]">404</p>
        <h1 className="mt-4 text-xl font-semibold text-[#1A1A1A]">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-[#6B7280]">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-lg bg-[#2E86AB] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2E86AB]/90"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
