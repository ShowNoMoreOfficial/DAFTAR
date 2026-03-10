import { NextResponse } from "next/server";
import { getAuthSession, unauthorized, forbidden } from "@/lib/api-utils";
import type { Role } from "@prisma/client";

/**
 * GET /api/hoccr/intelligence/charts
 *
 * Returns mocked time-series data for:
 * - Company Velocity: tasks completed per week over the last 8 weeks
 * - Department Capacity: percentage workload per department
 */
export async function GET() {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const allowedRoles: Role[] = ["ADMIN", "HEAD_HR", "DEPT_HEAD"];
  if (!allowedRoles.includes(session.user.role as Role)) {
    return forbidden();
  }

  // Generate week labels for the last 8 weeks
  const weekLabels: string[] = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    weekLabels.push(
      d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    );
  }

  const companyVelocity = [
    { week: weekLabels[0], tasks: 18 },
    { week: weekLabels[1], tasks: 24 },
    { week: weekLabels[2], tasks: 21 },
    { week: weekLabels[3], tasks: 30 },
    { week: weekLabels[4], tasks: 27 },
    { week: weekLabels[5], tasks: 35 },
    { week: weekLabels[6], tasks: 32 },
    { week: weekLabels[7], tasks: 38 },
  ];

  const departmentCapacity = [
    { department: "Editorial", capacity: 72, headcount: 5 },
    { department: "Production", capacity: 88, headcount: 4 },
    { department: "Design", capacity: 65, headcount: 3 },
    { department: "Growth", capacity: 45, headcount: 3 },
    { department: "Tech", capacity: 91, headcount: 4 },
    { department: "Finance", capacity: 30, headcount: 2 },
    { department: "HR & Admin", capacity: 55, headcount: 2 },
  ];

  return NextResponse.json({
    companyVelocity,
    departmentCapacity,
    summary: {
      avgWeeklyVelocity: Math.round(
        companyVelocity.reduce((s, w) => s + w.tasks, 0) /
          companyVelocity.length
      ),
      velocityTrend:
        companyVelocity[companyVelocity.length - 1].tasks >
        companyVelocity[companyVelocity.length - 2].tasks
          ? "up"
          : "down",
      avgCapacity: Math.round(
        departmentCapacity.reduce((s, d) => s + d.capacity, 0) /
          departmentCapacity.length
      ),
      overloadedDepts: departmentCapacity.filter((d) => d.capacity > 85)
        .length,
    },
  });
}
