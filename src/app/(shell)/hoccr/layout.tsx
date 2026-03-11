"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Users, BarChart3, Activity, Heart, Brain, Megaphone } from "lucide-react";

const tabs = [
  { label: "Operations", href: "/hoccr/operations", icon: Activity },
  { label: "Culture", href: "/hoccr/culture", icon: Heart },
  { label: "Intelligence", href: "/hoccr/intelligence", icon: Brain },
  { label: "Communication", href: "/hoccr/communication", icon: Megaphone },
  { label: "Hiring", href: "/hoccr/hiring", icon: Users },
  { label: "Reports", href: "/hoccr/reports", icon: BarChart3 },
];

export default function HOCCRLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm transition-colors",
                isActive
                  ? "border-[#2E86AB] font-medium text-[var(--accent-primary)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
