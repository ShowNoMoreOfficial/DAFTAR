"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, GitBranch, CheckSquare, Users, BarChart3 } from "lucide-react";

const tabs = [
  { label: "Dashboard", href: "/m/yantri", icon: LayoutDashboard, exact: true },
  { label: "Narrative Trees", href: "/m/yantri/narrative-trees", icon: GitBranch },
  { label: "Workspace", href: "/m/yantri/workspace", icon: CheckSquare },
  { label: "Brands", href: "/m/yantri/brands", icon: Users },
  { label: "Performance", href: "/m/yantri/performance", icon: BarChart3 },
];

export default function YantriLayout({ children }: { children: React.ReactNode }) {
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
      <div className="flex-1 overflow-auto p-6">{children}</div>
    </div>
  );
}
