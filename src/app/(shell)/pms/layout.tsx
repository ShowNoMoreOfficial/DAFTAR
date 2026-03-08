"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Kanban, List, BarChart3, Trophy } from "lucide-react";

const tabs = [
  { label: "Board", href: "/pms/board", icon: Kanban },
  { label: "List", href: "/pms/list", icon: List },
  { label: "Workload", href: "/pms/workload", icon: BarChart3 },
  { label: "Gamification", href: "/pms/gamification", icon: Trophy },
];

export default function PMSLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      {/* Tab navigation */}
      <div className="flex items-center gap-1 border-b border-[#E5E7EB] bg-white px-6">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
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

      {/* Content */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
