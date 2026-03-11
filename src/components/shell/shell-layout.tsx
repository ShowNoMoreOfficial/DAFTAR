"use client";

import { signOut } from "next-auth/react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { RightPanel } from "./right-panel";
import { GIAssistant } from "@/components/gi/gi-assistant";
import { NotificationProvider } from "@/components/providers/notification-provider";
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
    <NotificationProvider>
      <div className="relative flex h-screen overflow-hidden bg-white">
        <Sidebar user={user} onSignOut={handleSignOut} />

        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar user={user} onSignOut={handleSignOut} />

          <main className="flex-1 overflow-y-auto p-3 md:p-6">
            {children}
          </main>
        </div>

        <RightPanel />
        <GIAssistant />
      </div>
    </NotificationProvider>
  );
}
