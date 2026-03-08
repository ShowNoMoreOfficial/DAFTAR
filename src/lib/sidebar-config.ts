import type { Role } from "@prisma/client";
import type { SidebarItem } from "@/types";

export const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "LayoutDashboard",
    href: "/dashboard",
    roles: ["ADMIN", "HEAD_HR", "DEPT_HEAD", "MEMBER", "CLIENT", "FINANCE", "CONTRACTOR"],
  },
  {
    id: "my-tasks",
    label: "My Tasks",
    icon: "CheckSquare",
    href: "/tasks",
    roles: ["MEMBER", "CONTRACTOR"],
  },
  {
    id: "my-brands",
    label: "My Brands",
    icon: "Palette",
    href: "/brands",
    roles: ["CLIENT"],
  },
  {
    id: "yantri",
    label: "Yantri",
    icon: "Brain",
    href: "/m/yantri",
    roles: ["ADMIN", "HEAD_HR", "DEPT_HEAD", "MEMBER"],
  },
  {
    id: "khabri",
    label: "Khabri",
    icon: "Newspaper",
    href: "/m/khabri",
    roles: ["ADMIN", "DEPT_HEAD", "MEMBER"],
  },
  {
    id: "relay",
    label: "Relay",
    icon: "Send",
    href: "/m/relay",
    roles: ["ADMIN", "DEPT_HEAD", "MEMBER", "CLIENT"],
  },
  {
    id: "pms",
    label: "PMS",
    icon: "Kanban",
    href: "/pms",
    roles: ["ADMIN", "HEAD_HR", "DEPT_HEAD", "MEMBER", "CONTRACTOR"],
  },
  {
    id: "hoccr",
    label: "HOCCR",
    icon: "Users",
    href: "/hoccr",
    roles: ["ADMIN", "HEAD_HR", "DEPT_HEAD"],
  },
  {
    id: "vritti",
    label: "Vritti",
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
    id: "users",
    label: "Users & Roles",
    icon: "UserCog",
    href: "/admin/users",
    roles: ["ADMIN", "HEAD_HR"],
  },
  {
    id: "gi-config",
    label: "GI Config",
    icon: "Sparkles",
    href: "/admin/gi",
    roles: ["ADMIN"],
  },
  {
    id: "leaderboard",
    label: "Leaderboard",
    icon: "Trophy",
    href: "/leaderboard",
    roles: ["MEMBER"],
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: "Calendar",
    href: "/calendar",
    roles: ["ADMIN", "DEPT_HEAD", "MEMBER", "CLIENT"],
  },
  {
    id: "reports",
    label: "Reports",
    icon: "BarChart3",
    href: "/reports",
    roles: ["ADMIN", "HEAD_HR", "DEPT_HEAD", "CLIENT", "FINANCE"],
  },
];

export function getSidebarItemsForRole(role: Role): SidebarItem[] {
  return SIDEBAR_ITEMS.filter((item) => item.roles.includes(role));
}
