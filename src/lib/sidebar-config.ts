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

  // ─── CONTENT ───
  {
    id: "content",
    label: "Content",
    collapsible: true,
    roles: ["ADMIN", "DEPT_HEAD", "MEMBER"],
    items: [
      {
        id: "khabri",
        label: "Khabri",
        icon: "Newspaper",
        href: "/m/khabri",
        roles: ["ADMIN", "DEPT_HEAD", "MEMBER"],
        children: [
          { id: "khabri-dashboard", label: "Dashboard", icon: "LayoutDashboard", href: "/m/khabri", roles: ["ADMIN", "DEPT_HEAD", "MEMBER"] },
          { id: "khabri-trends", label: "Trends", icon: "TrendingUp", href: "/m/khabri/trends", roles: ["ADMIN", "DEPT_HEAD", "MEMBER"] },
          { id: "khabri-signals", label: "Signals", icon: "Radio", href: "/m/khabri/signals", roles: ["ADMIN", "DEPT_HEAD", "MEMBER"] },
          { id: "khabri-narratives", label: "Narratives", icon: "GitBranch", href: "/m/khabri/narratives", roles: ["ADMIN", "DEPT_HEAD", "MEMBER"] },
          { id: "khabri-geo", label: "Geo Intel", icon: "Globe2", href: "/m/khabri/geo", roles: ["ADMIN", "DEPT_HEAD", "MEMBER"] },
          { id: "khabri-analytics", label: "Analytics", icon: "BarChart3", href: "/m/khabri/analytics", roles: ["ADMIN", "DEPT_HEAD", "MEMBER"] },
        ],
      },
      {
        id: "yantri",
        label: "Yantri",
        icon: "Brain",
        href: "/m/yantri",
        roles: ["ADMIN", "DEPT_HEAD", "MEMBER"],
        children: [
          { id: "yantri-dashboard", label: "Dashboard", icon: "LayoutDashboard", href: "/m/yantri", roles: ["ADMIN", "DEPT_HEAD", "MEMBER"] },
          { id: "yantri-narrative-trees", label: "Narrative Trees", icon: "GitBranch", href: "/m/yantri/narrative-trees", roles: ["ADMIN", "DEPT_HEAD", "MEMBER"] },
          { id: "yantri-trends", label: "Trends", icon: "TrendingUp", href: "/m/yantri/trends", roles: ["ADMIN", "DEPT_HEAD", "MEMBER"] },
          { id: "yantri-workspace", label: "Workspace", icon: "Layers", href: "/m/yantri/workspace", roles: ["ADMIN", "DEPT_HEAD", "MEMBER"] },
          { id: "yantri-prompts", label: "Prompts", icon: "FileText", href: "/m/yantri/prompt-library", roles: ["ADMIN", "DEPT_HEAD"] },
          { id: "yantri-platform-rules", label: "Platform Rules", icon: "Settings2", href: "/m/yantri/platform-rules", roles: ["ADMIN"] },
          { id: "yantri-history", label: "History", icon: "Clock", href: "/m/yantri/history", roles: ["ADMIN", "DEPT_HEAD", "MEMBER"] },
          { id: "yantri-performance", label: "Performance", icon: "BarChart3", href: "/m/yantri/performance", roles: ["ADMIN", "DEPT_HEAD"] },
        ],
      },
      {
        id: "vritti",
        label: "Vritti",
        icon: "FileText",
        href: "/m/vritti",
        roles: ["ADMIN", "DEPT_HEAD", "MEMBER", "CLIENT"],
        children: [
          { id: "vritti-pipeline", label: "Pipeline", icon: "Kanban", href: "/m/vritti/pipeline", roles: ["ADMIN", "DEPT_HEAD", "MEMBER"] },
          { id: "vritti-articles", label: "Articles", icon: "FileText", href: "/m/vritti/articles", roles: ["ADMIN", "DEPT_HEAD", "MEMBER", "CLIENT"] },
          { id: "vritti-media", label: "Media", icon: "Image", href: "/m/vritti/media", roles: ["ADMIN", "DEPT_HEAD", "MEMBER"] },
          { id: "vritti-categories", label: "Categories", icon: "Tag", href: "/m/vritti/categories", roles: ["ADMIN", "DEPT_HEAD"] },
        ],
      },
      {
        id: "relay",
        label: "Relay",
        icon: "Send",
        href: "/relay",
        roles: ["ADMIN", "DEPT_HEAD", "MEMBER"],
        children: [
          { id: "relay-queue", label: "Queue", icon: "ListOrdered", href: "/relay/queue", roles: ["ADMIN", "DEPT_HEAD", "MEMBER"] },
          { id: "relay-calendar", label: "Calendar", icon: "Calendar", href: "/relay/calendar", roles: ["ADMIN", "DEPT_HEAD", "MEMBER", "CLIENT"] },
          { id: "relay-analytics", label: "Analytics", icon: "BarChart3", href: "/relay/analytics", roles: ["ADMIN", "DEPT_HEAD", "MEMBER", "CLIENT"] },
        ],
      },
    ],
  },

  // ─── OPERATIONS ───
  {
    id: "operations",
    label: "Operations",
    collapsible: true,
    roles: ["ADMIN", "HEAD_HR", "DEPT_HEAD", "MEMBER", "CONTRACTOR"],
    items: [
      {
        id: "pms",
        label: "PMS",
        icon: "Kanban",
        href: "/pms",
        roles: ["ADMIN", "HEAD_HR", "DEPT_HEAD", "MEMBER", "CONTRACTOR"],
      },
      {
        id: "leaderboard",
        label: "Leaderboard",
        icon: "Trophy",
        href: "/leaderboard",
        roles: ["ADMIN", "DEPT_HEAD", "MEMBER"],
      },
      {
        id: "credibility",
        label: "Credibility",
        icon: "ShieldCheck",
        href: "/credibility",
        roles: ["ADMIN", "HEAD_HR", "DEPT_HEAD", "MEMBER", "CONTRACTOR"],
      },
      {
        id: "reports",
        label: "Reports",
        icon: "BarChart3",
        href: "/reports",
        roles: ["ADMIN", "HEAD_HR", "DEPT_HEAD", "CLIENT", "FINANCE"],
      },
    ],
  },

  // ─── ORGANIZATION ───
  {
    id: "organization",
    label: "Organization",
    collapsible: true,
    roles: ["ADMIN", "HEAD_HR", "DEPT_HEAD", "MEMBER", "FINANCE"],
    items: [
      {
        id: "hoccr",
        label: "HOCCR",
        icon: "Users",
        href: "/hoccr",
        roles: ["ADMIN", "HEAD_HR", "DEPT_HEAD"],
        children: [
          { id: "hr-operations", label: "Operations", icon: "Activity", href: "/hoccr/operations", roles: ["ADMIN", "HEAD_HR", "DEPT_HEAD"] },
          { id: "hr-culture", label: "Culture", icon: "Heart", href: "/hoccr/culture", roles: ["ADMIN", "HEAD_HR", "DEPT_HEAD"] },
          { id: "hr-hiring", label: "Hiring", icon: "UserPlus", href: "/hoccr/hiring", roles: ["ADMIN", "HEAD_HR", "DEPT_HEAD"] },
          { id: "hr-reports", label: "Reports", icon: "BarChart3", href: "/hoccr/reports", roles: ["ADMIN", "HEAD_HR", "DEPT_HEAD"] },
        ],
      },
      {
        id: "communication",
        label: "Communication",
        icon: "MessageCircle",
        href: "/communication",
        roles: ["ADMIN", "HEAD_HR", "DEPT_HEAD", "MEMBER"],
      },
      {
        id: "finance",
        label: "Finance",
        icon: "IndianRupee",
        href: "/finance",
        roles: ["ADMIN", "FINANCE"],
      },
    ],
  },

  // ─── ADMIN ───
  {
    id: "admin",
    label: "Admin",
    collapsible: true,
    roles: ["ADMIN", "HEAD_HR"],
    items: [
      {
        id: "users",
        label: "Users & Roles",
        icon: "UserCog",
        href: "/admin/users",
        roles: ["ADMIN", "HEAD_HR"],
      },
      {
        id: "departments",
        label: "Departments",
        icon: "Building2",
        href: "/admin/departments",
        roles: ["ADMIN"],
      },
      {
        id: "clients-brands",
        label: "Clients & Brands",
        icon: "Building",
        href: "/admin/clients",
        roles: ["ADMIN", "FINANCE"],
      },
      {
        id: "skills",
        label: "Skills",
        icon: "BookOpen",
        href: "/admin/skills",
        roles: ["ADMIN"],
        children: [
          { id: "skills-list", label: "All Skills", icon: "BookOpen", href: "/admin/skills", roles: ["ADMIN"] },
          { id: "skills-performance", label: "Performance", icon: "BarChart3", href: "/admin/skills/performance", roles: ["ADMIN"] },
        ],
      },
      {
        id: "gi-config",
        label: "GI Intelligence",
        icon: "Sparkles",
        href: "/admin/gi",
        roles: ["ADMIN"],
        children: [
          { id: "gi-overview", label: "Overview", icon: "LayoutDashboard", href: "/admin/gi", roles: ["ADMIN"] },
          { id: "gi-actions", label: "Actions", icon: "Zap", href: "/admin/gi/actions", roles: ["ADMIN"] },
          { id: "gi-predictions", label: "Predictions", icon: "TrendingUp", href: "/admin/gi/predictions", roles: ["ADMIN"] },
          { id: "gi-learning", label: "Learning", icon: "Brain", href: "/admin/gi/learning", roles: ["ADMIN"] },
          { id: "gi-autonomy", label: "Config", icon: "Settings2", href: "/admin/gi/config", roles: ["ADMIN"] },
        ],
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
