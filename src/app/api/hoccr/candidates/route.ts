import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, badRequest } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { name, email, phone, resumeUrl, positionId, notes } = await req.json();
  if (!name || !email || !positionId) return badRequest("Name, email, and position are required");

  const candidate = await prisma.hiringCandidate.create({
    data: { name, email, phone, resumeUrl, positionId, notes },
    include: {
      position: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json(candidate, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

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
}
