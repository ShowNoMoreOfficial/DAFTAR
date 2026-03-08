import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, badRequest } from "@/lib/api-utils";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;
  const { content } = await req.json();

  if (!content?.trim()) return badRequest("Comment content is required");

  const comment = await prisma.taskComment.create({
    data: {
      taskId: id,
      authorId: session.user.id,
      content: content.trim(),
    },
    include: {
      author: { select: { id: true, name: true, avatar: true } },
    },
  });

  await prisma.taskActivity.create({
    data: {
      taskId: id,
      actorId: session.user.id,
      action: "commented",
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
