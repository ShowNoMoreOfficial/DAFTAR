import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, badRequest } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const role = session.user.role;
  if (!["ADMIN", "HEAD_HR", "DEPT_HEAD"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const departmentId = searchParams.get("departmentId");

  const now = new Date();
  const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

  // Scope for DEPT_HEAD
  const deptFilter: Record<string, unknown> =
    role === "DEPT_HEAD" && session.user.primaryDepartmentId
      ? { departmentId: session.user.primaryDepartmentId }
      : departmentId
      ? { departmentId }
      : {};

  // Department averages
  const departments = await prisma.department.findMany({
    where: role === "DEPT_HEAD" && session.user.primaryDepartmentId
      ? { id: session.user.primaryDepartmentId }
      : departmentId
      ? { id: departmentId }
      : undefined,
    select: { id: true, name: true },
  });

  const deptSentiments = await Promise.all(
    departments.map(async (dept) => {
      const entries = await prisma.sentimentEntry.findMany({
        where: { departmentId: dept.id, createdAt: { gte: fourWeeksAgo } },
        select: { score: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      });

      const avgScore =
        entries.length > 0
          ? Math.round((entries.reduce((s, e) => s + e.score, 0) / entries.length) * 10) / 10
          : null;

      // Weekly trends
      const weeks: { week: number; avg: number; count: number }[] = [];
      for (let w = 0; w < 4; w++) {
        const weekStart = new Date(now.getTime() - (w + 1) * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000);
        const weekEntries = entries.filter(
          (e) => e.createdAt >= weekStart && e.createdAt < weekEnd
        );
        const weekAvg =
          weekEntries.length > 0
            ? Math.round(
                (weekEntries.reduce((s, e) => s + e.score, 0) / weekEntries.length) * 10
              ) / 10
            : 0;
        weeks.push({ week: w, avg: weekAvg, count: weekEntries.length });
      }

      // Trend direction
      const thisWeekAvg = weeks[0]?.avg || 0;
      const lastWeekAvg = weeks[1]?.avg || 0;
      const trend =
        thisWeekAvg > lastWeekAvg
          ? "up"
          : thisWeekAvg < lastWeekAvg
          ? "down"
          : "stable";

      return {
        departmentId: dept.id,
        departmentName: dept.name,
        avgScore,
        totalEntries: entries.length,
        trend,
        weeks: weeks.reverse(),
      };
    })
  );

  // Flag departments with declining sentiment
  const declining = deptSentiments.filter((d) => d.trend === "down");

  return NextResponse.json({
    departments: deptSentiments,
    declining,
  });
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { score, notes, isAnonymous } = await req.json();

  if (score === undefined || score < 1 || score > 5) {
    return badRequest("Score must be between 1 and 5");
  }

  // Determine sentiment level from score
  let sentiment: "VERY_NEGATIVE" | "NEGATIVE" | "NEUTRAL" | "POSITIVE" | "VERY_POSITIVE";
  if (score <= 1.5) sentiment = "VERY_NEGATIVE";
  else if (score <= 2.5) sentiment = "NEGATIVE";
  else if (score <= 3.5) sentiment = "NEUTRAL";
  else if (score <= 4.5) sentiment = "POSITIVE";
  else sentiment = "VERY_POSITIVE";

  const entry = await prisma.sentimentEntry.create({
    data: {
      userId: session.user.id,
      departmentId: session.user.primaryDepartmentId || null,
      sentiment,
      score,
      source: "pulse",
      notes: notes || null,
      isAnonymous: isAnonymous || false,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
