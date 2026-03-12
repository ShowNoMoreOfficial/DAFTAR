/**
 * Demo Data Cleanup Script
 * ========================
 * Removes all demo/fake data while preserving real team accounts,
 * brands, departments, and configuration.
 *
 * Run: npx tsx scripts/cleanup-demo-data.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Real team emails — NEVER delete these
const KEEP_EMAILS = [
  "lavan@shownomore.com",
  "parth@shownomore.com",
  "sudhanshu@shownomore.com",
  "deepaks@shownomore.com",
  "muskan@shownomore.com",
  "stallone@shownomore.com",
  "thesquirrels@shownomore.com",
  "shownomoreofficial@gmail.com",
];

async function main() {
  console.log("Cleaning up demo data...\n");

  // Find demo users (anyone not in the keep list)
  const demoUsers = await prisma.user.findMany({
    where: { email: { notIn: KEEP_EMAILS } },
    select: { id: true, email: true, name: true },
  });

  console.log(`Found ${demoUsers.length} demo users to remove:`);
  for (const u of demoUsers) {
    console.log(`  - ${u.name} (${u.email})`);
  }

  const demoUserIds = demoUsers.map((u) => u.id);

  if (demoUserIds.length > 0) {
    // 1. Delete task-related data for demo users
    const demoTasks = await prisma.task.findMany({
      where: { OR: [{ creatorId: { in: demoUserIds } }, { assigneeId: { in: demoUserIds } }] },
      select: { id: true },
    });
    const demoTaskIds = demoTasks.map((t) => t.id);

    if (demoTaskIds.length > 0) {
      await prisma.taskTag.deleteMany({ where: { taskId: { in: demoTaskIds } } });
      await prisma.taskComment.deleteMany({ where: { taskId: { in: demoTaskIds } } });
      await prisma.taskActivity.deleteMany({ where: { taskId: { in: demoTaskIds } } });
      await prisma.task.deleteMany({ where: { id: { in: demoTaskIds } } });
      console.log(`\nDeleted ${demoTaskIds.length} demo tasks`);
    }

    // Also clean up comments/activities by demo users on other tasks
    await prisma.taskComment.deleteMany({ where: { authorId: { in: demoUserIds } } });
    await prisma.taskActivity.deleteMany({ where: { actorId: { in: demoUserIds } } });

    // 2. Delete notifications for demo users
    await prisma.notification.deleteMany({ where: { userId: { in: demoUserIds } } });

    // 3. Delete gamification data
    await prisma.userStreak.deleteMany({ where: { userId: { in: demoUserIds } } });
    await prisma.userAchievement.deleteMany({ where: { userId: { in: demoUserIds } } });
    try {
      await prisma.credibilityScore.deleteMany({ where: { userId: { in: demoUserIds } } });
    } catch { /* table may not exist */ }

    // 4. Delete HOCCR data
    try {
      await prisma.gIMotivationProfile.deleteMany({ where: { userId: { in: demoUserIds } } });
    } catch { /* table may not exist */ }
    try {
      await prisma.employeeProfile.deleteMany({ where: { userId: { in: demoUserIds } } });
    } catch { /* table may not exist */ }

    // 5. Delete department memberships
    await prisma.departmentMember.deleteMany({ where: { userId: { in: demoUserIds } } });

    // 6. Delete brand access
    await prisma.userBrandAccess.deleteMany({ where: { userId: { in: demoUserIds } } });

    // 7. Delete auth data
    await prisma.account.deleteMany({ where: { userId: { in: demoUserIds } } });
    await prisma.session.deleteMany({ where: { userId: { in: demoUserIds } } });

    // 8. Delete demo users
    await prisma.user.deleteMany({ where: { id: { in: demoUserIds } } });
    console.log(`Deleted ${demoUsers.length} demo users`);
  }

  // 9. Deduplicate announcements (keep most recent of each title)
  const announcements = await prisma.announcement.findMany({ orderBy: { createdAt: "desc" } });
  const seenAnn = new Set<string>();
  const dupAnnIds: string[] = [];
  for (const a of announcements) {
    if (seenAnn.has(a.title)) {
      dupAnnIds.push(a.id);
    } else {
      seenAnn.add(a.title);
    }
  }
  if (dupAnnIds.length > 0) {
    await prisma.announcementRead.deleteMany({ where: { announcementId: { in: dupAnnIds } } });
    await prisma.announcement.deleteMany({ where: { id: { in: dupAnnIds } } });
    console.log(`Removed ${dupAnnIds.length} duplicate announcements`);
  }

  // 10. Deduplicate notifications for real users
  const realUsers = await prisma.user.findMany({
    where: { email: { in: KEEP_EMAILS } },
    select: { id: true },
  });
  for (const ru of realUsers) {
    const notifs = await prisma.notification.findMany({
      where: { userId: ru.id },
      orderBy: { createdAt: "desc" },
    });
    const seen = new Set<string>();
    const toDelete: string[] = [];
    for (const n of notifs) {
      const key = `${n.type}-${n.title}`;
      if (seen.has(key)) {
        toDelete.push(n.id);
      } else {
        seen.add(key);
      }
    }
    if (toDelete.length > 0) {
      await prisma.notification.deleteMany({ where: { id: { in: toDelete } } });
      console.log(`Removed ${toDelete.length} duplicate notifications for user ${ru.id}`);
    }
  }

  // 11. Remove demo content posts
  const demoPosts = await prisma.contentPost.findMany({
    where: {
      OR: [
        { publishedUrl: { contains: "demo" } },
        { createdById: { in: demoUserIds } },
      ],
    },
    select: { id: true },
  });
  if (demoPosts.length > 0) {
    for (const p of demoPosts) {
      await prisma.postAnalytics.deleteMany({ where: { postId: p.id } });
    }
    await prisma.contentPost.deleteMany({ where: { id: { in: demoPosts.map((p) => p.id) } } });
    console.log(`Removed ${demoPosts.length} demo content posts`);
  }

  // 12. Remove demo invoices (INV-000x pattern)
  const demoInvoices = await prisma.invoice.deleteMany({
    where: { number: { startsWith: "INV-000" } },
  });
  if (demoInvoices.count > 0) {
    console.log(`Removed ${demoInvoices.count} demo invoices`);
  }

  // Summary
  const remaining = await prisma.user.count();
  const remainingTasks = await prisma.task.count();
  const remainingNotifs = await prisma.notification.count();
  console.log(`\n=== CLEANUP COMPLETE ===`);
  console.log(`Users remaining: ${remaining}`);
  console.log(`Tasks remaining: ${remainingTasks}`);
  console.log(`Notifications remaining: ${remainingNotifs}`);
}

main()
  .catch((e) => {
    console.error("Cleanup failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
