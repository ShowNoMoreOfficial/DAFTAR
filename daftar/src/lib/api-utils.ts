import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { Role } from "@prisma/client";

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function badRequest(message = "Bad request") {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function getAuthSession() {
  const session = await auth();
  if (!session?.user) return null;
  return session;
}

export function requireRoles(...roles: Role[]) {
  return async () => {
    const session = await getAuthSession();
    if (!session) return null;
    if (!roles.includes(session.user.role)) return null;
    return session;
  };
}
