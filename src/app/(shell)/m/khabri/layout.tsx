"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, TrendingUp, Radio, GitBranch, Globe2, BarChart3 } from "lucide-react";

const tabs = [
  { label: "Dashboard", href: "/m/khabri", icon: LayoutDashboard, exact: true },
  { label: "Trends", href: "/m/khabri/trends", icon: TrendingUp },
  { label: "Signals", href: "/m/khabri/signals", icon: Radio },
  { label: "Narratives", href: "/m/khabri/narratives", icon: GitBranch },
  { label: "Geo Intel", href: "/m/khabri/geo", icon: Globe2 },
  { label: "Analytics", href: "/m/khabri/analytics", icon: BarChart3 },
];

export default function KhabriLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6">
        {tabs.map((tab) => {
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname === tab.href || pathname.startsWith(tab.href + "/");
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
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
