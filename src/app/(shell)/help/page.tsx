import { ExternalLink, BookOpen, MessageCircle, Bug } from "lucide-react";

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">Help & Support</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Resources to help you get the most out of Daftar.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          {
            icon: BookOpen,
            title: "Getting Started",
            description: "Learn the basics of navigating Daftar, managing tasks, and using modules.",
            color: "bg-blue-50 text-[#2E86AB]",
          },
          {
            icon: MessageCircle,
            title: "Keyboard Shortcuts",
            description: "Ctrl+K to search, Escape to close panels, and more.",
            color: "bg-emerald-50 text-emerald-600",
          },
          {
            icon: Bug,
            title: "Report an Issue",
            description: "Found a bug? Let us know so we can fix it.",
            color: "bg-red-50 text-red-500",
          },
          {
            icon: ExternalLink,
            title: "Contact Admin",
            description: "Reach out to your organization admin for account or access issues.",
            color: "bg-amber-50 text-amber-600",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-[#E5E7EB] bg-white p-5 transition-shadow hover:shadow-sm"
          >
            <div className={`inline-flex rounded-lg p-2 ${item.color}`}>
              <item.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-[#1A1A1A]">{item.title}</h3>
            <p className="mt-1 text-xs text-[#6B7280]">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
