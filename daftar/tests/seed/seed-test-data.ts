/**
 * Daftar Test Seed Data Script — STANDALONE TEST FIXTURE
 *
 * Creates a consistent test environment with all 7 roles, departments, brands,
 * tasks, invoices, announcements, and GI config.
 *
 * IMPORTANT: This is a standalone test fixture that does NOT conflict with or
 * depend on the main prisma/seed.ts. The main seed covers:
 *   - 7 departments, admin user, 2 brands, 8 demo users, 12 tasks,
 *     19 achievements, invoices, expenses, GI data, trends/signals, articles
 *
 * This test seed uses separate identifiers (test-* emails, test-client-* IDs,
 * INV-TEST-* invoice numbers) to avoid collisions. It reuses departments from
 * the main seed via upsert (Media, Tech) and adds test-specific data.
 *
 * Usage:
 *   npx ts-node tests/seed/seed-test-data.ts
 *
 * Prerequisites:
 *   - PostgreSQL running with pgvector extension
 *   - DATABASE_URL set in .env
 *   - Prisma client generated (npx prisma generate)
 *   - Main seed (prisma/seed.ts) should be run first, but is NOT required
 *
 * This script is IDEMPOTENT — safe to run multiple times.
 * Uses upsert wherever possible. Does NOT delete existing data.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Test Email Constants ───────────────────────────────────────
// Replace these with real OAuth emails for actual test accounts.
// These are placeholders — first OAuth login activates the account.
const TEST_EMAILS = {
  admin: "test-admin@daftar.test",
  headHr: "test-headhr@daftar.test",
  deptHead: "test-depthead@daftar.test",
  member1: "test-member1@daftar.test",
  member2: "test-member2@daftar.test",
  client: "test-client@daftar.test",
  finance: "test-finance@daftar.test",
  contractor: "test-contractor@daftar.test",
};

async function main() {
  console.log("🌱 Seeding Daftar test data...\n");

  // ─── 1. Departments ──────────────────────────────────────────
  console.log("Creating departments...");
  const [mediaDept, techDept] = await Promise.all([
    prisma.department.upsert({
      where: { name: "Media" },
      update: {},
      create: {
        name: "Media",
        type: "MEDIA",
        description: "Content creation, video production, editorial",
      },
    }),
    prisma.department.upsert({
      where: { name: "Tech" },
      update: {},
      create: {
        name: "Tech",
        type: "TECH",
        description: "Development, engineering, infrastructure",
      },
    }),
  ]);
  console.log(`  ✓ Departments: Media (${mediaDept.id}), Tech (${techDept.id})`);

  // ─── 2. Users (all 7 roles + extra member) ───────────────────
  console.log("Creating test users...");

  const adminUser = await prisma.user.upsert({
    where: { email: TEST_EMAILS.admin },
    update: { role: "ADMIN" },
    create: {
      email: TEST_EMAILS.admin,
      name: "Test Admin",
      role: "ADMIN",
      isActive: true,
    },
  });

  const headHrUser = await prisma.user.upsert({
    where: { email: TEST_EMAILS.headHr },
    update: { role: "HEAD_HR" },
    create: {
      email: TEST_EMAILS.headHr,
      name: "Test Head HR",
      role: "HEAD_HR",
      isActive: true,
      primaryDeptId: mediaDept.id,
    },
  });

  const deptHeadUser = await prisma.user.upsert({
    where: { email: TEST_EMAILS.deptHead },
    update: { role: "DEPT_HEAD" },
    create: {
      email: TEST_EMAILS.deptHead,
      name: "Test Dept Head",
      role: "DEPT_HEAD",
      isActive: true,
      primaryDeptId: mediaDept.id,
    },
  });

  const member1 = await prisma.user.upsert({
    where: { email: TEST_EMAILS.member1 },
    update: { role: "MEMBER" },
    create: {
      email: TEST_EMAILS.member1,
      name: "Test Member One",
      role: "MEMBER",
      isActive: true,
      primaryDeptId: mediaDept.id,
    },
  });

  const member2 = await prisma.user.upsert({
    where: { email: TEST_EMAILS.member2 },
    update: { role: "MEMBER" },
    create: {
      email: TEST_EMAILS.member2,
      name: "Test Member Two",
      role: "MEMBER",
      isActive: true,
      primaryDeptId: techDept.id,
    },
  });

  const clientUser = await prisma.user.upsert({
    where: { email: TEST_EMAILS.client },
    update: { role: "CLIENT" },
    create: {
      email: TEST_EMAILS.client,
      name: "Test Client User",
      role: "CLIENT",
      isActive: true,
    },
  });

  const financeUser = await prisma.user.upsert({
    where: { email: TEST_EMAILS.finance },
    update: { role: "FINANCE" },
    create: {
      email: TEST_EMAILS.finance,
      name: "Test Finance User",
      role: "FINANCE",
      isActive: true,
    },
  });

  const contractorUser = await prisma.user.upsert({
    where: { email: TEST_EMAILS.contractor },
    update: { role: "CONTRACTOR" },
    create: {
      email: TEST_EMAILS.contractor,
      name: "Test Contractor",
      role: "CONTRACTOR",
      isActive: true,
      primaryDeptId: techDept.id,
    },
  });

  console.log(`  ✓ Created 8 test users across all 7 roles`);

  // ─── 3. Department Memberships ────────────────────────────────
  console.log("Setting up department memberships...");
  const memberships = [
    { userId: deptHeadUser.id, departmentId: mediaDept.id, isPrimary: true },
    { userId: headHrUser.id, departmentId: mediaDept.id, isPrimary: true },
    { userId: member1.id, departmentId: mediaDept.id, isPrimary: true },
    { userId: member2.id, departmentId: techDept.id, isPrimary: true },
    { userId: contractorUser.id, departmentId: techDept.id, isPrimary: true },
  ];

  for (const m of memberships) {
    await prisma.departmentMember.upsert({
      where: {
        userId_departmentId: {
          userId: m.userId,
          departmentId: m.departmentId,
        },
      },
      update: {},
      create: m,
    });
  }
  console.log(`  ✓ ${memberships.length} department memberships`);

  // ─── 4. Client & Brands ───────────────────────────────────────
  console.log("Creating client and brands...");

  const testClient = await prisma.client.upsert({
    where: { id: "test-client-chaubey" },
    update: {},
    create: {
      id: "test-client-chaubey",
      name: "Bhupendra Chaubey",
      email: "chaubey@test.com",
      company: "Independent Journalist",
      userId: clientUser.id,
    },
  });

  const squirrelsBrand = await prisma.brand.upsert({
    where: { slug: "the-squirrels" },
    update: {},
    create: {
      name: "The Squirrels",
      slug: "the-squirrels",
      clientId: testClient.id,
      tagline: "Political Commentary with Bite",
      language: "English",
      tone: "sharp, witty, analytical",
      identityMarkdown:
        "The Squirrels is an English-language political commentary channel focused on Indian geopolitics.",
      activePlatforms: JSON.stringify(["youtube", "x"]),
      config: {
        language: "English",
        genre: "Political Commentary",
        platforms: ["youtube", "x"],
      },
    },
  });

  const breakingTubeBrand = await prisma.brand.upsert({
    where: { slug: "breaking-tube" },
    update: {},
    create: {
      name: "Breaking Tube",
      slug: "breaking-tube",
      clientId: testClient.id,
      tagline: "Breaking News, Unfiltered",
      language: "Hinglish",
      tone: "direct, bold, confrontational",
      identityMarkdown:
        "Breaking Tube is a Hinglish political analysis channel for the Indian audience.",
      activePlatforms: JSON.stringify(["youtube"]),
      config: {
        language: "Hinglish",
        genre: "Political Analysis",
        platforms: ["youtube"],
      },
    },
  });

  console.log(
    `  ✓ Client: ${testClient.name}, Brands: ${squirrelsBrand.name}, ${breakingTubeBrand.name}`
  );

  // ─── 5. Brand-Platform Links ──────────────────────────────────
  console.log("Linking brand platforms...");
  const brandPlatformLinks = [
    { brandId: squirrelsBrand.id, platform: "youtube" },
    { brandId: squirrelsBrand.id, platform: "x" },
    { brandId: breakingTubeBrand.id, platform: "youtube" },
  ];

  for (const bp of brandPlatformLinks) {
    await prisma.brandPlatform.upsert({
      where: { brandId_platform: { brandId: bp.brandId, platform: bp.platform } },
      update: {},
      create: { ...bp, isActive: true },
    });
  }
  console.log(`  ✓ ${brandPlatformLinks.length} brand-platform links`);

  // ─── 6. User-Brand Access ────────────────────────────────────
  console.log("Granting brand access...");
  const brandAccessRecords = [
    { userId: adminUser.id, brandId: squirrelsBrand.id },
    { userId: adminUser.id, brandId: breakingTubeBrand.id },
    { userId: deptHeadUser.id, brandId: squirrelsBrand.id },
    { userId: deptHeadUser.id, brandId: breakingTubeBrand.id },
    { userId: member1.id, brandId: squirrelsBrand.id },
    { userId: member1.id, brandId: breakingTubeBrand.id },
    { userId: member2.id, brandId: squirrelsBrand.id },
    { userId: clientUser.id, brandId: squirrelsBrand.id },
    { userId: clientUser.id, brandId: breakingTubeBrand.id },
  ];

  for (const ba of brandAccessRecords) {
    await prisma.userBrandAccess.upsert({
      where: {
        userId_brandId: { userId: ba.userId, brandId: ba.brandId },
      },
      update: {},
      create: ba,
    });
  }
  console.log(`  ✓ ${brandAccessRecords.length} brand access records`);

  // ─── 7. Sample Tasks (5 across different statuses) ────────────
  console.log("Creating sample tasks...");

  const now = new Date();
  const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  const taskSeeds = [
    {
      title: "Write script for India semiconductor policy video",
      description: "Research India's semiconductor policy and write a 10-minute video script for The Squirrels",
      status: "CREATED" as const,
      priority: "HIGH" as const,
      creatorId: deptHeadUser.id,
      assigneeId: null,
      departmentId: mediaDept.id,
      brandId: squirrelsBrand.id,
      dueDate: inSevenDays,
    },
    {
      title: "Edit Breaking Tube episode 45",
      description: "Post-production editing for episode 45 — Pakistan economy analysis",
      status: "IN_PROGRESS" as const,
      priority: "MEDIUM" as const,
      creatorId: deptHeadUser.id,
      assigneeId: member1.id,
      departmentId: mediaDept.id,
      brandId: breakingTubeBrand.id,
      dueDate: inThreeDays,
      startedAt: twoDaysAgo,
    },
    {
      title: "Design thumbnail for geopolitics roundup",
      description: "Create eye-catching thumbnail for the weekly geopolitics roundup video",
      status: "REVIEW" as const,
      priority: "MEDIUM" as const,
      creatorId: member1.id,
      assigneeId: member1.id,
      departmentId: mediaDept.id,
      brandId: squirrelsBrand.id,
      dueDate: inThreeDays,
      startedAt: twoDaysAgo,
    },
    {
      title: "Fix Relay LinkedIn publishing bug",
      description: "LinkedIn posts are failing with 403 — investigate token refresh flow",
      status: "ASSIGNED" as const,
      priority: "URGENT" as const,
      creatorId: adminUser.id,
      assigneeId: member2.id,
      departmentId: techDept.id,
      brandId: null,
      dueDate: inThreeDays,
    },
    {
      title: "Monthly analytics report — February 2026",
      description: "Compile cross-platform analytics for both brands for Feb 2026",
      status: "DONE" as const,
      priority: "LOW" as const,
      creatorId: deptHeadUser.id,
      assigneeId: member1.id,
      departmentId: mediaDept.id,
      brandId: null,
      dueDate: twoDaysAgo,
      startedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      completedAt: twoDaysAgo,
    },
  ];

  const createdTasks = [];
  for (const task of taskSeeds) {
    // Use create (not upsert) since tasks have no natural unique key.
    // Check by title to be idempotent.
    const existing = await prisma.task.findFirst({
      where: { title: task.title },
    });
    if (!existing) {
      const created = await prisma.task.create({ data: task });
      createdTasks.push(created);
    } else {
      createdTasks.push(existing);
    }
  }
  console.log(`  ✓ ${createdTasks.length} sample tasks`);

  // ─── 8. Sample Invoice (Draft) ────────────────────────────────
  console.log("Creating sample invoice...");

  const existingInvoice = await prisma.invoice.findFirst({
    where: { number: "INV-TEST-001" },
  });

  if (!existingInvoice) {
    await prisma.invoice.create({
      data: {
        number: "INV-TEST-001",
        status: "DRAFT",
        brandId: squirrelsBrand.id,
        clientId: testClient.id,
        amount: 50000,
        tax: 9000,
        totalAmount: 59000,
        dueDate: inSevenDays,
        description: "Monthly content production — March 2026",
        items: [
          { description: "YouTube video production (4 videos)", amount: 30000 },
          { description: "X/Twitter content management", amount: 10000 },
          { description: "Thumbnail design (4 thumbnails)", amount: 10000 },
        ],
        createdById: financeUser.id,
      },
    });
    console.log("  ✓ Sample invoice INV-TEST-001 (Draft, ₹59,000)");
  } else {
    console.log("  ✓ Invoice INV-TEST-001 already exists, skipping");
  }

  // ─── 9. Sample Announcement ───────────────────────────────────
  console.log("Creating sample announcement...");

  const existingAnnouncement = await prisma.announcement.findFirst({
    where: { title: "Welcome to Daftar Test Environment" },
  });

  if (!existingAnnouncement) {
    await prisma.announcement.create({
      data: {
        title: "Welcome to Daftar Test Environment",
        content:
          "This is a seeded announcement for testing purposes. All modules are available for testing. Report any issues to the admin.",
        type: "general",
        priority: "NORMAL",
        scope: "org",
        authorId: adminUser.id,
        isPinned: true,
      },
    });
    console.log("  ✓ Sample org-wide announcement");
  } else {
    console.log("  ✓ Announcement already exists, skipping");
  }

  // ─── 10. GI Config Defaults ───────────────────────────────────
  console.log("Setting GI config defaults...");

  const giDefaults = [
    {
      key: "autonomy_level",
      value: { level: 3, description: "Medium autonomy — execute tier 3+ actions automatically" },
      description: "GI autonomous action threshold",
    },
    {
      key: "insight_refresh_interval",
      value: { seconds: 60 },
      description: "How often GI refreshes contextual insights",
    },
    {
      key: "prediction_confidence_threshold",
      value: { threshold: 0.7 },
      description: "Minimum confidence for GI predictions to surface",
    },
    {
      key: "chat_enabled",
      value: { enabled: true, model: "gemini-2.5-pro" },
      description: "GI chat availability and model config",
    },
  ];

  for (const config of giDefaults) {
    await prisma.gIConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: {
        ...config,
        updatedBy: adminUser.id,
      },
    });
  }
  console.log(`  ✓ ${giDefaults.length} GI config entries`);

  // ─── 11. GI Tier Assignments ──────────────────────────────────
  console.log("Setting GI tier assignments...");

  const tierAssignments = [
    { actionType: "task_reassignment", tier: 3 },
    { actionType: "deadline_extension", tier: 2 },
    { actionType: "workload_rebalance", tier: 2 },
    { actionType: "leaderboard_update", tier: 4 },
    { actionType: "performance_warning", tier: 1 },
    { actionType: "budget_allocation", tier: 1 },
    { actionType: "broll_sourcing", tier: 4 },
    { actionType: "social_media_posting", tier: 2 },
  ];

  for (const ta of tierAssignments) {
    await prisma.gITierAssignment.upsert({
      where: { actionType: ta.actionType },
      update: { tier: ta.tier },
      create: { ...ta, updatedBy: adminUser.id },
    });
  }
  console.log(`  ✓ ${tierAssignments.length} GI tier assignments`);

  // ─── 12. Role Configs ─────────────────────────────────────────
  console.log("Setting role configs...");

  const roleConfigs = [
    {
      role: "ADMIN" as const,
      dashboardViews: ["org_overview", "all_modules", "system_health"],
      notifications: { taskUpdates: true, systemAlerts: true, giInsights: true },
      reportAccess: ["all"],
      giConversation: { enabled: true, tier: "full" },
    },
    {
      role: "HEAD_HR" as const,
      dashboardViews: ["hr_overview", "hiring_pipeline", "team_sentiment"],
      notifications: { taskUpdates: true, hiringUpdates: true, sentimentAlerts: true },
      reportAccess: ["hr", "department_performance", "hiring"],
      giConversation: { enabled: true, tier: "hr" },
    },
    {
      role: "DEPT_HEAD" as const,
      dashboardViews: ["dept_overview", "team_tasks", "kpis"],
      notifications: { taskUpdates: true, teamAlerts: true, deliverableReady: true },
      reportAccess: ["department_performance", "task_completion"],
      giConversation: { enabled: true, tier: "department" },
    },
    {
      role: "MEMBER" as const,
      dashboardViews: ["my_tasks", "leaderboard", "calendar"],
      notifications: { taskAssigned: true, taskComments: true, achievements: true },
      reportAccess: ["own_performance"],
      giConversation: { enabled: true, tier: "personal" },
    },
    {
      role: "CLIENT" as const,
      dashboardViews: ["my_brands", "content_calendar", "deliverables"],
      notifications: { deliverableReady: true, reportReady: true },
      reportAccess: ["brand_performance"],
      giConversation: { enabled: false, tier: "none" },
    },
    {
      role: "FINANCE" as const,
      dashboardViews: ["financial_overview", "invoices", "expenses"],
      notifications: { invoiceUpdates: true, expenseAlerts: true },
      reportAccess: ["financial", "revenue"],
      giConversation: { enabled: true, tier: "finance" },
    },
    {
      role: "CONTRACTOR" as const,
      dashboardViews: ["my_tasks", "active_projects"],
      notifications: { taskAssigned: true, taskComments: true },
      reportAccess: ["own_performance"],
      giConversation: { enabled: false, tier: "none" },
    },
  ];

  for (const rc of roleConfigs) {
    await prisma.roleConfig.upsert({
      where: { role: rc.role },
      update: {
        dashboardViews: rc.dashboardViews,
        notifications: rc.notifications,
        reportAccess: rc.reportAccess,
        giConversation: rc.giConversation,
      },
      create: rc,
    });
  }
  console.log(`  ✓ ${roleConfigs.length} role configs`);

  // ─── 13. Gamification: Seed Achievements ──────────────────────
  console.log("Seeding achievements...");

  const achievements = [
    { key: "first_task", name: "First Steps", description: "Complete your first task", icon: "🎯", category: "milestone", threshold: 1, points: 10 },
    { key: "task_5", name: "Getting Warmed Up", description: "Complete 5 tasks", icon: "🔥", category: "milestone", threshold: 5, points: 25 },
    { key: "task_25", name: "Workhorse", description: "Complete 25 tasks", icon: "🐎", category: "milestone", threshold: 25, points: 100 },
    { key: "task_100", name: "Centurion", description: "Complete 100 tasks", icon: "💯", category: "milestone", threshold: 100, points: 500 },
    { key: "streak_3", name: "On a Roll", description: "3-day activity streak", icon: "📈", category: "streak", threshold: 3, points: 15 },
    { key: "streak_7", name: "Week Warrior", description: "7-day activity streak", icon: "⚡", category: "streak", threshold: 7, points: 50 },
    { key: "streak_30", name: "Unstoppable", description: "30-day activity streak", icon: "🏆", category: "streak", threshold: 30, points: 250 },
    { key: "speed_demon", name: "Speed Demon", description: "Complete a task within 1 hour of assignment", icon: "💨", category: "speed", threshold: 1, points: 30 },
    { key: "rapid_fire", name: "Rapid Fire", description: "Complete 3 tasks in a single day", icon: "🎆", category: "speed", threshold: 3, points: 40 },
    { key: "team_player", name: "Team Player", description: "Receive 5+ recognitions from teammates", icon: "🤝", category: "collaboration", threshold: 5, points: 50 },
    { key: "quality_king", name: "Quality King", description: "10 tasks approved without revision", icon: "👑", category: "quality", threshold: 10, points: 75 },
  ];

  for (const a of achievements) {
    await prisma.achievement.upsert({
      where: { key: a.key },
      update: {},
      create: { ...a, isActive: true },
    });
  }
  console.log(`  ✓ ${achievements.length} achievements`);

  // ─── 14. Gamification: User Streaks for test users ────────────
  console.log("Initializing user streaks...");

  for (const user of [adminUser, member1, member2, deptHeadUser]) {
    await prisma.userStreak.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        currentStreak: 0,
        longestStreak: 0,
        totalXp: 0,
        level: 1,
      },
    });
  }
  console.log("  ✓ User streaks initialized");

  // ─── 15. Platform Configs ─────────────────────────────────────
  console.log("Seeding platform configs...");

  const platformConfigs = [
    {
      platform: "youtube",
      displayName: "YouTube",
      deliverableTypes: [
        { type: "long_video", formatSpecs: { minLength: 600, maxLength: 7200 }, dimensions: "1920x1080" },
        { type: "short", formatSpecs: { minLength: 15, maxLength: 60 }, dimensions: "1080x1920" },
        { type: "thumbnail", formatSpecs: {}, dimensions: "1280x720" },
      ],
      postingRules: { maxPerDay: 3, bestTimes: ["09:00", "17:00", "20:00"] },
      analyticsMetrics: ["views", "watch_time", "subscribers", "ctr", "impressions"],
    },
    {
      platform: "x",
      displayName: "X (Twitter)",
      deliverableTypes: [
        { type: "tweet", formatSpecs: { maxChars: 280 } },
        { type: "thread", formatSpecs: { maxTweets: 25 } },
        { type: "video", formatSpecs: { maxLength: 140 } },
      ],
      postingRules: { maxPerDay: 10, bestTimes: ["08:00", "12:00", "18:00"] },
      analyticsMetrics: ["impressions", "engagements", "retweets", "likes", "replies"],
    },
    {
      platform: "instagram",
      displayName: "Instagram",
      deliverableTypes: [
        { type: "reel", formatSpecs: { minLength: 5, maxLength: 90 }, dimensions: "1080x1920" },
        { type: "post", formatSpecs: {}, dimensions: "1080x1080" },
        { type: "carousel", formatSpecs: { maxSlides: 10 }, dimensions: "1080x1080" },
      ],
      postingRules: { maxPerDay: 5, hashtagLimit: 30, bestTimes: ["11:00", "14:00", "19:00"] },
      analyticsMetrics: ["reach", "impressions", "engagement_rate", "saves", "shares"],
    },
    {
      platform: "linkedin",
      displayName: "LinkedIn",
      deliverableTypes: [
        { type: "post", formatSpecs: { maxChars: 3000 } },
      ],
      postingRules: { maxPerDay: 2, bestTimes: ["08:00", "12:00"] },
      analyticsMetrics: ["impressions", "clicks", "engagement_rate", "shares"],
    },
  ];

  for (const pc of platformConfigs) {
    await prisma.platformConfig.upsert({
      where: { platform: pc.platform },
      update: {},
      create: { ...pc, isActive: true },
    });
  }
  console.log(`  ✓ ${platformConfigs.length} platform configs`);

  // ─── 16. Feedback Channel ─────────────────────────────────────
  console.log("Creating feedback channels...");

  const existingChannel = await prisma.feedbackChannel.findFirst({
    where: { name: "General Feedback" },
  });

  if (!existingChannel) {
    await prisma.feedbackChannel.create({
      data: {
        name: "General Feedback",
        description: "Share your thoughts, suggestions, or concerns about Daftar",
        type: "general",
        isAnonymous: true,
        isActive: true,
      },
    });
  }

  const existingSuggestionChannel = await prisma.feedbackChannel.findFirst({
    where: { name: "Feature Suggestions" },
  });

  if (!existingSuggestionChannel) {
    await prisma.feedbackChannel.create({
      data: {
        name: "Feature Suggestions",
        description: "Propose new features or improvements",
        type: "suggestion",
        isAnonymous: false,
        isActive: true,
      },
    });
  }
  console.log("  ✓ Feedback channels");

  // ─── 17. Workflow Templates ───────────────────────────────────
  console.log("Creating workflow templates...");

  await prisma.workflowTemplate.upsert({
    where: { name: "Media Production" },
    update: {},
    create: {
      name: "Media Production",
      description: "End-to-end media content production workflow",
      departmentId: mediaDept.id,
      stages: [
        { name: "Script", order: 1, approvalGate: false },
        { name: "Assets", order: 2, approvalGate: false },
        { name: "Edit", order: 3, approvalGate: false },
        { name: "Review", order: 4, approvalGate: true },
        { name: "Approve", order: 5, approvalGate: true },
        { name: "Publish", order: 6, approvalGate: false },
      ],
      triggers: { events: ["task_created", "brand_assigned"] },
      escalation: { overdueHours: 24, notifyRoles: ["DEPT_HEAD", "ADMIN"] },
    },
  });

  await prisma.workflowTemplate.upsert({
    where: { name: "Tech Development" },
    update: {},
    create: {
      name: "Tech Development",
      description: "Software development lifecycle workflow",
      departmentId: techDept.id,
      stages: [
        { name: "Spec", order: 1, approvalGate: false },
        { name: "Development", order: 2, approvalGate: false },
        { name: "Code Review", order: 3, approvalGate: true },
        { name: "QA", order: 4, approvalGate: true },
        { name: "Deploy", order: 5, approvalGate: true },
      ],
      triggers: { events: ["task_created"] },
      escalation: { overdueHours: 48, notifyRoles: ["DEPT_HEAD"] },
    },
  });

  await prisma.workflowTemplate.upsert({
    where: { name: "General Task" },
    update: {},
    create: {
      name: "General Task",
      description: "Default workflow for general tasks",
      stages: [
        { name: "Created", order: 1, approvalGate: false },
        { name: "Assigned", order: 2, approvalGate: false },
        { name: "In Progress", order: 3, approvalGate: false },
        { name: "Review", order: 4, approvalGate: true },
        { name: "Done", order: 5, approvalGate: false },
      ],
      isDefault: true,
    },
  });
  console.log("  ✓ 3 workflow templates");

  // ─── 18. Khabri: Trend + Signals (pipeline test data) ─────────
  console.log("Creating Khabri test data (trend + signals)...");

  let testTrend = await prisma.trend.findFirst({
    where: { name: "India Semiconductor Policy" },
  });
  if (!testTrend) {
    testTrend = await prisma.trend.create({
      data: {
        name: "India Semiconductor Policy",
        lifecycle: "emerging",
        velocityScore: 72,
      },
    });
  }

  const signalSeeds = [
    {
      title: "India's semiconductor chip manufacturing push — $10B investment",
      content: "The Indian government has announced a $10 billion incentive package to attract global semiconductor manufacturers. Three new fabs planned in Gujarat and Tamil Nadu.",
      source: "Reuters",
      sourceCredibility: 85,
      eventType: "policy_announcement",
      sentiment: "positive",
      stakeholders: [
        { name: "Narendra Modi", type: "person", salience: 0.9 },
        { name: "Ministry of Electronics", type: "organization", salience: 0.7 },
      ],
      eventMarkers: { date: "2026-03-10", type: "policy", region: "India" },
    },
    {
      title: "TSMC considers India for next-gen chip packaging facility",
      content: "Taiwan Semiconductor Manufacturing Company is evaluating locations in India for an advanced chip packaging plant, potentially bringing 5,000 jobs.",
      source: "Nikkei Asia",
      sourceCredibility: 80,
      eventType: "corporate_move",
      sentiment: "positive",
      stakeholders: [
        { name: "TSMC", type: "organization", salience: 0.9 },
        { name: "India IT Ministry", type: "organization", salience: 0.6 },
      ],
      eventMarkers: { date: "2026-03-09", type: "business", region: "India" },
    },
    {
      title: "China's chip export restrictions tighten — India positioned as alternative",
      content: "New US restrictions on Chinese chip exports create opportunity for India as an alternative manufacturing hub. Analysts project India could capture 10% of global chip market by 2035.",
      source: "Bloomberg",
      sourceCredibility: 90,
      eventType: "geopolitical",
      sentiment: "neutral",
      stakeholders: [
        { name: "US Commerce Department", type: "organization", salience: 0.8 },
        { name: "India", type: "geo", salience: 0.7 },
      ],
      eventMarkers: { date: "2026-03-08", type: "geopolitics", region: "Global" },
    },
  ];

  for (const signal of signalSeeds) {
    const existing = await prisma.signal.findFirst({
      where: { title: signal.title },
    });
    if (!existing) {
      await prisma.signal.create({
        data: {
          ...signal,
          trendId: testTrend.id,
          detectedAt: new Date(),
        },
      });
    }
  }
  console.log(`  ✓ 1 Trend + ${signalSeeds.length} Signals`);

  // ─── 19. Yantri: NarrativeTree + ContentPieces (pipeline-ready) ──
  console.log("Creating Yantri pipeline test data...");

  const existingTree = await prisma.narrativeTree.findFirst({
    where: { title: "India Semiconductor Policy — Strategic Analysis" },
  });

  let testTree = existingTree;
  if (!testTree) {
    testTree = await prisma.narrativeTree.create({
      data: {
        title: "India Semiconductor Policy — Strategic Analysis",
        summary: "India's $10B semiconductor push, TSMC expansion, and geopolitical implications. Multiple angles for content across platforms.",
        status: "INCOMING",
        urgency: "high",
        createdById: adminUser.id,
        nodes: {
          create: signalSeeds.map((s, i) => ({
            signalTitle: s.title.slice(0, 150),
            signalScore: 80 - i * 10,
            signalData: { source: s.source, stakeholders: s.stakeholders, sentiment: s.sentiment },
          })),
        },
      },
    });
  }

  // Create PLANNED ContentPieces ready for pipeline.run
  const contentPieceSeeds = [
    {
      platform: "YOUTUBE" as const,
      bodyText: "[Strategist Angle] India's $10B semiconductor gamble — why it matters for global tech supply chains\n\n[Reasoning] High-interest geopolitical narrative with clear Indian audience hook. YouTube long-form allows deep dive into policy implications.",
    },
    {
      platform: "X_THREAD" as const,
      bodyText: "[Strategist Angle] Thread: India vs China in the global chip wars — 5 things you need to know\n\n[Reasoning] Snackable format for X audience. Thread structure enables sequential revelation of key facts.",
    },
    {
      platform: "META_CAROUSEL" as const,
      bodyText: "[Strategist Angle] The Semiconductor Story: India's $10B Bet (Visual Explainer)\n\n[Reasoning] Carousel format ideal for stat-heavy visual storytelling. Instagram audience responds well to infographic-style breakdowns.",
    },
  ];

  for (const cp of contentPieceSeeds) {
    const existing = await prisma.contentPiece.findFirst({
      where: { bodyText: { startsWith: cp.bodyText.slice(0, 80) }, brandId: squirrelsBrand.id },
    });
    if (!existing) {
      await prisma.contentPiece.create({
        data: {
          ...cp,
          brandId: squirrelsBrand.id,
          treeId: testTree.id,
          status: "PLANNED",
        },
      });
    }
  }
  console.log(`  ✓ 1 NarrativeTree + ${contentPieceSeeds.length} ContentPieces (PLANNED)`);
  console.log(`    Tree ID: ${testTree.id}`);
  console.log(`    To run pipeline: POST /api/yantri/pipeline/run { "contentPieceId": "<piece-id>" }`);

  // ─── Summary ──────────────────────────────────────────────────
  console.log("\n✅ Test seed complete!\n");
  console.log("Summary:");
  console.log("  - 2 Departments (Media, Tech)");
  console.log("  - 8 Users (Admin, Head HR, Dept Head, 2 Members, Client, Finance, Contractor)");
  console.log("  - 5 Department memberships");
  console.log("  - 1 Client (Bhupendra Chaubey)");
  console.log("  - 2 Brands (The Squirrels, Breaking Tube)");
  console.log("  - 3 Brand-platform links");
  console.log("  - 9 Brand access records");
  console.log("  - 5 Sample tasks (CREATED, IN_PROGRESS, REVIEW, ASSIGNED, DONE)");
  console.log("  - 1 Draft invoice (INV-TEST-001)");
  console.log("  - 1 Org-wide announcement");
  console.log("  - 4 GI config entries");
  console.log("  - 8 GI tier assignments (incl. workload_rebalance)");
  console.log("  - 7 Role configs");
  console.log("  - 11 Achievements");
  console.log("  - 4 Platform configs");
  console.log("  - 2 Feedback channels");
  console.log("  - 3 Workflow templates");
  console.log("  - 1 Trend + 3 Signals (Khabri)");
  console.log("  - 1 NarrativeTree + 3 ContentPieces (Yantri, PLANNED)");
  console.log("\nTest user emails:");
  Object.entries(TEST_EMAILS).forEach(([role, email]) => {
    console.log(`  ${role.padEnd(12)} → ${email}`);
  });
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
