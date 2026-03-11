"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Dashboard", href: "/m/yantri" },
  { label: "Narrative Trees", href: "/m/yantri/narrative-trees" },
  { label: "Workspace", href: "/m/yantri/workspace" },
  { label: "Dossiers", href: "/m/yantri/dossiers" },
  { label: "Deliverables", href: "/m/yantri/deliverables" },
  { label: "Content Types", href: "/m/yantri/content-types" },
  { label: "Brands", href: "/m/yantri/brands" },
  { label: "Performance", href: "/m/yantri/performance" },
];

export default function YantriLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="p-6">
      <nav className="flex gap-1 border-b border-[#E5E7EB] mb-6">
        {TABS.map((tab) => {
          const isActive = tab.href === "/m/yantri"
            ? pathname === "/m/yantri"
            : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                isActive
                  ? "border-[#2E86AB] text-[#2E86AB]"
                  : "border-transparent text-[#6B7280] hover:text-[#1A1A1A] hover:border-[#E5E7EB]"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
