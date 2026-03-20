import { NextResponse } from "next/server";
import { getAuthSession, unauthorized, forbidden } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

// GET — load content schedules from brand config
export async function GET() {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  try {
    const brands = await prisma.brand.findMany({
      select: { id: true, slug: true, config: true },
    });

    const schedules: Record<string, unknown> = {};
    for (const brand of brands) {
      const config = (brand.config as Record<string, unknown>) || {};
      if (config.contentSchedule) {
        schedules[brand.slug] = config.contentSchedule;
      }
    }

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error("Failed to load content schedules:", error);
    return NextResponse.json({ schedules: {} });
  }
}

// PUT — save content schedules to brand config
export async function PUT(req: Request) {
  const session = await getAuthSession();
  if (!session) return unauthorized();
  const allowedRoles = ["ADMIN", "HEAD_HR", "DEPT_HEAD"];
  if (!allowedRoles.includes(session.user.role)) return forbidden();

  try {
    const { schedules } = await req.json();

    for (const [slug, schedule] of Object.entries(schedules as Record<string, Record<string, unknown>>)) {
      const brand = await prisma.brand.findFirst({ where: { slug } });
      if (!brand) continue;

      const existing = (brand.config as Record<string, unknown>) || {};
      const updated = JSON.parse(JSON.stringify({ ...existing, contentSchedule: schedule }));
      await prisma.brand.update({
        where: { id: brand.id },
        data: { config: updated },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save content schedules:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
