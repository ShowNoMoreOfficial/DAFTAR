"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Zap, TrendingUp, BookOpen, Settings } from "lucide-react";

const tabs = [
  { label: "Overview", href: "/admin/gi", icon: LayoutDashboard, exact: true },
  { label: "Actions", href: "/admin/gi/actions", icon: Zap },
  { label: "Predictions", href: "/admin/gi/predictions", icon: TrendingUp },
  { label: "Learning", href: "/admin/gi/learning", icon: BookOpen },
  { label: "Config", href: "/admin/gi/config", icon: Settings },
];

export default function GILayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b border-[#E5E7EB] bg-white px-6">
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
                  ? "border-[#2E86AB] font-medium text-[#2E86AB]"
                  : "border-transparent text-[#6B7280] hover:text-[#1A1A1A]"
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
