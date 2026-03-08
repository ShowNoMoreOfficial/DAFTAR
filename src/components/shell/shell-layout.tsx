"use client";

import { signOut } from "next-auth/react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { RightPanel } from "./right-panel";
import { useSidebarStore } from "@/store/sidebar-store";
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";

interface ShellLayoutProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
    role: Role;
  };
  children: React.ReactNode;
}

export function ShellLayout({ user, children }: ShellLayoutProps) {
  const { isCollapsed } = useSidebarStore();

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar user={user} onSignOut={handleSignOut} />

      <div
        className={cn(
          "flex flex-1 flex-col overflow-hidden transition-all duration-300",
          isCollapsed ? "ml-0" : "ml-0"
        )}
      >
        <TopBar user={user} onSignOut={handleSignOut} />

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      <RightPanel />
    </div>
  );
}
