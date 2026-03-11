import type { Role } from "@prisma/client";

// Default role-permission mapping per spec section 5.3
const ROLE_PERMISSIONS: Record<Role, string[]> = {
  ADMIN: ["admin.*"],
  HEAD_HR: [
    "daftar.read.*",
    "daftar.write.*",
    "hoccr.read.*",
    "hoccr.write.*",
    "pms.read.*",
    "yantri.read.*",
    "users.read.*",
    "users.write.hr",
  ],
  DEPT_HEAD: [
    "daftar.read.*",
    "daftar.write.*",
    "pms.read.department",
    "pms.write.department",
    "yantri.read.department",
    "khabri.read.department",
    "hoccr.read.department",
    "relay.read.department",
    "vritti.read.department",
  ],
  MEMBER: [
    "daftar.read.own",
    "pms.read.own",
    "pms.write.own",
    "yantri.read.own",
    "khabri.read.*",
    "relay.read.own",
    "vritti.read.own",
  ],
  CLIENT: [
    "daftar.read.brand",
    "yantri.read.brand",
    "relay.read.brand",
    "vritti.read.brand",
  ],
  FINANCE: [
    "daftar.read.own",
    "finance.read.*",
    "finance.write.*",
  ],
  CONTRACTOR: [
    "daftar.read.own",
    "pms.read.own",
    "pms.write.own",
  ],
};

export function getDefaultPermissions(role: Role): string[] {
  return ROLE_PERMISSIONS[role] || [];
}

export function hasPermission(
  userRole: Role,
  userPermissions: string[],
  requiredPermission: string
): boolean {
  // Admin has access to everything
  if (userRole === "ADMIN") return true;

  const allPermissions = [
    ...getDefaultPermissions(userRole),
    ...userPermissions,
  ];

  return allPermissions.some((p) => {
    if (p === "admin.*") return true;
    if (p === requiredPermission) return true;

    // Wildcard matching: "yantri.read.*" matches "yantri.read.dashboard"
    const pParts = p.split(".");
    const rParts = requiredPermission.split(".");
    for (let i = 0; i < pParts.length; i++) {
      if (pParts[i] === "*") return true;
      if (pParts[i] !== rParts[i]) return false;
    }
    return pParts.length === rParts.length;
  });
}

export function canAccessModule(
  userRole: Role,
  userPermissions: string[],
  moduleName: string
): boolean {
  return hasPermission(userRole, userPermissions, `${moduleName}.read.own`)
    || hasPermission(userRole, userPermissions, `${moduleName}.read.*`)
    || hasPermission(userRole, userPermissions, `${moduleName}.read.department`)
    || hasPermission(userRole, userPermissions, `${moduleName}.read.brand`);
}
