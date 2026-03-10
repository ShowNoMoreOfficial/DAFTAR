import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Daftar database...");

  // ─── Departments ───────────────────────────────────────
  const departments = await Promise.all([
    prisma.department.upsert({
      where: { name: "Media" },
      update: {},
      create: { name: "Media", type: "MEDIA", description: "Content creation, video production, editorial" },
    }),
    prisma.department.upsert({
      where: { name: "Tech" },
      update: {},
      create: { name: "Tech", type: "TECH", description: "Development, engineering, infrastructure" },
    }),
    prisma.department.upsert({
      where: { name: "Marketing" },
      update: {},
      create: { name: "Marketing", type: "MARKETING", description: "Growth, brand strategy, campaigns" },
    }),
    prisma.department.upsert({
      where: { name: "Production" },
      update: {},
      create: { name: "Production", type: "PRODUCTION", description: "Video editing, post-production" },
    }),
    prisma.department.upsert({
      where: { name: "PPC" },
      update: {},
      create: { name: "PPC", type: "PPC", description: "Paid advertising, performance marketing" },
    }),
    prisma.department.upsert({
      where: { name: "Photography & Cinematography" },
      update: {},
      create: { name: "Photography & Cinematography", type: "PHOTOGRAPHY", description: "Visual content, shoots" },
    }),
    prisma.department.upsert({
      where: { name: "HR & Operations" },
      update: {},
      create: { name: "HR & Operations", type: "HR_OPS", description: "People, culture, operations" },
    }),
  ]);

  console.log(`Created ${departments.length} departments`);

  // ─── Admin User ────────────────────────────────────────
  // Replace this email with the actual admin's Google/Microsoft email
  const admin = await prisma.user.upsert({
    where: { email: "shownomoreofficial@gmail.com" },
    update: {},
    create: {
      email: "shownomoreofficial@gmail.com",
      name: "Stallone2K",
      role: "ADMIN",
      isActive: false, // Will activate on first OAuth login
    },
  });
  console.log(`Admin user created: ${admin.email}`);

  // ─── Module Registry ───────────────────────────────────
  const modules = await Promise.all([
    prisma.module.upsert({
      where: { name: "yantri" },
      update: { baseUrl: "https://yantri-nine.vercel.app" },
      create: {
        name: "yantri",
        displayName: "Yantri",
        description: "AI Narrative Intelligence Orchestrator",
        icon: "Brain",
        baseUrl: "https://yantri-nine.vercel.app",
        order: 1,
      },
    }),
    prisma.module.upsert({
      where: { name: "khabri" },
      update: {},
      create: {
        name: "khabri",
        displayName: "Khabri",
        description: "Signal Detection Engine",
        icon: "Newspaper",
        baseUrl: "http://localhost:3002",
        order: 2,
      },
    }),
    prisma.module.upsert({
      where: { name: "relay" },
      update: {},
      create: {
        name: "relay",
        displayName: "Relay",
        description: "Content Distribution Platform",
        icon: "Send",
        baseUrl: "http://localhost:3003",
        isActive: false,
        order: 3,
      },
    }),
    prisma.module.upsert({
      where: { name: "pms" },
      update: {},
      create: {
        name: "pms",
        displayName: "PMS",
        description: "Project Management System",
        icon: "Kanban",
        baseUrl: "http://localhost:3004",
        isActive: false,
        order: 4,
      },
    }),
    prisma.module.upsert({
      where: { name: "hoccr" },
      update: {},
      create: {
        name: "hoccr",
        displayName: "HOCCR",
        description: "Hiring, Operations, Culture, Communication, Reporting",
        icon: "Users",
        baseUrl: "http://localhost:3005",
        isActive: false,
        order: 5,
      },
    }),
    prisma.module.upsert({
      where: { name: "vritti" },
      update: {},
      create: {
        name: "vritti",
        displayName: "Vritti",
        description: "Content Management System",
        icon: "FileText",
        baseUrl: "http://localhost:3006",
        isActive: false,
        order: 6,
      },
    }),
  ]);

  console.log(`Registered ${modules.length} modules`);

  // ─── Sample Client & Brands ────────────────────────────
  const client = await prisma.client.upsert({
    where: { id: "sample-client-chaubey" },
    update: {},
    create: {
      id: "sample-client-chaubey",
      name: "Bhupendra Chaubey",
      company: "Independent Journalist",
    },
  });

  await Promise.all([
    prisma.brand.upsert({
      where: { slug: "breaking-tube" },
      update: {},
      create: {
        name: "Breaking Tube",
        slug: "breaking-tube",
        clientId: client.id,
        config: {
          language: "Hinglish",
          genre: "Political Analysis",
          platforms: ["youtube"],
        },
      },
    }),
    prisma.brand.upsert({
      where: { slug: "the-squirrels" },
      update: {},
      create: {
        name: "The Squirrels",
        slug: "the-squirrels",
        clientId: client.id,
        config: {
          language: "English",
          genre: "Political Commentary",
          platforms: ["youtube"],
        },
      },
    }),
  ]);

  console.log("Sample client and brands created");

  // ─── GI Default Tier Assignments ───────────────────────
  const tierAssignments = [
    { actionType: "task_reassignment", tier: 3 },
    { actionType: "deadline_extension", tier: 2 },
    { actionType: "leaderboard_update", tier: 4 },
    { actionType: "performance_warning", tier: 1 },
    { actionType: "budget_allocation", tier: 1 },
    { actionType: "broll_sourcing", tier: 4 },
    { actionType: "social_media_posting", tier: 2 },
  ];

  for (const ta of tierAssignments) {
    await prisma.gITierAssignment.upsert({
      where: { actionType: ta.actionType },
      update: {},
      create: {
        ...ta,
        updatedBy: admin.id,
      },
    });
  }

  console.log("GI tier assignments configured");

  // ─── Workflow Templates ──────────────────────────────────
  const mediaDept = departments.find((d) => d.name === "Media");
  const techDept = departments.find((d) => d.name === "Tech");

  await prisma.workflowTemplate.upsert({
    where: { name: "Media Production" },
    update: {},
    create: {
      name: "Media Production",
      description: "End-to-end media content production workflow",
      departmentId: mediaDept?.id,
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
      departmentId: techDept?.id,
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

  console.log("Workflow templates created");

  // ─── Platform Configs ────────────────────────────────────
  const platformSeeds = [
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
      platform: "instagram",
      displayName: "Instagram",
      deliverableTypes: [
        { type: "reel", formatSpecs: { minLength: 5, maxLength: 90 }, dimensions: "1080x1920" },
        { type: "post", formatSpecs: {}, dimensions: "1080x1080" },
        { type: "story", formatSpecs: { maxLength: 15 }, dimensions: "1080x1920" },
        { type: "carousel", formatSpecs: { maxSlides: 10 }, dimensions: "1080x1080" },
      ],
      postingRules: { maxPerDay: 5, hashtagLimit: 30, bestTimes: ["11:00", "14:00", "19:00"] },
      analyticsMetrics: ["reach", "impressions", "engagement_rate", "saves", "shares"],
    },
    {
      platform: "x",
      displayName: "X (Twitter)",
      deliverableTypes: [
        { type: "tweet", formatSpecs: { maxChars: 280 }, dimensions: null },
        { type: "thread", formatSpecs: { maxTweets: 25 }, dimensions: null },
        { type: "video", formatSpecs: { maxLength: 140 }, dimensions: "1920x1080" },
      ],
      postingRules: { maxPerDay: 10, bestTimes: ["08:00", "12:00", "17:00"] },
      analyticsMetrics: ["impressions", "engagements", "retweets", "likes", "replies"],
    },
    {
      platform: "linkedin",
      displayName: "LinkedIn",
      deliverableTypes: [
        { type: "post", formatSpecs: { maxChars: 3000 }, dimensions: null },
        { type: "article", formatSpecs: {}, dimensions: null },
        { type: "video", formatSpecs: { maxLength: 600 }, dimensions: "1920x1080" },
        { type: "document", formatSpecs: { maxPages: 300 }, dimensions: null },
      ],
      postingRules: { maxPerDay: 2, bestTimes: ["08:00", "10:00", "12:00"] },
      analyticsMetrics: ["impressions", "clicks", "engagement_rate", "followers"],
    },
    {
      platform: "facebook",
      displayName: "Facebook",
      deliverableTypes: [
        { type: "post", formatSpecs: {}, dimensions: null },
        { type: "reel", formatSpecs: { maxLength: 90 }, dimensions: "1080x1920" },
        { type: "video", formatSpecs: { maxLength: 14400 }, dimensions: "1920x1080" },
        { type: "story", formatSpecs: { maxLength: 20 }, dimensions: "1080x1920" },
      ],
      postingRules: { maxPerDay: 5, bestTimes: ["09:00", "13:00", "16:00"] },
      analyticsMetrics: ["reach", "impressions", "engagement", "shares", "reactions"],
    },
  ];

  for (const ps of platformSeeds) {
    await prisma.platformConfig.upsert({
      where: { platform: ps.platform },
      update: {},
      create: ps,
    });
  }

  console.log("Platform configs created");

  // ─── Role Configs ────────────────────────────────────────
  const roleSeeds = [
    {
      role: "ADMIN" as const,
      dashboardViews: ["overview", "departments", "users", "finance", "analytics", "config", "gi"],
      notifications: { events: ["*"] },
      reportAccess: ["*"],
      giConversation: { topics: ["*"], tier: 1 },
    },
    {
      role: "HEAD_HR" as const,
      dashboardViews: ["overview", "hiring", "team", "reports", "culture"],
      notifications: { events: ["candidate_applied", "interview_scheduled", "offer_accepted", "task_overdue"] },
      reportAccess: ["hiring_pipeline", "team_workload", "department_performance"],
      giConversation: { topics: ["hiring", "team_management", "culture", "operations"], tier: 2 },
    },
    {
      role: "DEPT_HEAD" as const,
      dashboardViews: ["department_overview", "team", "tasks", "reports"],
      notifications: { events: ["task_assigned", "task_overdue", "approval_pending", "deliverable_ready"] },
      reportAccess: ["department_performance", "team_workload", "task_completion"],
      giConversation: { topics: ["department_tasks", "team_performance", "deadlines"], tier: 2 },
    },
    {
      role: "MEMBER" as const,
      dashboardViews: ["my_tasks", "calendar", "leaderboard"],
      notifications: { events: ["task_assigned", "task_comment", "approval_completed"] },
      reportAccess: ["my_performance"],
      giConversation: { topics: ["my_tasks", "guidelines", "best_practices"], tier: 3 },
    },
    {
      role: "CLIENT" as const,
      dashboardViews: ["brand_overview", "content_calendar", "deliverables"],
      notifications: { events: ["deliverable_ready", "approval_pending"] },
      reportAccess: ["brand_analytics"],
      giConversation: { topics: ["brand_content", "approvals", "analytics"], tier: 3 },
    },
    {
      role: "FINANCE" as const,
      dashboardViews: ["finance_overview", "invoices", "expenses", "reports"],
      notifications: { events: ["invoice_overdue", "expense_submitted", "budget_alert"] },
      reportAccess: ["financial_summary", "department_budgets", "invoice_aging"],
      giConversation: { topics: ["budgets", "invoices", "expenses", "financial_reports"], tier: 2 },
    },
    {
      role: "CONTRACTOR" as const,
      dashboardViews: ["my_tasks", "calendar"],
      notifications: { events: ["task_assigned", "task_comment"] },
      reportAccess: ["my_performance"],
      giConversation: { topics: ["my_tasks", "guidelines"], tier: 4 },
    },
  ];

  for (const rs of roleSeeds) {
    await prisma.roleConfig.upsert({
      where: { role: rs.role },
      update: {},
      create: rs,
    });
  }

  console.log("Role configs created");

  // ─── Achievement Definitions ──────────────────────────
  const achievementSeeds = [
    // Milestones
    { key: "first_task", name: "First Steps", description: "Complete your first task", icon: "🎯", category: "milestone", threshold: 1, points: 10 },
    { key: "ten_tasks", name: "Getting Started", description: "Complete 10 tasks", icon: "📋", category: "milestone", threshold: 10, points: 25 },
    { key: "fifty_tasks", name: "Consistent Performer", description: "Complete 50 tasks", icon: "🏅", category: "milestone", threshold: 50, points: 50 },
    { key: "hundred_tasks", name: "Century Club", description: "Complete 100 tasks", icon: "💯", category: "milestone", threshold: 100, points: 100 },
    { key: "five_hundred_tasks", name: "Legend", description: "Complete 500 tasks", icon: "👑", category: "milestone", threshold: 500, points: 250 },
    // Streaks
    { key: "streak_3", name: "Hat Trick", description: "Maintain a 3-day streak", icon: "🔥", category: "streak", threshold: 3, points: 15 },
    { key: "streak_7", name: "Weekly Warrior", description: "Maintain a 7-day streak", icon: "🔥", category: "streak", threshold: 7, points: 30 },
    { key: "streak_14", name: "Fortnight Force", description: "Maintain a 14-day streak", icon: "🔥", category: "streak", threshold: 14, points: 60 },
    { key: "streak_30", name: "Monthly Machine", description: "Maintain a 30-day streak", icon: "🔥", category: "streak", threshold: 30, points: 150 },
    // Quality
    { key: "first_pass_5", name: "Sharp Shooter", description: "Get 5 first-pass approvals", icon: "✅", category: "quality", threshold: 5, points: 20 },
    { key: "first_pass_20", name: "Precision Pro", description: "Get 20 first-pass approvals", icon: "✅", category: "quality", threshold: 20, points: 50 },
    { key: "quality_master", name: "Quality Master", description: "Achieve 95%+ approval rate over 50 tasks", icon: "💎", category: "quality", threshold: 95, points: 200 },
    // Speed
    { key: "speed_demon", name: "Speed Demon", description: "Complete a task on the same day it was created", icon: "⚡", category: "speed", threshold: 1, points: 15 },
    { key: "rapid_fire", name: "Rapid Fire", description: "Complete 3 tasks in a single day", icon: "🚀", category: "speed", threshold: 3, points: 30 },
    // Collaboration
    { key: "team_player", name: "Team Player", description: "Leave 10 comments on others' tasks", icon: "🤝", category: "collaboration", threshold: 10, points: 25 },
    { key: "mentor", name: "Mentor", description: "Help 5 different users via comments", icon: "🎓", category: "collaboration", threshold: 5, points: 40 },
    // Special
    { key: "early_bird", name: "Early Bird", description: "Complete a task before 9 AM", icon: "🌅", category: "special", threshold: 1, points: 10 },
    { key: "night_owl", name: "Night Owl", description: "Complete a task after 9 PM", icon: "🦉", category: "special", threshold: 1, points: 10 },
    { key: "weekend_warrior", name: "Weekend Warrior", description: "Complete a task on a weekend", icon: "🏋️", category: "special", threshold: 1, points: 15 },
  ];

  for (const a of achievementSeeds) {
    await prisma.achievement.upsert({
      where: { key: a.key },
      update: { name: a.name, description: a.description, icon: a.icon, category: a.category, threshold: a.threshold, points: a.points },
      create: a,
    });
  }

  console.log(`Seeded ${achievementSeeds.length} achievements`);

  // ─── Demo Team Members ────────────────────────────────
  const demoUsers = [
    { email: "arjun@demo.shownomore.com", name: "Arjun Mehta", role: "DEPT_HEAD" as const, deptName: "Media" },
    { email: "priya@demo.shownomore.com", name: "Priya Sharma", role: "MEMBER" as const, deptName: "Media" },
    { email: "rohit@demo.shownomore.com", name: "Rohit Kumar", role: "MEMBER" as const, deptName: "Tech" },
    { email: "neha@demo.shownomore.com", name: "Neha Gupta", role: "DEPT_HEAD" as const, deptName: "Tech" },
    { email: "vikram@demo.shownomore.com", name: "Vikram Singh", role: "MEMBER" as const, deptName: "Marketing" },
    { email: "ananya@demo.shownomore.com", name: "Ananya Patel", role: "MEMBER" as const, deptName: "Production" },
    { email: "kiran@demo.shownomore.com", name: "Kiran Reddy", role: "HEAD_HR" as const, deptName: "HR & Operations" },
    { email: "finance@demo.shownomore.com", name: "Deepak Joshi", role: "FINANCE" as const, deptName: "HR & Operations" },
  ];

  const createdUsers: Record<string, string> = {};
  for (const du of demoUsers) {
    const dept = departments.find((d) => d.name === du.deptName);
    const user = await prisma.user.upsert({
      where: { email: du.email },
      update: {},
      create: {
        email: du.email,
        name: du.name,
        role: du.role,
        isActive: true,
        primaryDeptId: dept?.id,
      },
    });
    createdUsers[du.email] = user.id;

    // Add as department member
    if (dept) {
      await prisma.departmentMember.upsert({
        where: { userId_departmentId: { userId: user.id, departmentId: dept.id } },
        update: {},
        create: { userId: user.id, departmentId: dept.id, isPrimary: true },
      });
    }

    // Set as dept head
    if (du.role === "DEPT_HEAD" && dept) {
      await prisma.department.update({ where: { id: dept.id }, data: { headId: user.id } });
    }
  }

  console.log(`Created ${demoUsers.length} demo users`);

  // ─── Demo Tasks ──────────────────────────────────────
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
  const daysFromNow = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

  const brands = await prisma.brand.findMany({ take: 2 });
  const brandId = brands[0]?.id;

  const taskData = [
    { title: "Edit Bhupendra Chaubey interview — Episode 45", status: "IN_PROGRESS" as const, priority: "HIGH" as const, assignee: "priya@demo.shownomore.com", dept: "Media", due: daysFromNow(2), weight: 3 },
    { title: "YouTube thumbnail for Breaking Tube Ep 45", status: "ASSIGNED" as const, priority: "MEDIUM" as const, assignee: "ananya@demo.shownomore.com", dept: "Production", due: daysFromNow(3), weight: 1 },
    { title: "Write script for The Squirrels weekly analysis", status: "REVIEW" as const, priority: "HIGH" as const, assignee: "priya@demo.shownomore.com", dept: "Media", due: daysFromNow(1), weight: 2 },
    { title: "Deploy PMS v2 hotfix — notification bell", status: "DONE" as const, priority: "URGENT" as const, assignee: "rohit@demo.shownomore.com", dept: "Tech", due: daysAgo(1), weight: 2, completedAt: daysAgo(1) },
    { title: "Set up Instagram Reels automation pipeline", status: "IN_PROGRESS" as const, priority: "MEDIUM" as const, assignee: "rohit@demo.shownomore.com", dept: "Tech", due: daysFromNow(5), weight: 4 },
    { title: "Q1 campaign strategy for Breaking Tube", status: "APPROVED" as const, priority: "HIGH" as const, assignee: "vikram@demo.shownomore.com", dept: "Marketing", due: daysAgo(2), weight: 3 },
    { title: "Color grade B-roll footage — Delhi shoot", status: "ASSIGNED" as const, priority: "LOW" as const, assignee: "ananya@demo.shownomore.com", dept: "Production", due: daysFromNow(7), weight: 2 },
    { title: "Monthly HR compliance report", status: "CREATED" as const, priority: "MEDIUM" as const, assignee: null, dept: "HR & Operations", due: daysFromNow(10), weight: 1 },
    { title: "Optimize database queries for dashboard API", status: "IN_PROGRESS" as const, priority: "HIGH" as const, assignee: "rohit@demo.shownomore.com", dept: "Tech", due: daysFromNow(3), weight: 3 },
    { title: "Social media calendar for March", status: "DONE" as const, priority: "MEDIUM" as const, assignee: "vikram@demo.shownomore.com", dept: "Marketing", due: daysAgo(3), weight: 2, completedAt: daysAgo(4) },
    { title: "Record podcast intro jingle", status: "CANCELLED" as const, priority: "LOW" as const, assignee: "priya@demo.shownomore.com", dept: "Media", due: daysAgo(5), weight: 1 },
    { title: "PPC report for client review — February", status: "REVIEW" as const, priority: "HIGH" as const, assignee: "vikram@demo.shownomore.com", dept: "Marketing", due: daysFromNow(0), weight: 2 },
  ];

  for (const td of taskData) {
    const dept = departments.find((d) => d.name === td.dept);
    await prisma.task.create({
      data: {
        title: td.title,
        status: td.status,
        priority: td.priority,
        difficultyWeight: td.weight,
        creatorId: admin.id,
        assigneeId: td.assignee ? createdUsers[td.assignee] : null,
        departmentId: dept?.id,
        brandId: td.status !== "CREATED" ? brandId : undefined,
        dueDate: td.due,
        startedAt: ["IN_PROGRESS", "REVIEW", "APPROVED", "DONE"].includes(td.status) ? daysAgo(5) : null,
        completedAt: (td as Record<string, unknown>).completedAt as Date | undefined,
      },
    });
  }

  console.log(`Created ${taskData.length} demo tasks`);

  // ─── Demo Credibility Scores ──────────────────────────
  const credibilityData = [
    { email: "priya@demo.shownomore.com", reliability: 78, quality: 85, consistency: 72, overall: 78, completed: 34, onTime: 28, late: 6 },
    { email: "rohit@demo.shownomore.com", reliability: 92, quality: 88, consistency: 90, overall: 90, completed: 45, onTime: 42, late: 3 },
    { email: "vikram@demo.shownomore.com", reliability: 65, quality: 70, consistency: 60, overall: 65, completed: 22, onTime: 15, late: 7 },
    { email: "ananya@demo.shownomore.com", reliability: 85, quality: 90, consistency: 82, overall: 86, completed: 28, onTime: 25, late: 3 },
  ];

  for (const cd of credibilityData) {
    const userId = createdUsers[cd.email];
    if (!userId) continue;
    await prisma.credibilityScore.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        reliability: cd.reliability,
        quality: cd.quality,
        consistency: cd.consistency,
        overallScore: cd.overall,
        tasksCompleted: cd.completed,
        tasksOnTime: cd.onTime,
        tasksLate: cd.late,
      },
    });
  }

  console.log("Demo credibility scores created");

  // ─── Demo Hiring Positions & Candidates ───────────────
  const mediaDeptId = departments.find((d) => d.name === "Media")?.id;
  const techDeptId = departments.find((d) => d.name === "Tech")?.id;

  if (mediaDeptId) {
    const pos = await prisma.hiringPosition.upsert({
      where: { id: "demo-position-editor" },
      update: {},
      create: {
        id: "demo-position-editor",
        title: "Senior Video Editor",
        departmentId: mediaDeptId,
        description: "Looking for an experienced editor with Premiere Pro and DaVinci Resolve skills.",
        requirements: ["5+ years experience", "Premiere Pro", "DaVinci Resolve", "Motion Graphics"],
      },
    });
    await prisma.hiringCandidate.upsert({
      where: { id: "demo-candidate-1" },
      update: {},
      create: { id: "demo-candidate-1", name: "Amit Verma", email: "amit@example.com", phone: "+91 9876543210", status: "INTERVIEW", positionId: pos.id, rating: 4, notes: "Strong portfolio, scheduled for technical round" },
    });
    await prisma.hiringCandidate.upsert({
      where: { id: "demo-candidate-2" },
      update: {},
      create: { id: "demo-candidate-2", name: "Sneha Kapoor", email: "sneha@example.com", status: "SCREENING", positionId: pos.id, rating: 3, notes: "Impressive reel, reviewing references" },
    });
  }

  if (techDeptId) {
    await prisma.hiringPosition.upsert({
      where: { id: "demo-position-dev" },
      update: {},
      create: {
        id: "demo-position-dev",
        title: "Full Stack Developer",
        departmentId: techDeptId,
        description: "Next.js, TypeScript, PostgreSQL experience required.",
        requirements: ["Next.js", "TypeScript", "PostgreSQL", "3+ years"],
      },
    });
  }

  console.log("Demo hiring data created");

  // ─── Demo Streaks ──────────────────────────────────────
  const streakData = [
    { email: "rohit@demo.shownomore.com", current: 12, longest: 18, xp: 850, level: 5 },
    { email: "priya@demo.shownomore.com", current: 5, longest: 9, xp: 520, level: 3 },
    { email: "ananya@demo.shownomore.com", current: 8, longest: 14, xp: 680, level: 4 },
    { email: "vikram@demo.shownomore.com", current: 2, longest: 6, xp: 310, level: 2 },
  ];

  for (const sd of streakData) {
    const userId = createdUsers[sd.email];
    if (!userId) continue;
    await prisma.userStreak.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        currentStreak: sd.current,
        longestStreak: sd.longest,
        totalXp: sd.xp,
        level: sd.level,
        lastActivityAt: daysAgo(0),
      },
    });
  }

  console.log("Demo streaks created");

  // ─── Demo Invoices ──────────────────────────────────────
  const invoiceData = [
    { number: "INV-00001", status: "PAID" as const, amount: 150000, tax: 27000, totalAmount: 177000, dueDate: daysAgo(10), description: "Video production — Breaking Tube Ep 40-44" },
    { number: "INV-00002", status: "SENT" as const, amount: 85000, tax: 15300, totalAmount: 100300, dueDate: daysFromNow(15), description: "Monthly retainer — The Squirrels March" },
    { number: "INV-00003", status: "DRAFT" as const, amount: 45000, tax: 8100, totalAmount: 53100, dueDate: daysFromNow(30), description: "Social media management — Q1" },
    { number: "INV-00004", status: "OVERDUE" as const, amount: 120000, tax: 21600, totalAmount: 141600, dueDate: daysAgo(5), description: "PPC campaign setup and management" },
    { number: "INV-00005", status: "PAID" as const, amount: 75000, tax: 13500, totalAmount: 88500, dueDate: daysAgo(20), description: "Photography shoot — product catalog" },
  ];

  for (const inv of invoiceData) {
    await prisma.invoice.upsert({
      where: { number: inv.number },
      update: {},
      create: {
        ...inv,
        brandId: brandId || undefined,
        clientId: client.id,
        createdById: admin.id,
        items: undefined,
      },
    });
  }

  console.log(`Created ${invoiceData.length} demo invoices`);

  // ─── Demo Expenses ──────────────────────────────────────
  const expenseData = [
    { title: "Adobe Creative Cloud — Annual License", category: "SOFTWARE" as const, amount: 58000, dept: "Media", date: daysAgo(15) },
    { title: "Camera equipment rental — Delhi shoot", category: "EQUIPMENT" as const, amount: 35000, dept: "Photography & Cinematography", date: daysAgo(8) },
    { title: "Team travel — Client meeting Mumbai", category: "TRAVEL" as const, amount: 42000, dept: "Marketing", date: daysAgo(12) },
    { title: "Office supplies — Q1", category: "OFFICE" as const, amount: 12000, dept: "HR & Operations", date: daysAgo(20) },
    { title: "Facebook Ads spend — February", category: "MARKETING" as const, amount: 95000, dept: "PPC", date: daysAgo(5) },
    { title: "Freelance editor payment — Ep 42-44", category: "PRODUCTION" as const, amount: 60000, dept: "Production", date: daysAgo(3) },
    { title: "Server hosting — AWS February", category: "SOFTWARE" as const, amount: 28000, dept: "Tech", date: daysAgo(2) },
    { title: "Team lunch — department outing", category: "MISCELLANEOUS" as const, amount: 8500, dept: "Media", date: daysAgo(7) },
  ];

  for (const exp of expenseData) {
    const dept = departments.find((d) => d.name === exp.dept);
    await prisma.expense.create({
      data: {
        title: exp.title,
        category: exp.category,
        amount: exp.amount,
        departmentId: dept?.id,
        date: exp.date,
        createdById: admin.id,
      },
    });
  }

  console.log(`Created ${expenseData.length} demo expenses`);

  // ─── Demo Notifications ─────────────────────────────────
  const notifData = [
    { userId: createdUsers["priya@demo.shownomore.com"], type: "TASK_ASSIGNED" as const, title: "New task assigned", message: "Stallone2K assigned you \"Edit Bhupendra Chaubey interview — Episode 45\"", link: "/tasks" },
    { userId: createdUsers["rohit@demo.shownomore.com"], type: "TASK_STATUS_CHANGED" as const, title: "Task status updated", message: "\"Deploy PMS v2 hotfix\" moved from IN_PROGRESS to DONE", link: "/pms/board" },
    { userId: createdUsers["vikram@demo.shownomore.com"], type: "TASK_OVERDUE" as const, title: "Task overdue", message: "\"PPC report for client review\" is past its due date", link: "/tasks" },
    { userId: admin.id, type: "SYSTEM" as const, title: "Invoice paid", message: "Invoice INV-00001 has been marked as paid", link: "/finance" },
  ];

  for (const n of notifData) {
    if (!n.userId) continue;
    await prisma.notification.create({ data: n });
  }

  console.log(`Created ${notifData.length} demo notifications`);

  // ─── Relay: Content Posts ─────────────────────────────
  const breakingTube = await prisma.brand.findUnique({ where: { slug: "breaking-tube" } });
  const squirrels = await prisma.brand.findUnique({ where: { slug: "the-squirrels" } });

  if (breakingTube && squirrels) {
    const now = new Date();
    const contentPosts = [
      {
        title: "Bhupendra Chaubey Exclusive — PM Modi Interview Analysis",
        content: "Deep-dive analysis of the PM Modi interview. Key takeaways, body language cues, and political implications discussed.",
        platform: "youtube",
        brandId: breakingTube.id,
        status: "PUBLISHED" as const,
        scheduledAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        publishedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        publishedUrl: "https://youtube.com/watch?v=demo1",
        createdById: admin.id,
      },
      {
        title: "Weekend Political Roundup — Episode 52",
        content: "Weekly roundup covering parliament sessions, opposition strategy, and upcoming state elections.",
        platform: "youtube",
        brandId: breakingTube.id,
        status: "SCHEDULED" as const,
        scheduledAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        createdById: admin.id,
      },
      {
        title: "Breaking: Budget Session Highlights Reel",
        content: "Quick 60-second reel covering the Union Budget highlights for Instagram.",
        platform: "instagram",
        brandId: breakingTube.id,
        status: "QUEUED" as const,
        createdById: admin.id,
      },
      {
        title: "The Squirrels — Political Satire Ep 18",
        content: "Satirical take on the latest political developments with animated squirrel characters.",
        platform: "youtube",
        brandId: squirrels.id,
        status: "DRAFT" as const,
        createdById: admin.id,
      },
      {
        title: "Squirrels Quick Take — LinkedIn Carousel",
        content: "5-slide carousel summarizing this week's political landscape for professional audience.",
        platform: "linkedin",
        brandId: squirrels.id,
        status: "PUBLISHED" as const,
        scheduledAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        publishedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        publishedUrl: "https://linkedin.com/posts/demo1",
        createdById: admin.id,
      },
      {
        title: "Twitter Thread — Election Analysis",
        content: "10-tweet thread analyzing the upcoming state elections with polling data and ground reports.",
        platform: "x",
        brandId: breakingTube.id,
        status: "FAILED" as const,
        scheduledAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        errorMessage: "API rate limit exceeded. Retry after 15 minutes.",
        createdById: admin.id,
      },
    ];

    for (const post of contentPosts) {
      const created = await prisma.contentPost.create({ data: post });
      // Add analytics for published posts
      if (post.status === "PUBLISHED") {
        await prisma.postAnalytics.create({
          data: {
            postId: created.id,
            views: Math.floor(Math.random() * 50000) + 5000,
            likes: Math.floor(Math.random() * 3000) + 500,
            shares: Math.floor(Math.random() * 500) + 50,
            comments: Math.floor(Math.random() * 200) + 20,
            clicks: Math.floor(Math.random() * 1000) + 100,
            engagementRate: parseFloat((Math.random() * 8 + 2).toFixed(2)),
          },
        });
      }
    }

    // Calendar entries
    for (let i = 0; i < 7; i++) {
      const entryDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      if (i % 2 === 0) {
        await prisma.contentCalendarEntry.create({
          data: {
            date: entryDate,
            brandId: i < 4 ? breakingTube.id : squirrels.id,
            platform: ["youtube", "instagram", "x", "linkedin"][i % 4],
            title: `Planned content for ${entryDate.toLocaleDateString()}`,
            description: "Auto-generated calendar entry for demo",
            deliverableType: ["video", "carousel", "reel", "post"][i % 4],
            createdById: admin.id,
          },
        });
      }
    }

    console.log(`Created ${contentPosts.length} content posts with analytics and calendar entries`);
  }

  // ─── Communication: Announcements ────────────────────
  const announcements = [
    {
      title: "Q1 Performance Review Cycle Begins",
      content: "The quarterly performance review cycle starts next Monday. All department heads must submit their team evaluations by March 25th. Please ensure all task updates are current in PMS before the review begins.",
      priority: "HIGH" as const,
      isPinned: true,
      authorId: admin.id,
    },
    {
      title: "New Office Wi-Fi Password",
      content: "The office Wi-Fi password has been updated for security. New credentials have been shared via email. Please reconnect your devices at your earliest convenience.",
      priority: "NORMAL" as const,
      isPinned: false,
      authorId: admin.id,
    },
    {
      title: "Diwali Office Closure Notice",
      content: "The office will remain closed from October 31st to November 3rd for Diwali celebrations. Please plan your deliverables accordingly. Emergency contacts will be shared separately.",
      priority: "URGENT" as const,
      isPinned: true,
      authorId: admin.id,
    },
    {
      title: "Team Lunch This Friday",
      content: "We're organizing a team lunch this Friday at 1 PM. Join us at the cafeteria for some good food and team bonding!",
      priority: "LOW" as const,
      isPinned: false,
      authorId: admin.id,
    },
  ];

  for (const ann of announcements) {
    await prisma.announcement.create({ data: ann });
  }

  console.log(`Created ${announcements.length} announcements`);

  // ─── Communication: Feedback Channels ────────────────
  const feedbackChannels = [
    {
      name: "General Suggestions",
      description: "Share ideas for improving workplace processes, tools, or culture",
      isAnonymous: true,
    },
    {
      name: "Tech Tooling Requests",
      description: "Request new software, tools, or improvements to existing tech stack",
      isAnonymous: false,
    },
    {
      name: "HR & Policy Feedback",
      description: "Provide feedback on HR policies, benefits, and workplace guidelines",
      isAnonymous: true,
    },
  ];

  for (const channel of feedbackChannels) {
    const created = await prisma.feedbackChannel.create({ data: channel });
    await prisma.feedbackEntry.create({
      data: {
        channelId: created.id,
        content: `Sample feedback for ${channel.name}. This is a demo entry to showcase the feedback system.`,
        userId: admin.id,
        status: "open",
        upvotes: Math.floor(Math.random() * 10),
      },
    });
  }

  console.log(`Created ${feedbackChannels.length} feedback channels with sample entries`);

  // ─── Vritti: Article Categories ───────────────────────
  const categories = await Promise.all([
    prisma.articleCategory.upsert({
      where: { slug: "political-analysis" },
      update: {},
      create: { name: "Political Analysis", slug: "political-analysis", description: "Deep dives into political events and policy", color: "#2E86AB" },
    }),
    prisma.articleCategory.upsert({
      where: { slug: "media-industry" },
      update: {},
      create: { name: "Media Industry", slug: "media-industry", description: "Trends and news from the media landscape", color: "#A23B72" },
    }),
    prisma.articleCategory.upsert({
      where: { slug: "op-ed" },
      update: {},
      create: { name: "Op-Ed", slug: "op-ed", description: "Opinion and editorial pieces", color: "#F18F01" },
    }),
    prisma.articleCategory.upsert({
      where: { slug: "tech-culture" },
      update: {},
      create: { name: "Tech & Culture", slug: "tech-culture", description: "Technology impact on society and culture", color: "#048A81" },
    }),
  ]);

  console.log(`Created ${categories.length} article categories`);

  // ─── Vritti: Demo Articles ─────────────────────────────
  const articles = [
    {
      title: "The Evolution of Indian Political Journalism",
      slug: "evolution-indian-political-journalism",
      excerpt: "How digital media transformed political reporting in India over the last decade.",
      body: "Political journalism in India has undergone a seismic shift. The rise of digital platforms, independent creators, and social media has democratized news consumption while creating new challenges for traditional outlets.\n\nIn this article, we explore the key inflection points that shaped today's media landscape, from the 2014 social media election to the current era of YouTube-first journalism.",
      status: "PUBLISHED" as const,
      categoryId: categories[1].id,
      tags: ["journalism", "india", "digital-media"],
      authorId: admin.id,
      wordCount: 1850,
      readTimeMin: 8,
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      title: "Budget 2026: Winners and Losers",
      slug: "budget-2026-winners-losers",
      excerpt: "A comprehensive analysis of who benefits and who pays in the new Union Budget.",
      body: "The Union Budget 2026 brought sweeping changes to tax policy, infrastructure spending, and social welfare programs. Let's break down the key announcements sector by sector.",
      status: "REVIEW" as const,
      categoryId: categories[0].id,
      tags: ["budget", "economy", "policy"],
      authorId: admin.id,
      wordCount: 2400,
      readTimeMin: 10,
    },
    {
      title: "Why YouTube is the New Prime Time",
      slug: "youtube-new-prime-time",
      excerpt: "YouTube creators are outperforming traditional TV channels in reach and engagement.",
      body: "",
      status: "DRAFTING" as const,
      categoryId: categories[1].id,
      tags: ["youtube", "media", "creators"],
      authorId: admin.id,
      wordCount: 0,
      readTimeMin: 0,
    },
    {
      title: "AI in Newsrooms: Threat or Tool?",
      slug: "ai-newsrooms-threat-or-tool",
      excerpt: "Exploring how artificial intelligence is reshaping editorial workflows.",
      body: "",
      status: "IDEA" as const,
      categoryId: categories[3].id,
      tags: ["ai", "newsrooms", "technology"],
      authorId: admin.id,
      wordCount: 0,
      readTimeMin: 0,
    },
    {
      title: "State Elections 2026: Ground Report from Maharashtra",
      slug: "state-elections-2026-maharashtra",
      excerpt: "On-the-ground reporting from key constituencies ahead of Maharashtra state elections.",
      body: "Our team spent three weeks in Maharashtra's key swing constituencies, speaking with voters, party workers, and local leaders. Here's what we found.",
      status: "EDITING" as const,
      categoryId: categories[0].id,
      tags: ["elections", "maharashtra", "ground-report"],
      authorId: admin.id,
      wordCount: 3200,
      readTimeMin: 14,
    },
  ];

  for (const article of articles) {
    await prisma.article.create({ data: article });
  }

  console.log(`Created ${articles.length} demo articles`);

  // ─── Client Deliverables ──────────────────────────────
  if (breakingTube && squirrels) {
    const deliverables = [
      {
        clientId: client.id,
        brandId: breakingTube.id,
        title: "Bhupendra Chaubey Interview — Final Edit",
        description: "Final edited version of the PM Modi interview analysis video, ready for client review.",
        type: "video",
        status: "ready_for_review",
      },
      {
        clientId: client.id,
        brandId: breakingTube.id,
        title: "Monthly Performance Report — February 2026",
        description: "Monthly analytics report covering views, engagement, and audience growth.",
        type: "report",
        status: "approved",
        approvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        clientId: client.id,
        brandId: squirrels.id,
        title: "Squirrels Episode 18 — Storyboard",
        description: "Storyboard and script for the next satirical episode.",
        type: "graphic",
        status: "pending",
      },
      {
        clientId: client.id,
        brandId: breakingTube.id,
        title: "Instagram Reel — Budget Highlights",
        description: "60-second reel covering Union Budget highlights for Instagram.",
        type: "social_post",
        status: "final",
        approvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const d of deliverables) {
      await prisma.clientDeliverable.create({ data: d });
    }

    // Client reports
    await prisma.clientReport.create({
      data: {
        clientId: client.id,
        brandId: breakingTube.id,
        title: "Breaking Tube — February 2026 Report",
        period: "2026-02",
        type: "monthly",
        metrics: {
          totalViews: 245000,
          totalEngagement: 18500,
          postsPublished: 12,
          avgEngagementRate: 4.2,
          topContent: "PM Modi Interview Analysis",
          subscriberGrowth: 3200,
          impressions: 520000,
        },
        summary: "Strong month with the PM Modi interview driving significant viewership. Engagement rate improved by 0.8% over January. Subscriber growth steady at 3,200 new subscribers.",
      },
    });

    console.log("Created client deliverables and reports");
  }

  // ─── Cross-Department Dependencies ─────────────────────
  const mediaDeptRef = departments.find((d) => d.name === "Media");
  const techDeptRef = departments.find((d) => d.name === "Tech");
  const prodDept = departments.find((d) => d.name === "Production");
  const mktDept = departments.find((d) => d.name === "Marketing");

  if (mediaDeptRef && techDeptRef && prodDept && mktDept) {
    const deps = [
      {
        fromDeptId: mediaDeptRef.id,
        toDeptId: prodDept.id,
        description: "Waiting for final video edit of Episode 45 before publishing",
        status: "waiting",
        priority: "high",
        createdById: admin.id,
      },
      {
        fromDeptId: mktDept.id,
        toDeptId: techDeptRef.id,
        description: "Need landing page deployment for campaign launch",
        status: "acknowledged",
        priority: "medium",
        createdById: admin.id,
      },
      {
        fromDeptId: techDeptRef.id,
        toDeptId: mediaDeptRef.id,
        description: "CMS integration testing requires sample content uploads",
        status: "resolved",
        priority: "low",
        createdById: admin.id,
        resolvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const dep of deps) {
      await prisma.crossDeptDependency.create({ data: dep });
    }

    console.log(`Created ${deps.length} cross-department dependencies`);
  }

  // ─── GI Motivation Profiles ────────────────────────────
  await prisma.gIMotivationProfile.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      preferredTone: "direct",
      nudgeFrequency: "normal",
      motivators: ["achievement", "mastery"],
      demotivators: ["micromanagement"],
    },
  });

  console.log("Created GI motivation profiles");

  // ─── Phase 5: GI Adult Data ──────────────────────────────

  // GI Tier Assignments (default autonomy levels)
  const adultTierAssignments = [
    { actionType: "task_reassignment", tier: 3 },     // Act & notify
    { actionType: "deadline_extension", tier: 2 },     // Suggest only
    { actionType: "workload_rebalance", tier: 2 },     // Suggest only
    { actionType: "leaderboard_update", tier: 4 },     // Fully automatic
    { actionType: "performance_warning", tier: 1 },    // Inform only
    { actionType: "budget_allocation", tier: 1 },      // Inform only
    { actionType: "notification_batch", tier: 4 },     // Fully automatic
    { actionType: "scheduling", tier: 3 },             // Act & notify
    { actionType: "broll_sourcing", tier: 4 },         // Fully automatic
    { actionType: "social_posting", tier: 2 },         // Require approval
  ];

  for (const ta of adultTierAssignments) {
    await prisma.gITierAssignment.upsert({
      where: { actionType: ta.actionType },
      update: { tier: ta.tier, updatedBy: admin.id },
      create: { ...ta, updatedBy: admin.id },
    });
  }
  console.log(`Created ${adultTierAssignments.length} GI tier assignments`);

  // GI Predictions (sample)
  const predictions = [
    {
      type: "deadline_risk",
      confidence: 0.82,
      severity: "high",
      title: "Deadline risk: YouTube Thumbnail Redesign",
      description: "Based on historical pace (6h per unit), this 3-weight task needs ~18h but only 12h remain before the deadline.",
      data: { estimatedHours: 18, hoursRemaining: 12, riskRatio: 1.5 },
      targetUserId: admin.id,
      predictsAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
    },
    {
      type: "capacity_crunch",
      confidence: 0.71,
      severity: "medium",
      title: "Capacity crunch for Media team next week",
      description: "Media department has 15 tasks due next week vs weekly average of 8.",
      data: { upcomingDue: 15, weeklyAvg: 8, overloadPct: 87 },
      departmentId: departments[0].id,
      predictsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    {
      type: "burnout_risk",
      confidence: 0.65,
      severity: "critical",
      title: "Potential burnout risk detected",
      description: "High workload (12 tasks), declining sentiment (2.1/5), quality score dropping.",
      data: { taskCount: 12, avgSentiment: 2.1, qualityScore: 35 },
      targetUserId: admin.id,
      predictsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const pred of predictions) {
    await prisma.gIPrediction.create({ data: pred });
  }
  console.log(`Created ${predictions.length} GI predictions`);

  // GI Learning Logs (sample organizational learnings)
  const learnings = [
    {
      category: "rhythm",
      key: "user_peak_hours",
      value: { peakStart: 10, peakEnd: 14, peakHours: [10, 11, 13], confidence: 0.72 },
      confidence: 0.72,
      observations: 45,
      userId: admin.id,
    },
    {
      category: "pattern",
      key: "avg_approval_time",
      value: { avgHours: 8.3, dataPoints: 28 },
      confidence: 0.68,
      observations: 28,
      userId: admin.id,
    },
    {
      category: "rhythm",
      key: "dept_velocity_baseline",
      value: { weeklyAvg: 12, stdDev: 3.2, peakDay: "Wednesday" },
      confidence: 0.61,
      observations: 16,
      departmentId: departments[0].id,
    },
    {
      category: "pattern",
      key: "review_bottleneck_time",
      value: { avgStaleHours: 36, threshold: 48, escalationRate: 0.15 },
      confidence: 0.55,
      observations: 20,
      departmentId: departments[1].id,
    },
  ];

  for (const l of learnings) {
    await prisma.gILearningLog.create({ data: l });
  }
  console.log(`Created ${learnings.length} GI learning logs`);

  // GI Autonomous Actions (sample)
  const autoActions = [
    {
      actionType: "task_reassignment",
      tier: 3,
      status: "EXECUTED" as const,
      description: 'Reassigned review of "API Documentation Update" — stuck for 52 hours',
      targetEntity: "task:sample1",
      actionData: { taskId: "sample1", action: "escalate_review" },
      reasoning: "Task has been in REVIEW status for over 48 hours without progress.",
      result: { action: "escalated_review", taskId: "sample1" },
      executedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    },
    {
      actionType: "deadline_extension",
      tier: 2,
      status: "PENDING" as const,
      description: 'Extend deadline for "Brand Guidelines V2" by 2 days — capacity crunch detected',
      targetUserId: admin.id,
      targetEntity: "task:sample2",
      actionData: { taskId: "sample2", newDueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString() },
      reasoning: "User has 8 tasks due this week vs 5-task average. Extending this low-priority task reduces burnout risk.",
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
    },
    {
      actionType: "notification_batch",
      tier: 4,
      status: "EXECUTED" as const,
      description: "Batched 7 low-priority notifications into daily digest",
      actionData: { notificationIds: ["n1", "n2", "n3", "n4", "n5", "n6", "n7"], batchType: "daily_digest" },
      reasoning: "User preference for minimal notifications. 7 low-priority notifications batched to reduce cognitive load.",
      result: { action: "notifications_batched", count: 7 },
      executedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  ];

  for (const action of autoActions) {
    await prisma.gIAutonomousAction.create({ data: action });
  }
  console.log(`Created ${autoActions.length} GI autonomous actions`);

  // ─── Phase 5: Multi-Tenant SaaS Foundation ─────────────

  // Create ShowNoMore as the primary organization
  const org = await prisma.organization.upsert({
    where: { slug: "shownomore" },
    update: {},
    create: {
      name: "ShowNoMore",
      slug: "shownomore",
      plan: "enterprise",
      maxUsers: 50,
      settings: { timezone: "Asia/Kolkata", locale: "en-IN", brandColor: "#2E86AB" },
      features: { gi_adult: true, vritti: true, relay: true, hoccr: true, saas_admin: true },
      onboardingStep: "complete",
    },
  });

  // Create SaaS products
  const products = [
    { product: "daftar", displayName: "Daftar OS", description: "Organizational operating system with SSO, role management, and unified dashboards" },
    { product: "hoccr", displayName: "HOCCR", description: "Hiring, Operations, Culture, Communication & Reporting — standalone HR/Ops intelligence" },
    { product: "relay", displayName: "Relay", description: "Content distribution platform with scheduling, posting, and cross-platform analytics" },
    { product: "yantri", displayName: "Yantri", description: "AI narrative intelligence orchestrator — autonomous content assembly pipeline" },
    { product: "khabri", displayName: "Khabri", description: "Signal detection engine for news, trends, and social media monitoring" },
  ];

  for (const p of products) {
    await prisma.saaSProduct.upsert({
      where: { organizationId_product: { organizationId: org.id, product: p.product } },
      update: {},
      create: { ...p, organizationId: org.id },
    });
  }
  console.log(`Created organization "${org.name}" with ${products.length} SaaS products`);

  // ─── Signal Intelligence: Trends & Signals ──────────────
  const trend1 = await prisma.trend.create({
    data: {
      name: "India-Iran Economic Corridor Tensions",
      description: "Escalating geopolitical tensions impacting India-Iran Chabahar port agreement and broader economic ties",
      lifecycle: "peaking",
      velocityScore: 7.5,
    },
  });

  const trend2 = await prisma.trend.create({
    data: {
      name: "Indian Tech Layoffs Q1 2026",
      description: "Wave of layoffs across major Indian IT companies amid AI automation concerns",
      lifecycle: "emerging",
      velocityScore: 4.2,
    },
  });

  const trend3 = await prisma.trend.create({
    data: {
      name: "Rupee Depreciation Against Dollar",
      description: "Indian Rupee hitting record lows against USD driven by oil price surge and FII outflows",
      lifecycle: "declining",
      velocityScore: 2.1,
    },
  });

  // Signals for trend 1
  await prisma.signal.createMany({
    data: [
      {
        trendId: trend1.id,
        title: "India pauses Chabahar port investment amid US sanctions warning",
        content: "India has reportedly paused further investment in the Chabahar port project following renewed US sanctions threats against Iran.",
        source: "Reuters",
        sourceCredibility: 0.95,
        eventType: "political",
        stakeholders: { people: ["PM Modi", "Iran FM"], organizations: ["MEA", "US State Dept"] },
        geoRelevance: { india: 0.95, us: 0.6, iran: 0.9, global: 0.5 },
        sentiment: "negative",
      },
      {
        trendId: trend1.id,
        title: "Oil prices surge 8% as Gulf tensions escalate",
        content: "Brent crude crosses $92/barrel following military posturing in the Strait of Hormuz, directly impacting India's import bill.",
        source: "Bloomberg",
        sourceCredibility: 0.92,
        eventType: "economic",
        stakeholders: { organizations: ["OPEC", "Indian Oil Ministry"] },
        geoRelevance: { india: 0.85, us: 0.4, global: 0.7 },
        sentiment: "negative",
      },
      {
        trendId: trend1.id,
        title: "Indian diaspora in Gulf express concern over escalating tensions",
        content: "Over 8 million Indian workers in Gulf states facing uncertainty as regional tensions mount.",
        source: "The Hindu",
        sourceCredibility: 0.82,
        eventType: "social",
        stakeholders: { people: ["Indian Ambassador to UAE"], organizations: ["Indian Embassy"] },
        geoRelevance: { india: 0.90, uae: 0.85, global: 0.4 },
        sentiment: "negative",
      },
    ],
  });

  // Signals for trend 2
  await prisma.signal.createMany({
    data: [
      {
        trendId: trend2.id,
        title: "Infosys announces 6,000 job cuts in AI-driven restructuring",
        content: "India's second-largest IT firm restructures operations, replacing mid-level roles with AI automation tools.",
        source: "Economic Times",
        sourceCredibility: 0.85,
        eventType: "economic",
        stakeholders: { people: ["Infosys CEO"], organizations: ["Infosys", "NASSCOM"] },
        geoRelevance: { india: 0.95, us: 0.5, global: 0.4 },
        sentiment: "negative",
      },
      {
        trendId: trend2.id,
        title: "TCS and Wipro follow suit with hiring freeze for FY27",
        content: "Major IT firms signal cautious outlook, shifting investment from headcount to AI infrastructure.",
        source: "Mint",
        sourceCredibility: 0.80,
        eventType: "economic",
        stakeholders: { organizations: ["TCS", "Wipro"] },
        geoRelevance: { india: 0.90, global: 0.3 },
        sentiment: "negative",
      },
    ],
  });

  // Signals for trend 3
  await prisma.signal.createMany({
    data: [
      {
        trendId: trend3.id,
        title: "Rupee falls to 87.5 against dollar, RBI intervenes",
        content: "The Reserve Bank of India sold $2.3 billion in forex reserves to defend the rupee as FII outflows accelerate.",
        source: "PTI",
        sourceCredibility: 0.90,
        eventType: "economic",
        stakeholders: { people: ["RBI Governor"], organizations: ["RBI", "SEBI"] },
        geoRelevance: { india: 0.95, us: 0.5, global: 0.4 },
        sentiment: "negative",
      },
    ],
  });

  // Trend relationships
  await prisma.trendRelation.create({
    data: {
      sourceTrendId: trend1.id,
      relatedTrendId: trend3.id,
      relationship: "causes",
      strength: 0.75,
    },
  });

  await prisma.trendRelation.create({
    data: {
      sourceTrendId: trend2.id,
      relatedTrendId: trend3.id,
      relationship: "related_to",
      strength: 0.45,
    },
  });

  console.log(`Created ${3} trends with ${6} signals and ${2} relationships`);

  // ─── Content Performance & Strategy Tests ────────────────
  await prisma.contentPerformance.create({
    data: {
      deliverableId: "demo-video-001",
      brandId: brands[0].id, // Breaking Tube
      platform: "youtube",
      publishedAt: new Date("2026-03-05"),
      metrics: { views: 85000, likes: 4200, comments: 890, shares: 320, retention: 0.62, ctr: 0.078 },
      revenueGenerated: 12500,
      skillsUsed: ["narrative/voice/hook-engineering.md", "platforms/youtube/title-engineering.md"],
      narrativeAngle: "data-first-explainer",
      hookType: "data_specific",
      performanceTier: "top_10",
      benchmarkDelta: 42.5,
    },
  });

  await prisma.strategyTest.create({
    data: {
      name: "Hook Style A/B — Data vs Question",
      hypothesis: "Data-specific hooks outperform question-format hooks for geopolitical content on YouTube",
      skillPath: "narrative/voice/hook-engineering.md",
      brandId: brands[0].id,
      platform: "youtube",
      variant: "A",
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-03-15"),
      results: { sampleSize: 12, avgRetentionA: 0.62, avgRetentionB: 0.48, pValue: 0.03 },
      conclusion: "A wins",
      status: "completed",
    },
  });

  console.log("Created demo content performance and strategy test records");

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
