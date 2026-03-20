"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/sidebar-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Radio,
  PenSquare,
  GitBranch,
  CalendarDays,
  Settings,
  Users,
  FileEdit,
  TrendingUp,
  DollarSign,
  MessageCircle,
  Trophy,
  BarChart3,
  Globe,
  FolderOpen,
  ChevronDown,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  MoreHorizontal,
} from "lucide-react";
import type { Role } from "@prisma/client";
import type { LucideIcon } from "lucide-react";

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  HEAD_HR: "Head HR",
  DEPT_HEAD: "Dept Head",
  MEMBER: "Team Member",
  CLIENT: "Client",
  FINANCE: "Finance",
  CONTRACTOR: "Contractor",
};

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

// Main navigation — always visible
const mainNav: NavItem[] = [
  { label: "Feed", href: "/feed", icon: Radio },
  { label: "Create", href: "/create", icon: PenSquare },
  { label: "Pipeline", href: "/pipeline", icon: GitBranch },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Settings", href: "/settings", icon: Settings },
];

// "More" section — collapsed by default
const moreNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Team & HR", href: "/hoccr/operations", icon: Users },
  { label: "Editorial", href: "/m/vritti/pipeline", icon: FileEdit },
  { label: "Trend Tracker", href: "/intelligence?tab=trends", icon: TrendingUp },
  { label: "Finance", href: "/finance", icon: DollarSign },
  { label: "Communication", href: "/communication", icon: MessageCircle },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { label: "Analytics", href: "/intelligence?tab=research", icon: BarChart3 },
  { label: "Geo Intel", href: "/m/khabri/geo", icon: Globe },
  { label: "Files", href: "/files", icon: FolderOpen },
];

// Client role — simplified
const clientNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Files", href: "/files", icon: FolderOpen },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
];

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
  const [moreOpen, setMoreOpen] = useState(false);

  const isClient = user.role === "CLIENT";
  const navItems = isClient ? clientNav : mainNav;

  // Check if an href matches current location
  const isActive = useCallback(
    (href: string) => {
      const [hrefPath, hrefQuery] = href.split("?");
      if (hrefQuery) {
        return pathname === hrefPath;
      }
      return pathname === href || pathname.startsWith(href + "/");
    },
    [pathname]
  );

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  // Close mobile sidebar when window resizes above md breakpoint
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) setMobileOpen(false);
    };
    handleChange(mql);
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, [setMobileOpen]);

  const renderLink = (item: NavItem) => {
    const active = isActive(item.href);
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          title={isCollapsed ? item.label : undefined}
          className={cn(
            "flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm transition-all duration-150",
            active
              ? "border-l-[3px] border-l-[var(--accent-primary)] bg-[rgba(0,212,170,0.08)] font-medium text-[var(--accent-primary)]"
              : "border-l-[3px] border-l-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]",
            isCollapsed && "md:justify-center md:border-l-0 md:px-2"
          )}
        >
          <item.icon
            className={cn(
              "h-[18px] w-[18px] shrink-0",
              active ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)]"
            )}
            strokeWidth={1.5}
          />
          <span className={cn("truncate", isCollapsed && "md:hidden")}>
            {item.label}
          </span>
        </Link>
      </li>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "z-50 flex h-screen shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--sidebar-bg)] transition-all duration-300",
          "hidden md:relative md:flex",
          isCollapsed ? "md:w-16" : "md:w-[260px]",
          isMobileOpen &&
            "fixed inset-y-0 left-0 flex w-[280px] md:relative md:w-auto"
        )}
      >
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-2 top-3 z-10 rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)] md:hidden"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Logo / Brand area */}
        <div
          className={cn(
            "flex items-center border-b border-[var(--border-subtle)] px-4 py-5",
            isCollapsed && "md:justify-center md:px-2"
          )}
        >
          <span
            className={cn(
              "text-lg font-bold tracking-tight text-[var(--accent-primary)]",
              isCollapsed && "md:hidden"
            )}
            style={{ textShadow: "0 0 10px rgba(0, 212, 170, 0.3)" }}
          >
            DAFTAR
          </span>
          {isCollapsed && (
            <span
              className="hidden text-lg font-bold text-[var(--accent-primary)] md:block"
              style={{ textShadow: "0 0 10px rgba(0, 212, 170, 0.3)" }}
            >
              D
            </span>
          )}
        </div>

        {/* User section */}
        <div
          className={cn(
            "flex items-center gap-3 border-b border-[var(--border-subtle)] p-4",
            isCollapsed && "md:justify-center md:px-2"
          )}
        >
          <Avatar className="h-9 w-9 shrink-0 ring-2 ring-transparent hover:ring-[var(--accent-primary)] transition-all">
            <AvatarImage src={user.image || undefined} alt={user.name} />
            <AvatarFallback className="bg-[var(--accent-primary)] text-[var(--text-inverse)] text-sm font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className={cn("min-w-0 flex-1", isCollapsed && "md:hidden")}>
            <p className="truncate text-sm font-medium text-[var(--text-primary)]">
              {user.name}
            </p>
            <Badge
              variant="secondary"
              className="mt-0.5 border-0 bg-[var(--bg-elevated)] text-[10px] font-normal text-[var(--text-secondary)]"
            >
              {ROLE_LABELS[user.role]}
            </Badge>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navItems.map(renderLink)}
          </ul>

          {/* More section — only for non-client roles */}
          {!isClient && (
            <>
              <div className="my-3 h-px bg-[var(--border-default)]" />

              <button
                onClick={() => setMoreOpen(!moreOpen)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors",
                  isCollapsed && "md:justify-center md:px-2"
                )}
              >
                <MoreHorizontal className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
                <span className={cn("flex-1 text-left", isCollapsed && "md:hidden")}>More</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    moreOpen ? "rotate-180" : "",
                    isCollapsed && "md:hidden"
                  )}
                />
              </button>

              {moreOpen && !isCollapsed && (
                <ul className="ml-2 mt-1 space-y-1">
                  {moreNav.map((item) => {
                    const hrefBase = item.href.split("?")[0];
                    const active = pathname.startsWith(hrefBase);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm transition-all duration-150",
                            active
                              ? "border-l-[3px] border-l-[var(--accent-primary)] bg-[rgba(0,212,170,0.08)] font-medium text-[var(--accent-primary)]"
                              : "border-l-[3px] border-l-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                          )}
                        >
                          <item.icon
                            className={cn(
                              "h-[18px] w-[18px] shrink-0",
                              active ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)]"
                            )}
                            strokeWidth={1.5}
                          />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-[var(--border-subtle)] p-2">
          <ul className="space-y-0.5">
            <li>
              <button
                onClick={onSignOut}
                title={isCollapsed ? "Logout" : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm text-[var(--text-secondary)] transition-all duration-150 hover:bg-[rgba(239,68,68,0.1)] hover:text-[var(--status-error)]",
                  isCollapsed && "md:justify-center md:px-2"
                )}
              >
                <LogOut className="h-[18px] w-[18px] shrink-0 text-[var(--text-muted)]" strokeWidth={1.5} />
                <span className={cn(isCollapsed && "md:hidden")}>Logout</span>
              </button>
            </li>
          </ul>

          {/* Toggle button — desktop only */}
          <button
            onClick={toggleSidebar}
            className="mt-2 hidden w-full items-center justify-center rounded-[var(--radius)] py-1.5 text-[var(--text-muted)] transition-all duration-150 hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)] md:flex"
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
