import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, badRequest } from "@/lib/api-utils";

// GET /api/notifications/preferences — get current user's notification preferences
export async function GET() {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  let prefs = await prisma.notificationPreference.findUnique({
    where: { userId: session.user.id },
  });

  if (!prefs) {
    // Return default preferences
    prefs = await prisma.notificationPreference.create({
      data: {
        userId: session.user.id,
        preferences: {
          TASK_ASSIGNED: { enabled: true, channels: ["in_app"] },
          TASK_STATUS_CHANGED: { enabled: true, channels: ["in_app"] },
          TASK_COMMENT: { enabled: true, channels: ["in_app"] },
          TASK_OVERDUE: { enabled: true, channels: ["in_app"] },
          APPROVAL_PENDING: { enabled: true, channels: ["in_app"] },
          APPROVAL_COMPLETED: { enabled: true, channels: ["in_app"] },
          DELIVERABLE_READY: { enabled: true, channels: ["in_app"] },
          GI_SUGGESTION: { enabled: true, channels: ["in_app"] },
          SYSTEM: { enabled: true, channels: ["in_app"] },
        },
      },
    });
  }

  return NextResponse.json(prefs);
}

// PUT /api/notifications/preferences — update notification preferences
export async function PUT(req: Request) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const body = await req.json();
  const { preferences, quietHoursStart, quietHoursEnd } = body as {
    preferences?: Record<string, { enabled: boolean; channels: string[] }>;
    quietHoursStart?: string | null;
    quietHoursEnd?: string | null;
  };

  if (!preferences && quietHoursStart === undefined && quietHoursEnd === undefined) {
    return badRequest("Provide preferences or quiet hours to update");
  }

  // Validate quiet hours format if provided
  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (quietHoursStart && !timeRegex.test(quietHoursStart)) {
    return badRequest("quietHoursStart must be in HH:mm format");
  }
  if (quietHoursEnd && !timeRegex.test(quietHoursEnd)) {
    return badRequest("quietHoursEnd must be in HH:mm format");
  }

  const data: Record<string, unknown> = {};
  if (preferences !== undefined) data.preferences = preferences;
  if (quietHoursStart !== undefined) data.quietHoursStart = quietHoursStart;
  if (quietHoursEnd !== undefined) data.quietHoursEnd = quietHoursEnd;

  const prefs = await prisma.notificationPreference.upsert({
    where: { userId: session.user.id },
    update: data,
    create: {
      userId: session.user.id,
      preferences: preferences || {},
      quietHoursStart: quietHoursStart || null,
      quietHoursEnd: quietHoursEnd || null,
    },
  });

  return NextResponse.json(prefs);
}
