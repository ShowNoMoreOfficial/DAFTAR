import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { apiHandler } from "@/lib/api-handler";

export const PATCH = apiHandler(async (req: NextRequest, { session }) => {
  if (session.user.role !== "ADMIN") {
    return Response.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json();
  const { id, status, adminNote } = body;

  const updated = await prisma.teamFeedback.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(adminNote !== undefined && { adminNote }),
    },
  });

  return Response.json(updated);
});

export const POST = apiHandler(async (req: NextRequest, { session }) => {
  const body = await req.json();

  const feedback = await prisma.teamFeedback.create({
    data: {
      userId: session.user.id,
      type: body.type,
      message: body.message,
      page: body.page || "/",
      rating: body.rating ?? null,
      metadata: {
        userAgent: body.userAgent,
        viewport: body.viewport,
        timestamp: body.timestamp,
        deliverableId: body.deliverableId,
      },
    },
  });

  return Response.json({ id: feedback.id, status: "received" });
});

export const GET = apiHandler(async (_req, { session }) => {
  if (session.user.role !== "ADMIN") {
    return Response.json({ error: "Admin access required" }, { status: 403 });
  }

  const feedbacks = await prisma.teamFeedback.findMany({
    include: { user: { select: { name: true, email: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return Response.json(feedbacks);
});
