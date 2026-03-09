import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, forbidden } from "@/lib/api-utils";

// GET /api/config/modules — list all modules
export async function GET() {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const modules = await prisma.module.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(modules);
}

// PATCH /api/config/modules — update a module's baseUrl
export async function PATCH(req: Request) {
  const session = await getAuthSession();
  if (!session) return unauthorized();
  if (session.user.role !== "ADMIN") return forbidden();

  const { name, baseUrl } = await req.json();
  if (!name || !baseUrl) {
    return NextResponse.json({ error: "name and baseUrl are required" }, { status: 400 });
  }

  const mod = await prisma.module.update({
    where: { name },
    data: { baseUrl },
  });

  return NextResponse.json(mod);
}
