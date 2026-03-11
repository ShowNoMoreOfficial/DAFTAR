import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, forbidden } from "@/lib/api-utils";

// GET /api/skills — List all skills with optional filtering
export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();
  if (!["ADMIN", "DEPT_HEAD"].includes(session.user.role)) return forbidden();

  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("domain");
  const module = searchParams.get("module");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = { isActive: true };
  if (domain) where.domain = domain;
  if (module) where.module = module;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { path: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const skills = await prisma.skill.findMany({
    where,
    include: {
      _count: { select: { executions: true, learningLogs: true } },
    },
    orderBy: [{ domain: "asc" }, { name: "asc" }],
  });

  // Group by domain for the UI
  const domains = [...new Set(skills.map((s) => s.domain))];
  const grouped = domains.map((d) => ({
    domain: d,
    skills: skills.filter((s) => s.domain === d),
  }));

  return NextResponse.json({
    skills,
    grouped,
    total: skills.length,
    domains,
  });
}
