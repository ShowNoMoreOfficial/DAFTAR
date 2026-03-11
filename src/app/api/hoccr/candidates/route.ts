import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, badRequest, forbidden, handleApiError } from "@/lib/api-utils";
import type { Role } from "@prisma/client";

// GET /api/hoccr/candidates — list candidates with optional filters
export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const allowedRoles: Role[] = ["ADMIN", "HEAD_HR", "DEPT_HEAD"];
  if (!allowedRoles.includes(session.user.role as Role)) return forbidden();

  const { searchParams } = req.nextUrl;
  const positionId = searchParams.get("positionId");
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (positionId) where.positionId = positionId;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const candidates = await prisma.hiringCandidate.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      position: { select: { id: true, title: true, department: { select: { id: true, name: true } } } },
    },
  });

  return NextResponse.json(candidates);
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const allowedRoles: Role[] = ["ADMIN", "HEAD_HR", "DEPT_HEAD"];
  if (!allowedRoles.includes(session.user.role as Role)) return forbidden();

  try {
    const { name, email, phone, resumeUrl, positionId, notes } = await req.json();
    if (!name || !email || !positionId) return badRequest("Name, email, and position are required");

    const candidate = await prisma.hiringCandidate.create({
      data: { name, email, phone, resumeUrl, positionId, notes },
      include: {
        position: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json(candidate, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const allowedRoles: Role[] = ["ADMIN", "HEAD_HR", "DEPT_HEAD"];
  if (!allowedRoles.includes(session.user.role as Role)) return forbidden();

  try {
    const { id, status, rating, notes, interviewDate } = await req.json();
    if (!id) return badRequest("Candidate ID is required");

    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (rating !== undefined) data.rating = rating;
    if (notes !== undefined) data.notes = notes;
    if (interviewDate !== undefined) data.interviewDate = interviewDate ? new Date(interviewDate) : null;

    const candidate = await prisma.hiringCandidate.update({
      where: { id },
      data,
    });

    return NextResponse.json(candidate);
  } catch (error) {
    return handleApiError(error);
  }
}
