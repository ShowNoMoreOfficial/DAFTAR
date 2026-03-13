"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { RightPanel } from "./right-panel";
import { ContentPipelineBreadcrumb } from "./content-pipeline-breadcrumb";
import { GIAssistant } from "@/components/gi/gi-assistant";
import { FeedbackWidget } from "@/components/feedback/feedback-widget";
import { NotificationProvider } from "@/components/providers/notification-provider";
import { useSidebarStore } from "@/store/sidebar-store";
import { useGIContext } from "@/components/gi/gi-context";
import type { Role } from "@prisma/client";

// Map top-level path segments to GI module names
const PATH_TO_MODULE: Record<string, string> = {
  dashboard: "daftar",
  intelligence: "intelligence",
  "content-studio": "content",
  tasks: "pms",
  pms: "pms",
  relay: "relay",
  hoccr: "hoccr",
  finance: "finance",
  communication: "communication",
  brands: "client-portal",
  admin: "admin",
  settings: "admin",
  calendar: "calendar",
  leaderboard: "gamification",
  credibility: "gamification",
  reports: "analytics",
};

// Entity detection patterns
const ENTITY_PATTERNS: Array<{ match: (p: string[]) => boolean; type: string; idIndex: number }> = [
  { match: (p) => p[0] === "pms" && !!p[1], type: "task", idIndex: 1 },
  { match: (p) => p[0] === "m" && p[1] === "yantri" && p[2] === "narrative-trees" && !!p[3], type: "narrative-tree", idIndex: 3 },
  { match: (p) => p[0] === "m" && p[1] === "yantri" && p[2] === "brands" && !!p[3], type: "brand", idIndex: 3 },
  { match: (p) => p[0] === "m" && p[1] === "khabri" && p[2] === "signals" && !!p[3], type: "signal", idIndex: 3 },
];

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
  const pathname = usePathname();
  const { updateContext } = useGIContext();

  // Update GI context when pathname changes
  useEffect(() => {
    const parts = pathname.split("/").filter(Boolean);

    let module = "daftar";
    let view = "dashboard";
    let entityId: string | null = null;
    let entityType: string | null = null;

    if (parts[0] === "m" && parts[1]) {
      module = parts[1];
      view = parts[2] || "dashboard";
    } else if (parts[0]) {
      module = PATH_TO_MODULE[parts[0]] || parts[0];
      view = parts[1] || "dashboard";
    }

    for (const pattern of ENTITY_PATTERNS) {
      if (pattern.match(parts)) {
        entityType = pattern.type;
        entityId = parts[pattern.idIndex];
        break;
      }
    }

    updateContext({
      currentModule: module,
      currentView: view,
      currentEntityId: entityId,
      currentEntityType: entityType,
    });
  }, [pathname, updateContext]);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <NotificationProvider>
      <div className="relative flex h-screen overflow-hidden bg-[var(--bg-abyss)]">
        <Sidebar user={user} onSignOut={handleSignOut} />

        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar user={user} onSignOut={handleSignOut} />

          <main className="flex-1 overflow-y-auto p-3 pb-24 md:p-6 md:pb-28">
            <ContentPipelineBreadcrumb />
            {children}
          </main>
        </div>

        <RightPanel />
        <FeedbackWidget />
        <GIAssistant />
      </div>
    </NotificationProvider>
  );
}
