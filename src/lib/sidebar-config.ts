import type { Role } from "@prisma/client";
import type { SidebarItem } from "@/types";

export interface SidebarSection {
  id: string;
  label: string;           // Section header text (empty = no header, e.g. Dashboard)
  collapsible: boolean;
  items: SidebarItem[];
  roles: Role[];            // Which roles see this section
}

export const SIDEBAR_SECTIONS: SidebarSection[] = [
  // ─── Top: Dashboard (no section header) ───
  {
    id: "top",
    label: "",
    collapsible: false,
    roles: ["ADMIN", "HEAD_HR", "DEPT_HEAD", "MEMBER", "CLIENT", "FINANCE", "CONTRACTOR"],
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: "LayoutDashboard",
        href: "/dashboard",
        roles: ["ADMIN", "HEAD_HR", "DEPT_HEAD", "MEMBER", "CLIENT", "FINANCE", "CONTRACTOR"],
      },
    ],
  },

  // ─── CORE WORKFLOW ───
  {
    id: "workflow",
    label: "",
    collapsible: false,
    roles: ["ADMIN", "DEPT_HEAD", "MEMBER"],
    items: [
      {
        id: "intelligence",
        label: "Intelligence",
        icon: "Radar",
        href: "/intelligence",
        roles: ["ADMIN", "DEPT_HEAD", "MEMBER"],
        children: [
          { id: "intel-signals", label: "Signals", icon: "Radio", href: "/intelligence", roles: ["ADMIN", "DEPT_HEAD", "MEMBER"] },
          { id: "intel-trends", label: "Trends", icon: "TrendingUp", href: "/intelligence?tab=trends", roles: ["ADMIN", "DEPT_HEAD", "MEMBER"] },
          { id: "intel-research", label: "Research", icon: "Search", href: "/intelligence?tab=research", roles: ["ADMIN", "DEPT_HEAD", "MEMBER"] },
        ],
      },
      {
        id: "content-studio",
        label: "Content",
        icon: "PenTool",
        href: "/content-studio",
        roles: ["ADMIN", "DEPT_HEAD", "MEMBER"],
        children: [
          { id: "content-pipeline", label: "Studio", icon: "Layers", href: "/content-studio", roles: ["ADMIN", "DEPT_HEAD", "MEMBER"] },
          { id: "content-production", label: "Production", icon: "Package", href: "/content-studio?tab=production", roles: ["ADMIN", "DEPT_HEAD", "MEMBER"] },
          { id: "content-calendar", label: "Calendar", icon: "Calendar", href: "/content-studio?tab=calendar", roles: ["ADMIN", "DEPT_HEAD", "MEMBER"] },
          { id: "content-library", label: "Library", icon: "Archive", href: "/content-studio?tab=library", roles: ["ADMIN", "DEPT_HEAD", "MEMBER"] },
        ],
      },
      {
        id: "production",
        label: "Production",
        icon: "CheckSquare",
        href: "/pms",
        roles: ["ADMIN", "HEAD_HR", "DEPT_HEAD", "MEMBER", "CONTRACTOR"],
        children: [
          { id: "prod-tasks", label: "Tasks", icon: "Kanban", href: "/pms/board", roles: ["ADMIN", "HEAD_HR", "DEPT_HEAD", "MEMBER", "CONTRACTOR"] },
          { id: "prod-workload", label: "Workload", icon: "Activity", href: "/pms/workload", roles: ["ADMIN", "HEAD_HR", "DEPT_HEAD", "MEMBER"] },
        ],
      },
      {
        id: "publishing",
        label: "Publishing",
        icon: "Send",
        href: "/relay",
        roles: ["ADMIN", "DEPT_HEAD", "MEMBER"],
        children: [
          { id: "pub-schedule", label: "Schedule", icon: "Calendar", href: "/relay/calendar", roles: ["ADMIN", "DEPT_HEAD", "MEMBER"] },
          { id: "pub-connections", label: "Connections", icon: "Link", href: "/relay/connections", roles: ["ADMIN", "DEPT_HEAD"] },
        ],
      },
      {
        id: "ppc",
        label: "Campaigns",
        icon: "Target",
        href: "/ppc",
        roles: ["ADMIN", "DEPT_HEAD", "MEMBER"],
      },
    ],
  },

  // ─── SECONDARY ───
  {
    id: "secondary",
    label: "",
    collapsible: false,
    roles: ["ADMIN", "HEAD_HR", "DEPT_HEAD", "MEMBER", "FINANCE"],
    items: [
      {
        id: "team",
        label: "Team",
        icon: "Users",
        href: "/hoccr",
        roles: ["ADMIN", "HEAD_HR", "DEPT_HEAD"],
      },
      {
        id: "editorial",
        label: "Editorial",
        icon: "FileText",
        href: "/m/vritti",
        roles: ["ADMIN", "DEPT_HEAD", "MEMBER", "CLIENT"],
      },
      {
        id: "finance",
        label: "Finance",
        icon: "IndianRupee",
        href: "/finance",
        roles: ["ADMIN", "FINANCE"],
      },
      {
        id: "communication",
        label: "Communication",
        icon: "MessageCircle",
        href: "/communication",
        roles: ["ADMIN", "HEAD_HR", "DEPT_HEAD", "MEMBER"],
      },
    ],
  },

  // ─── CLIENT-SPECIFIC ───
  {
    id: "client",
    label: "",
    collapsible: false,
    roles: ["CLIENT"],
    items: [
      {
        id: "my-brands",
        label: "My Brands",
        icon: "Palette",
        href: "/brands",
        roles: ["CLIENT"],
      },
      {
        id: "client-review",
        label: "Review",
        icon: "FileCheck",
        href: "/brands?tab=review",
        roles: ["CLIENT"],
      },
      {
        id: "client-calendar",
        label: "Calendar",
        icon: "Calendar",
        href: "/brands?tab=calendar",
        roles: ["CLIENT"],
      },
    ],
  },
];

// Legacy compatibility: flat list for anything that still uses getSidebarItemsForRole
export const SIDEBAR_ITEMS: SidebarItem[] = SIDEBAR_SECTIONS.flatMap((s) => s.items);

export function getSidebarItemsForRole(role: Role): SidebarItem[] {
  return SIDEBAR_ITEMS.filter((item) => item.roles.includes(role));
}

export function getSidebarSectionsForRole(role: Role): SidebarSection[] {
  return SIDEBAR_SECTIONS
    .filter((section) => section.roles.includes(role))
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0);
}
