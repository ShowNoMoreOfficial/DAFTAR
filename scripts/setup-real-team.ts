/**
 * Real Team Setup Script
 * ======================
 * Creates/updates the 7 ShowNoMore team members with real @shownomore.com emails.
 * Safe to run multiple times (uses upsert).
 *
 * Run: npx tsx scripts/setup-real-team.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Setting up real ShowNoMore team...\n");

  // Ensure departments exist
  const deptMap: Record<string, string> = {
    Management: "CUSTOM",
    Media: "MEDIA",
    Production: "PRODUCTION",
    "HR & Operations": "HR_OPS",
    Tech: "TECH",
  };

  const departments: Record<string, string> = {};
  for (const [name, type] of Object.entries(deptMap)) {
    const dept = await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name, type: type as never },
    });
    departments[name] = dept.id;
  }
  console.log("Departments ready.\n");

  // Get brands
  const brands = await prisma.brand.findMany({ select: { id: true, name: true } });
  console.log(`Found ${brands.length} brands: ${brands.map((b) => b.name).join(", ")}\n`);

  // Ensure client exists for Chaubey
  let client = await prisma.client.findFirst({ where: { name: "Bhupendra Chaubey" } });
  if (!client) {
    client = await prisma.client.create({
      data: { name: "Bhupendra Chaubey", company: "Independent Journalist" },
    });
    console.log("Created client record for Bhupendra Chaubey.\n");
  }

  const realTeam = [
    { email: "lavan@shownomore.com", name: "Lavan", role: "ADMIN" as const, dept: "Management", isClient: false },
    { email: "parth@shownomore.com", name: "Parth", role: "MEMBER" as const, dept: "Media", isClient: false },
    { email: "sudhanshu@shownomore.com", name: "Sudhanshu", role: "MEMBER" as const, dept: "Production", isClient: false },
    { email: "deepaks@shownomore.com", name: "Deepak", role: "MEMBER" as const, dept: "Production", isClient: false },
    { email: "muskan@shownomore.com", name: "Muskan", role: "HEAD_HR" as const, dept: "HR & Operations", isClient: false },
    { email: "stallone@shownomore.com", name: "Stallone", role: "ADMIN" as const, dept: "Tech", isClient: false },
    { email: "thesquirrels@shownomore.com", name: "Bhupendra Chaubey", role: "CLIENT" as const, dept: null, isClient: true },
  ];

  for (const person of realTeam) {
    const deptId = person.dept ? departments[person.dept] : null;

    const user = await prisma.user.upsert({
      where: { email: person.email },
      update: {
        name: person.name,
        role: person.role,
        isActive: true,
        primaryDeptId: deptId,
      },
      create: {
        email: person.email,
        name: person.name,
        role: person.role,
        isActive: true,
        primaryDeptId: deptId,
      },
    });

    // Department membership
    if (deptId) {
      await prisma.departmentMember.upsert({
        where: { userId_departmentId: { userId: user.id, departmentId: deptId } },
        update: {},
        create: { userId: user.id, departmentId: deptId, isPrimary: true },
      });
    }

    // Brand access — all team members get all brands
    for (const brand of brands) {
      await prisma.userBrandAccess.upsert({
        where: { userId_brandId: { userId: user.id, brandId: brand.id } },
        update: {},
        create: { userId: user.id, brandId: brand.id },
      });
    }

    // Link client user to Client record
    if (person.isClient && client) {
      await prisma.client.update({
        where: { id: client.id },
        data: { userId: user.id },
      });
    }

    // Initialize gamification
    await prisma.userStreak.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, currentStreak: 0, longestStreak: 0, totalXp: 0, level: 1 },
    });

    console.log(`  ${person.name} (${person.role}) - ${person.email}${person.dept ? " -> " + person.dept : ""}`);
  }

  console.log("\nAll team accounts ready.");
  console.log("They can log in via Google OAuth at https://daftar-one.vercel.app");
}

main()
  .catch((e) => {
    console.error("Setup failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
