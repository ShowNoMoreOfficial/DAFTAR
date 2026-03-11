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
  MessageCircle,
  Building2,
  Building,
  BookOpen,
  Cloud,
  ShieldCheck,
  TrendingUp,
  Radio,
  GitBranch,
  Globe2,
  ListOrdered,
  Activity,
  Heart,
  UserPlus,
  Clock,
  Layers,
  Zap,
  Package,
  Tag,
  Image,
} from "lucide-react";
import type { Role } from "@prisma/client";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
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
  MessageCircle,
  Building2,
  Building,
  BookOpen,
  Cloud,
  ShieldCheck,
  TrendingUp,
  Radio,
  GitBranch,
  Globe2,
  ListOrdered,
  Activity,
  Heart,
  UserPlus,
  Clock,
  Layers,
  Zap,
  Package,
  Tag,
  Image,
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
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          // Base styles — Abyss sidebar
          "z-50 flex h-screen shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--sidebar-bg)] transition-all duration-300",
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
          {/* On mobile always show text; on desktop hide when collapsed */}
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
                      "flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm transition-all duration-150",
                      isActive
                        ? "border-l-[3px] border-l-[var(--accent-primary)] bg-[rgba(0,212,170,0.08)] font-medium text-[var(--accent-primary)]"
                        : "border-l-[3px] border-l-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] hover:translate-x-0.5",
                      isCollapsed && "md:justify-center md:border-l-0 md:px-2"
                    )}
                  >
                    {Icon && (
                      <Icon
                        className={cn(
                          "h-5 w-5 shrink-0",
                          isActive ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)]"
                        )}
                        strokeWidth={1.5}
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
        <div className="border-t border-[var(--border-subtle)] p-2">
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
                    "flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm text-[var(--text-secondary)] transition-all duration-150 hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]",
                    isCollapsed && "md:justify-center md:px-2"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0 text-[var(--text-muted)]" strokeWidth={1.5} />
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
                  "flex w-full items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm text-[var(--text-secondary)] transition-all duration-150 hover:bg-[rgba(239,68,68,0.1)] hover:text-[var(--status-error)]",
                  isCollapsed && "md:justify-center md:px-2"
                )}
              >
                <LogOut className="h-5 w-5 shrink-0 text-[var(--text-muted)]" strokeWidth={1.5} />
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
