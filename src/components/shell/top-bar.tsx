"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Settings, LogOut, User, Menu, Plus } from "lucide-react";
import { CommandSearch } from "./command-search";
import { NotificationBell } from "./notification-bell";
import { QuickCreateModal } from "./quick-create-modal";
import { useSidebarStore } from "@/store/sidebar-store";

interface TopBarProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
  onSignOut: () => void;
}

function buildBreadcrumb(pathname: string): { label: string; href: string }[] {
  const parts = pathname.split("/").filter(Boolean);
  const crumbs = [{ label: "Daftar", href: "/" }];

  const labels: Record<string, string> = {
    m: "",
    dashboard: "Dashboard",
    tasks: "My Tasks",
    brands: "Brands",
    yantri: "Content Studio",
    khabri: "Intelligence",
    relay: "Publishing",
    pms: "Production",
    board: "Board",
    list: "List",
    workload: "Workload",
    hoccr: "Team & HR",
    hiring: "Hiring",
    vritti: "Editorial",
    finance: "Finance",
    admin: "Admin",
    users: "Users & Roles",
    gi: "GI Intelligence",
    settings: "Settings",
    reports: "Reports",
    calendar: "Calendar",
    leaderboard: "Leaderboard",
    trends: "Trends",
    signals: "Signals",
    narratives: "Narratives",
    geo: "Geo Intel",
    analytics: "Analytics",
    departments: "Departments",
    clients: "Clients & Brands",
    skills: "Skills",
    communication: "Communication",
    credibility: "Credibility",
    workspace: "Workspace",
    performance: "Performance",
    operations: "Operations",
    culture: "Culture",
    queue: "Queue",
    articles: "Articles",
    pipeline: "Pipeline",
    media: "Media",
    categories: "Categories",
    "narrative-trees": "Narrative Trees",
    "prompt-library": "Prompts",
    "platform-rules": "Platform Rules",
    history: "History",
    actions: "Actions",
    predictions: "Predictions",
    learning: "Learning",
    config: "Config",
    notifications: "Notifications",
    help: "Help",
    portal: "Client Portal",
    invoices: "Invoices",
    expenses: "Expenses",
  };

  let href = "";
  for (const part of parts) {
    href += `/${part}`;
    const label = labels[part];
    if (label !== undefined && label !== "") {
      crumbs.push({ label, href });
    }
  }

  return crumbs;
}

export function TopBar({ user, onSignOut }: TopBarProps) {
  const pathname = usePathname();
  const breadcrumb = buildBreadcrumb(pathname);
  const [searchOpen, setSearchOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const { setMobileOpen } = useSidebarStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        setCreateOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="flex h-14 shrink-0 items-center border-b border-[var(--border-subtle)] bg-[var(--bg-deep)] px-3 md:px-6">
        {/* Left: Hamburger (mobile) + Breadcrumb */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <nav className="hidden items-center gap-1.5 text-sm md:flex">
          {breadcrumb.map((crumb, i) => (
            <span key={crumb.href} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-[var(--text-muted)]">/</span>}
              <span
                className={
                  i === breadcrumb.length - 1
                    ? "font-medium text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)]"
                }
              >
                {crumb.label}
              </span>
            </span>
          ))}
          </nav>
        </div>

        {/* Spacer pushes right section to the end */}
        <div className="flex-1" />

        {/* Right: Search + Create + Notifications + Avatar */}
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1.5 text-sm text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:border-[var(--accent-primary)] md:px-3"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="ml-4 hidden rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)] sm:inline">
              Ctrl+K
            </kbd>
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            title="Create new (Ctrl+N)"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-primary)] text-[var(--text-inverse)] transition-all hover:opacity-90 hover:shadow-[0_0_12px_rgba(0,212,170,0.3)]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </button>

          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full outline-none">
              <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-transparent hover:ring-[var(--accent-primary)] transition-all">
                <AvatarImage src={user.image || undefined} alt={user.name} />
                <AvatarFallback className="bg-[var(--accent-primary)] text-[var(--text-inverse)] text-xs font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-50 w-48 bg-[var(--bg-overlay)] border-[var(--border-default)]">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-[var(--text-primary)]">{user.name}</p>
                <p className="text-xs text-[var(--text-secondary)]">{user.email}</p>
              </div>
              <DropdownMenuSeparator className="bg-[var(--border-subtle)]" />
              <DropdownMenuItem onClick={() => window.location.href = "/settings"} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:bg-[var(--bg-elevated)] focus:text-[var(--text-primary)]">
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = "/settings"} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:bg-[var(--bg-elevated)] focus:text-[var(--text-primary)]">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[var(--border-subtle)]" />
              <DropdownMenuItem onClick={onSignOut} className="text-[var(--status-error)] focus:bg-[rgba(239,68,68,0.1)] focus:text-[var(--status-error)]">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <QuickCreateModal open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
