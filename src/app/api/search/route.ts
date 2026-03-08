import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized } from "@/lib/api-utils";

// GET /api/search?q=...
export async function GET(req: Request) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q || q.length < 2) {
    return NextResponse.json({ users: [], brands: [], modules: [], tasks: [] });
  }

  const role = session.user.role;
  const userId = session.user.id;

  const [users, brands, modules, tasks] = await Promise.all([
    // Only Admin/HEAD_HR can search users
    ["ADMIN", "HEAD_HR"].includes(role)
      ? prisma.user.findMany({
          where: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          },
          select: { id: true, name: true, email: true, role: true, avatar: true },
          take: 5,
        })
      : Promise.resolve([]),

    prisma.brand.findMany({
      where: {
        AND: [
          { name: { contains: q, mode: "insensitive" } },
          role !== "ADMIN"
            ? { userAccess: { some: { userId } } }
            : {},
        ],
      },
      select: { id: true, name: true, slug: true },
      take: 5,
    }),

    prisma.module.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { displayName: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, displayName: true, icon: true },
      take: 5,
    }),

    // Tasks — scoped by role
    prisma.task.findMany({
      where: {
        title: { contains: q, mode: "insensitive" },
        ...(role === "ADMIN"
          ? {}
          : role === "DEPT_HEAD"
          ? { department: { headId: userId } }
          : { OR: [{ assigneeId: userId }, { creatorId: userId }] }),
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        assignee: { select: { name: true } },
      },
      take: 5,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return NextResponse.json({ users, brands, modules, tasks });
}
