"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { useSidebarStore } from "@/store/sidebar-store";
import { getSidebarSectionsForRole } from "@/lib/sidebar-config";
import type { SidebarSection } from "@/lib/sidebar-config";
import type { SidebarItem } from "@/types";
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
  Settings2,
  HelpCircle,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  MessageCircle,
  Building2,
  Building,
  BookOpen,
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
  FileCheck,
  ChevronDown,
  ChevronRight,
  Radar,
  PenTool,
  Archive,
  Link2,
  Search,
  Target,
  FolderOpen,
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
  Settings2,
  MessageCircle,
  Building2,
  Building,
  BookOpen,
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
  Radar,
  PenTool,
  Archive,
  Link: Link2,
  Search,
  FileCheck,
  Target,
  FolderOpen,
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
  const searchParams = useSearchParams();
  const { isCollapsed, isMobileOpen, toggleSidebar, setMobileOpen } =
    useSidebarStore();
  const sections = useMemo(() => getSidebarSectionsForRole(user.role), [user.role]);

  // Track which sections are collapsed
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  // Track which items have children expanded
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Helper: check if an href (possibly with ?query) matches current location
  const isHrefActive = useCallback(
    (href: string) => {
      const [hrefPath, hrefQuery] = href.split("?");
      if (hrefQuery) {
        // href has query params — match path exactly and check params
        if (pathname !== hrefPath) return false;
        const hrefParams = new URLSearchParams(hrefQuery);
        for (const [key, value] of hrefParams) {
          if (searchParams.get(key) !== value) return false;
        }
        return true;
      }
      // No query params — match path exactly or as prefix
      return pathname === href || pathname.startsWith(href + "/");
    },
    [pathname, searchParams]
  );

  // Auto-expand item whose child is active
  useEffect(() => {
    const toExpand: string[] = [];
    for (const section of sections) {
      for (const item of section.items) {
        if (item.children) {
          const childActive = item.children.some((c) => isHrefActive(c.href));
          if (childActive) {
            toExpand.push(item.id);
          }
        }
      }
    }
    if (toExpand.length > 0) {
      setExpandedItems((prev) => {
        const allPresent = toExpand.every((id) => prev.has(id));
        if (allPresent) return prev; // no change — skip re-render
        const next = new Set(prev);
        toExpand.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [pathname, searchParams, sections, isHrefActive]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  // Close mobile sidebar when window resizes above md breakpoint
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        setMobileOpen(false);
      }
    };
    // Check immediately on mount
    handleChange(mql);
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, [setMobileOpen]);

  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const toggleItem = useCallback((itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const renderItem = (item: SidebarItem, depth = 0) => {
    const Icon = ICON_MAP[item.icon];
    const isActive = isHrefActive(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);

    return (
      <li key={item.id}>
        <div className="flex items-center">
          <Link
            href={item.href}
            title={isCollapsed ? item.label : undefined}
            className={cn(
              "flex flex-1 items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm transition-all duration-150",
              depth > 0 && "ml-4 pl-3",
              isActive
                ? "border-l-[3px] border-l-[var(--accent-primary)] bg-[rgba(0,212,170,0.08)] font-medium text-[var(--accent-primary)]"
                : "border-l-[3px] border-l-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]",
              isCollapsed && depth === 0 && "md:justify-center md:border-l-0 md:px-2"
            )}
          >
            {Icon && (
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0",
                  isActive ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)]"
                )}
                strokeWidth={1.5}
              />
            )}
            <span className={cn("truncate", isCollapsed && depth === 0 && "md:hidden")}>
              {item.label}
            </span>
          </Link>
          {hasChildren && !isCollapsed && (
            <button
              onClick={() => toggleItem(item.id)}
              className="mr-1 rounded p-1 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)]"
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
        {hasChildren && isExpanded && !isCollapsed && (
          <ul className="mt-0.5 space-y-0.5">
            {item.children!.filter((c) => c.roles.includes(user.role)).map((child) => renderItem(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  const renderSection = (section: SidebarSection) => {
    const isSectionCollapsed = collapsedSections.has(section.id);
    const hasLabel = section.label.length > 0;

    return (
      <div key={section.id} className={cn(hasLabel && "mt-4")}>
        {/* Section header */}
        {hasLabel && !isCollapsed && (
          <button
            onClick={() => section.collapsible && toggleSection(section.id)}
            className={cn(
              "flex w-full items-center justify-between px-3 py-1.5",
              section.collapsible && "cursor-pointer hover:opacity-80"
            )}
          >
            <span className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--text-muted)]">
              {section.label}
            </span>
            {section.collapsible && (
              <ChevronDown
                className={cn(
                  "h-3 w-3 text-[var(--text-muted)] transition-transform duration-200",
                  isSectionCollapsed && "-rotate-90"
                )}
              />
            )}
          </button>
        )}

        {/* Section items */}
        {(!isSectionCollapsed || !hasLabel) && (
          <ul className="space-y-0.5">
            {section.items.map((item) => renderItem(item))}
          </ul>
        )}
      </div>
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

        {/* Navigation — grouped sections */}
        <nav className="flex-1 overflow-y-auto p-2">
          {sections.map(renderSection)}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-[var(--border-subtle)] p-2">
          <ul className="space-y-0.5">
            {[
              { icon: Settings, label: "Settings", href: "/settings" },
            ].map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm text-[var(--text-secondary)] transition-all duration-150 hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]",
                    isCollapsed && "md:justify-center md:px-2"
                  )}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0 text-[var(--text-muted)]" strokeWidth={1.5} />
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
