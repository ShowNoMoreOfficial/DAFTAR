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
import { Search, Settings, LogOut, User } from "lucide-react";
import { CommandSearch } from "./command-search";
import { NotificationBell } from "./notification-bell";

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
    yantri: "Yantri",
    khabri: "Khabri",
    relay: "Relay",
    pms: "PMS",
    board: "Board",
    list: "List",
    workload: "Workload",
    hoccr: "HOCCR",
    hiring: "Hiring",
    vritti: "Vritti",
    finance: "Finance",
    admin: "Admin",
    users: "Users & Roles",
    gi: "GI Config",
    settings: "Settings",
    reports: "Reports",
    calendar: "Calendar",
    leaderboard: "Leaderboard",
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#E5E7EB] bg-white px-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm">
          {breadcrumb.map((crumb, i) => (
            <span key={crumb.href} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-[#9CA3AF]">/</span>}
              <span
                className={
                  i === breadcrumb.length - 1
                    ? "font-medium text-[#1A1A1A]"
                    : "text-[#6B7280]"
                }
              >
                {crumb.label}
              </span>
            </span>
          ))}
        </nav>

        {/* Center: Search */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-[#F8F9FA] px-3 py-1.5 text-sm text-[#9CA3AF] transition-colors hover:bg-[#F0F2F5]"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search...</span>
          <kbd className="ml-4 rounded bg-[#E5E7EB] px-1.5 py-0.5 font-mono text-[10px] text-[#6B7280]">
            Ctrl+K
          </kbd>
        </button>

        {/* Right: Notifications + Avatar */}
        <div className="flex items-center gap-3">
          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full outline-none">
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarImage src={user.image || undefined} alt={user.name} />
                <AvatarFallback className="bg-[#2E86AB] text-white text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-[#6B7280]">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSignOut} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
