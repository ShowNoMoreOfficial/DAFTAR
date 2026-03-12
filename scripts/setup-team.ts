/**
 * Team Setup Script
 * =================
 * Creates invite-ready user records for the ShowNoMore team.
 * Since we use NextAuth with Google OAuth, user records must exist
 * with the correct email BEFORE team members can log in.
 *
 * INSTRUCTIONS:
 * 1. Replace 'REPLACE_WITH_EMAIL' with each person's Google email
 * 2. Run: npx tsx scripts/setup-team.ts
 * 3. Each team member can then log in via Google OAuth at https://daftar-one.vercel.app
 *
 * The script uses upsert so it's safe to run multiple times.
 */

import { PrismaClient, DepartmentType } from "@prisma/client";

const prisma = new PrismaClient();

const team = [
  { name: "Lavan", email: "REPLACE_WITH_EMAIL", role: "ADMIN" as const, department: "Management", deptType: DepartmentType.CUSTOM },
  { name: "Parth", email: "REPLACE_WITH_EMAIL", role: "MEMBER" as const, department: "Media", deptType: DepartmentType.MEDIA },
  { name: "Sudhanshu", email: "REPLACE_WITH_EMAIL", role: "MEMBER" as const, department: "Production", deptType: DepartmentType.PRODUCTION },
  { name: "Deepak", email: "REPLACE_WITH_EMAIL", role: "MEMBER" as const, department: "Production", deptType: DepartmentType.PRODUCTION },
  { name: "Muskan", email: "REPLACE_WITH_EMAIL", role: "HEAD_HR" as const, department: "HR & Operations", deptType: DepartmentType.HR_OPS },
  { name: "Stallone", email: "REPLACE_WITH_EMAIL", role: "ADMIN" as const, department: "Technology", deptType: DepartmentType.TECH },
];

async function setup() {
  console.log("Setting up team accounts...\n");

  // Ensure departments exist
  const deptNames = [...new Set(team.map((p) => p.department))];
  for (const person of team) {
    if (!deptNames.includes(person.department)) continue;
    await prisma.department.upsert({
      where: { name: person.department },
      update: {},
      create: { name: person.department, type: person.deptType },
    });
    // Remove from list so we don't upsert again
    deptNames.splice(deptNames.indexOf(person.department), 1);
  }
  console.log("Departments ready.\n");

  // Get all brands for access grants
  const brands = await prisma.brand.findMany({ select: { id: true, name: true } });
  console.log(`Found ${brands.length} brand(s): ${brands.map((b) => b.name).join(", ")}\n`);

  for (const person of team) {
    if (person.email === "REPLACE_WITH_EMAIL") {
      console.log(`SKIP: ${person.name} — email not set yet`);
      continue;
    }

    const dept = await prisma.department.findFirst({ where: { name: person.department } });

    // Create or update user
    const user = await prisma.user.upsert({
      where: { email: person.email },
      update: { name: person.name, role: person.role, isActive: true },
      create: {
        email: person.email,
        name: person.name,
        role: person.role,
        isActive: true,
        ...(dept ? { primaryDeptId: dept.id } : {}),
      },
    });

    // Add department membership
    if (dept) {
      await prisma.departmentMember.upsert({
        where: { userId_departmentId: { userId: user.id, departmentId: dept.id } },
        update: {},
        create: { userId: user.id, departmentId: dept.id, isPrimary: true },
      });
    }

    // Grant brand access (all team members get both brands)
    for (const brand of brands) {
      await prisma.userBrandAccess.upsert({
        where: { userId_brandId: { userId: user.id, brandId: brand.id } },
        update: {},
        create: { userId: user.id, brandId: brand.id },
      });
    }

    console.log(`OK: ${person.name} (${person.role}) — ${person.email} — dept: ${person.department}`);
  }

  console.log("\nDone! Team members can now log in via Google OAuth.");
  console.log("If a user sees 'Access Denied', make sure their Google email matches exactly.");
}

setup()
  .catch((e) => {
    console.error("Setup failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
