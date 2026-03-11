import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, badRequest } from "@/lib/api-utils";
import { notifyTaskComment } from "@/lib/notifications";

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

  // Notify task creator and assignee about the comment
  const task = await prisma.task.findUnique({
    where: { id },
    select: { title: true, creatorId: true, assigneeId: true },
  });
  if (task) {
    const notifyIds = new Set(
      [task.creatorId, task.assigneeId].filter(
        (uid): uid is string => !!uid && uid !== session.user.id
      )
    );
    for (const uid of notifyIds) {
      notifyTaskComment(uid, task.title, id, session.user.name).catch(() => {});
    }
  }

  return NextResponse.json(comment, { status: 201 });
}
