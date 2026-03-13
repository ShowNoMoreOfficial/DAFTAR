import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
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
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

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
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const feedbacks = await prisma.teamFeedback.findMany({
    include: { user: { select: { name: true, email: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return Response.json(feedbacks);
}
