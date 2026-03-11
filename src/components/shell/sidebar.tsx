"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/sidebar-store";
import { getSidebarItemsForRole } from "@/lib/sidebar-config";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  CheckSquare,
  Palette,
  Brain,
  Newspaper,
  Send,
  Kanban,
  Users,
  FileText,
  IndianRupee,
  UserCog,
  Sparkles,
  Trophy,
  Calendar,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import type { Role } from "@prisma/client";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  CheckSquare,
  Palette,
  Brain,
  Newspaper,
  Send,
  Kanban,
  Users,
  FileText,
  IndianRupee,
  UserCog,
  Sparkles,
  Trophy,
  Calendar,
  BarChart3,
};

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  HEAD_HR: "Head HR",
  DEPT_HEAD: "Dept Head",
  MEMBER: "Team Member",
  CLIENT: "Client",
  FINANCE: "Finance",
  CONTRACTOR: "Contractor",
};

interface SidebarProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
    role: Role;
  };
  onSignOut: () => void;
}

export function Sidebar({ user, onSignOut }: SidebarProps) {
  const pathname = usePathname();
  const { isCollapsed, isMobileOpen, toggleSidebar, setMobileOpen } =
    useSidebarStore();
  const items = getSidebarItemsForRole(user.role);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  // Close mobile sidebar when window resizes above md breakpoint
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setMobileOpen]);

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          // Base styles
          "z-50 flex h-screen shrink-0 flex-col border-r border-[#E5E7EB] bg-[#F8F9FA] transition-all duration-200",
          // Desktop: inline, collapsible
          "hidden md:relative md:flex",
          isCollapsed ? "md:w-16" : "md:w-[260px]",
          // Mobile: fixed overlay
          isMobileOpen &&
            "fixed inset-y-0 left-0 flex w-[280px] md:relative md:w-auto"
        )}
      >
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-2 top-3 z-10 rounded-lg p-1.5 text-[#6B7280] hover:bg-[#E5E7EB] md:hidden"
        >
          <X className="h-5 w-5" />
        </button>

        {/* User section */}
        <div
          className={cn(
            "flex items-center gap-3 border-b border-[#E5E7EB] p-4",
            isCollapsed && "md:justify-center md:px-2"
          )}
        >
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={user.image || undefined} alt={user.name} />
            <AvatarFallback className="bg-[#2E86AB] text-white text-sm">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {/* On mobile always show text; on desktop hide when collapsed */}
          <div className={cn("min-w-0 flex-1", isCollapsed && "md:hidden")}>
            <p className="truncate text-sm font-medium text-[#1A1A1A]">
              {user.name}
            </p>
            <Badge
              variant="secondary"
              className="mt-0.5 text-[10px] font-normal"
            >
              {ROLE_LABELS[user.role]}
            </Badge>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-0.5">
            {items.map((item) => {
              const Icon = ICON_MAP[item.icon];
              const isActive =
                pathname === item.href ||
                pathname.startsWith(item.href + "/");

              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    title={isCollapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-[#2E86AB]/10 font-medium text-[#2E86AB]"
                        : "text-[#6B7280] hover:bg-[#F0F2F5] hover:text-[#1A1A1A]",
                      isCollapsed && "md:justify-center md:px-2"
                    )}
                  >
                    {Icon && (
                      <Icon
                        className={cn(
                          "h-[18px] w-[18px] shrink-0",
                          isActive ? "text-[#2E86AB]" : "text-[#9CA3AF]"
                        )}
                      />
                    )}
                    {/* On mobile always show label; on desktop hide when collapsed */}
                    <span className={cn(isCollapsed && "md:hidden")}>
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom section */}
        <div className="border-t border-[#E5E7EB] p-2">
          <ul className="space-y-0.5">
            {[
              { icon: Settings, label: "Settings", href: "/settings" },
              { icon: HelpCircle, label: "Help", href: "/help" },
            ].map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#6B7280] transition-colors hover:bg-[#F0F2F5] hover:text-[#1A1A1A]",
                    isCollapsed && "md:justify-center md:px-2"
                  )}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0 text-[#9CA3AF]" />
                  <span className={cn(isCollapsed && "md:hidden")}>
                    {item.label}
                  </span>
                </Link>
              </li>
            ))}
            <li>
              <button
                onClick={onSignOut}
                title={isCollapsed ? "Logout" : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#6B7280] transition-colors hover:bg-red-50 hover:text-red-600",
                  isCollapsed && "md:justify-center md:px-2"
                )}
              >
                <LogOut className="h-[18px] w-[18px] shrink-0 text-[#9CA3AF]" />
                <span className={cn(isCollapsed && "md:hidden")}>Logout</span>
              </button>
            </li>
          </ul>

          {/* Toggle button — desktop only */}
          <button
            onClick={toggleSidebar}
            className="mt-2 hidden w-full items-center justify-center rounded-lg py-1.5 text-[#9CA3AF] transition-colors hover:bg-[#F0F2F5] hover:text-[#6B7280] md:flex"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
