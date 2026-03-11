import type { Metadata } from "next";
import { ExternalLink, BookOpen, MessageCircle, Bug } from "lucide-react";

export const metadata: Metadata = { title: "Help" };

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Help & Support</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Resources to help you get the most out of Daftar.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          {
            icon: BookOpen,
            title: "Getting Started",
            description: "Learn the basics of navigating Daftar, managing tasks, and using modules.",
            color: "bg-[rgba(59,130,246,0.1)] text-[var(--accent-primary)]",
          },
          {
            icon: MessageCircle,
            title: "Keyboard Shortcuts",
            description: "Ctrl+K to search, Escape to close panels, and more.",
            color: "bg-[rgba(16,185,129,0.1)] text-emerald-600",
          },
          {
            icon: Bug,
            title: "Report an Issue",
            description: "Found a bug? Let us know so we can fix it.",
            color: "bg-[rgba(239,68,68,0.1)] text-red-500",
          },
          {
            icon: ExternalLink,
            title: "Contact Admin",
            description: "Reach out to your organization admin for account or access issues.",
            color: "bg-[rgba(245,158,11,0.1)] text-amber-600",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 transition-shadow hover:shadow-sm"
          >
            <div className={`inline-flex rounded-lg p-2 ${item.color}`}>
              <item.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-[var(--text-primary)]">{item.title}</h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
