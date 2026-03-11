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
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Minimal header */}
      <header className="border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2E86AB]">
              <span className="text-xs font-bold text-white">D</span>
            </div>
            <span className="text-sm font-semibold text-[#1A1A1A]">Daftar</span>
            <span className="text-xs text-[#9CA3AF]">Client Portal</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>

      {/* Footer */}
      <footer className="border-t border-[#E5E7EB] bg-white py-6">
        <p className="text-center text-xs text-[#9CA3AF]">
          Powered by Daftar — ShowNoMore OS
        </p>
      </footer>
    </div>
  );
}
