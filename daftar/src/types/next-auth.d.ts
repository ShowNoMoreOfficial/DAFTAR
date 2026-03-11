import type { Role } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
      role: Role;
      primaryDepartmentId: string | null;
      accessibleBrandIds: string[];
      permissions: string[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    role: Role;
    primaryDepartmentId: string | null;
    accessibleBrandIds: string[];
    permissions: string[];
  }
}
