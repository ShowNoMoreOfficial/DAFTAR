import type { Role } from "@prisma/client";

export interface DaftarSession {
  userId: string;
  email: string;
  name: string;
  avatar: string | null;
  role: Role;
  primaryDepartmentId: string | null;
  accessibleBrandIds: string[];
  permissions: string[];
}

export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  roles: Role[];
  children?: SidebarItem[];
}

export interface GIContext {
  currentModule: string;
  currentView: string;
  currentEntityId: string | null;
  currentEntityType: string | null;
  userRole: Role;
  userId: string;
  timestamp: Date;
}

export interface GIAction {
  type: "inform" | "suggest" | "act_notify" | "act_silent";
  actionId: string;
  description: string;
  module: string;
  payload: Record<string, unknown>;
  undoable: boolean;
  expiresAt?: Date;
}
