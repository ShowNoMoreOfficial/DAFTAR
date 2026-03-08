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
      update: {},
      create: {
        name: "yantri",
        displayName: "Yantri",
        description: "AI Narrative Intelligence Orchestrator",
        icon: "Brain",
        baseUrl: "http://localhost:3001",
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
