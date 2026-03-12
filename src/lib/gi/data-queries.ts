import { prisma } from "@/lib/prisma";

// ─── Overdue Tasks ──────────────────────────────────────

export async function getOverdueTasks(limit = 10) {
  const tasks = await prisma.task.findMany({
    where: {
      status: { notIn: ["DONE", "CANCELLED"] },
      dueDate: { lt: new Date() },
    },
    select: {
      id: true,
      title: true,
      dueDate: true,
      status: true,
      priority: true,
      assignee: { select: { id: true, name: true } },
      department: { select: { name: true } },
    },
    orderBy: { dueDate: "asc" },
    take: limit,
  });

  const total = await prisma.task.count({
    where: {
      status: { notIn: ["DONE", "CANCELLED"] },
      dueDate: { lt: new Date() },
    },
  });

  return { tasks, total };
}

// ─── Overloaded Users ───────────────────────────────────

export async function getOverloadedUsers(threshold = 10) {
  const userTaskCounts = await prisma.task.groupBy({
    by: ["assigneeId"],
    where: {
      status: { in: ["ASSIGNED", "IN_PROGRESS", "REVIEW"] },
      assigneeId: { not: null },
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  const overloaded = userTaskCounts.filter((u) => u._count.id > threshold);

  if (overloaded.length === 0) {
    return { users: [], threshold };
  }

  const userIds = overloaded.map((u) => u.assigneeId!);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, primaryDeptId: true },
  });

  const result = overloaded.map((u) => {
    const user = users.find((usr) => usr.id === u.assigneeId);
    return {
      userId: u.assigneeId!,
      name: user?.name || "Unknown",
      activeTasks: u._count.id,
    };
  });

  // Also get everyone's counts for comparison
  const allCounts = userTaskCounts
    .filter((u) => u.assigneeId)
    .slice(0, 10)
    .map((u) => {
      const user = users.find((usr) => usr.id === u.assigneeId);
      return {
        name: user?.name || "User",
        activeTasks: u._count.id,
      };
    });

  return { users: result, allCounts, threshold };
}

// ─── Pending Review Deliverables ────────────────────────

export async function getPendingReviewDeliverables() {
  const deliverables = await prisma.deliverable.findMany({
    where: { status: "REVIEW" },
    select: {
      id: true,
      platform: true,
      pipelineType: true,
      brand: { select: { name: true } },
      tree: { select: { title: true } },
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
    take: 10,
  });

  const total = await prisma.deliverable.count({
    where: { status: "REVIEW" },
  });

  return { deliverables, total };
}

// ─── Team Weekly Stats ──────────────────────────────────

export async function getTeamWeeklyStats() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [completedThisWeek, totalActive, totalXpThisWeek, topStreaks] =
    await Promise.all([
      prisma.task.count({
        where: { status: "DONE", completedAt: { gte: weekAgo } },
      }),
      prisma.task.count({
        where: { status: { in: ["ASSIGNED", "IN_PROGRESS", "REVIEW"] } },
      }),
      prisma.userStreak
        .aggregate({
          _sum: { totalXp: true },
        })
        .then((r) => r._sum.totalXp || 0),
      prisma.userStreak.findMany({
        where: { currentStreak: { gt: 0 } },
        select: {
          user: { select: { name: true } },
          currentStreak: true,
        },
        orderBy: { currentStreak: "desc" },
        take: 3,
      }),
    ]);

  return {
    completedThisWeek,
    totalActive,
    totalXpThisWeek,
    topStreaks: topStreaks.map((s) => ({
      name: s.user.name || "Unknown",
      streak: s.currentStreak,
    })),
  };
}

// ─── Recent Signals ─────────────────────────────────────

export async function getRecentSignals(days = 7, limit = 10) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const signals = await prisma.signal.findMany({
    where: { detectedAt: { gte: since }, isDuplicate: false },
    select: {
      id: true,
      title: true,
      source: true,
      eventType: true,
      sentiment: true,
      detectedAt: true,
      trend: { select: { name: true, lifecycle: true } },
    },
    orderBy: { detectedAt: "desc" },
    take: limit,
  });

  const total = await prisma.signal.count({
    where: { detectedAt: { gte: since }, isDuplicate: false },
  });

  return { signals, total };
}

// ─── Brand Content Pipeline ─────────────────────────────

export async function getBrandContentPipeline(brandName: string) {
  const brand = await prisma.brand.findFirst({
    where: { name: { contains: brandName, mode: "insensitive" } },
    select: { id: true, name: true },
  });

  if (!brand) {
    return { brand: null, trees: [], deliverables: [], stats: null };
  }

  const [trees, deliverables] = await Promise.all([
    prisma.narrativeTree.findMany({
      where: {
        deliverables: { some: { brandId: brand.id } },
      },
      select: {
        id: true,
        title: true,
        status: true,
        urgency: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.deliverable.findMany({
      where: { brandId: brand.id },
      select: {
        id: true,
        platform: true,
        status: true,
        pipelineType: true,
        tree: { select: { title: true } },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
  ]);

  // Group deliverables by status
  const stats = deliverables.reduce(
    (acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return { brand, trees, deliverables, stats };
}

// ─── Team Members ───────────────────────────────────────

export async function getTeamMembers() {
  const users = await prisma.user.findMany({
    where: { role: { not: "CLIENT" }, isActive: true },
    select: {
      id: true,
      name: true,
      role: true,
      departments: {
        select: { department: { select: { name: true } } },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  return {
    members: users.map((u) => ({
      name: u.name,
      role: u.role,
      department: u.departments[0]?.department.name || "Unassigned",
    })),
    total: users.length,
  };
}

// ─── Unprocessed Signals (not linked to NarrativeTree) ──

export async function getUnprocessedSignals() {
  // Signals whose trend has no NarrativeTree linked
  const total = await prisma.signal.count({
    where: {
      isDuplicate: false,
      trend: {
        NOT: {
          id: {
            in: (
              await prisma.narrativeTree.findMany({
                where: { trendId: { not: null } },
                select: { trendId: true },
              })
            )
              .map((t) => t.trendId)
              .filter(Boolean) as string[],
          },
        },
      },
    },
  });

  return { total };
}

// ─── Upcoming Content ───────────────────────────────────

export async function getUpcomingContent(limit = 5) {
  const posts = await prisma.contentPost.findMany({
    where: {
      status: { in: ["SCHEDULED", "QUEUED"] },
      scheduledAt: { gte: new Date() },
    },
    select: {
      id: true,
      title: true,
      platform: true,
      scheduledAt: true,
      brand: { select: { name: true } },
    },
    orderBy: { scheduledAt: "asc" },
    take: limit,
  });

  return { posts };
}
