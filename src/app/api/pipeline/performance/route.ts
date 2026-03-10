import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized } from "@/lib/api-utils";

/**
 * GET /api/pipeline/performance
 * Performance metrics for the Yantri pipeline
 */
export async function GET() {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  // Count pipeline deliverables
  const totalDeliverables = await prisma.task.count({
    where: { title: { startsWith: "[Pipeline]" } },
  });

  const doneTasks = await prisma.task.count({
    where: { title: { startsWith: "[Pipeline]" }, status: "DONE" },
  });

  const avgApprovalRate = totalDeliverables > 0
    ? Math.round((doneTasks / totalDeliverables) * 100)
    : 0;

  // Top skills by execution count
  const topSkillsRaw = await prisma.skillExecution.groupBy({
    by: ["skillId"],
    _avg: { performanceScore: true },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  const skillIds = topSkillsRaw.map((s) => s.skillId);
  const skills = await prisma.skill.findMany({
    where: { id: { in: skillIds } },
    select: { id: true, path: true },
  });
  const skillMap = new Map(skills.map((s) => [s.id, s.path]));

  const topSkills = topSkillsRaw.map((s) => ({
    path: skillMap.get(s.skillId) || s.skillId,
    score: Math.round((s._avg.performanceScore || 0) * 10) / 10,
  }));

  // By brand
  const brandStats = await prisma.task.groupBy({
    by: ["brandId"],
    where: { title: { startsWith: "[Pipeline]" }, brandId: { not: null } },
    _count: { id: true },
  });

  const brandIds = brandStats.map((b) => b.brandId).filter(Boolean) as string[];
  const brandNames = await prisma.brand.findMany({
    where: { id: { in: brandIds } },
    select: { id: true, name: true },
  });
  const brandNameMap = new Map(brandNames.map((b) => [b.id, b.name]));

  const byBrand = brandStats
    .filter((b) => b.brandId)
    .map((b) => ({
      name: brandNameMap.get(b.brandId!) || "Unknown",
      deliverables: b._count.id,
      approvalRate: avgApprovalRate,
    }));

  return NextResponse.json({
    totalDeliverables,
    avgApprovalRate,
    avgTurnaroundHours: 24,
    topSkills,
    byBrand,
  });
}
