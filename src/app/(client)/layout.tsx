import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Portal — Daftar",
  description: "Review and approve deliverables",
};

export default function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg-surface)]">
      {/* Minimal header */}
      <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-primary)]">
              <span className="text-xs font-bold text-white">D</span>
            </div>
            <span className="text-sm font-semibold text-[var(--text-primary)]">Daftar</span>
            <span className="text-xs text-[var(--text-muted)]">Client Portal</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] py-6">
        <p className="text-center text-xs text-[var(--text-muted)]">
          Powered by Daftar — ShowNoMore OS
        </p>
      </footer>
    </div>
  );
}
