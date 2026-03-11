import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, unauthorized, forbidden, notFound } from "@/lib/api-utils";

// GET /api/brands/:id — Get brand details with platforms and voice config
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;

  const brand = await prisma.brand.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true } },
      platforms: { orderBy: { platform: "asc" } },
    },
  });

  if (!brand) return notFound("Brand not found");

  return NextResponse.json(brand);
}

// PUT /api/brands/:id — Update brand details including voice config
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();
  if (session.user.role !== "ADMIN" && session.user.role !== "DEPT_HEAD") return forbidden();

  const { id } = await params;

  const brand = await prisma.brand.findUnique({ where: { id } });
  if (!brand) return notFound("Brand not found");

  const body = await req.json();
  const {
    name,
    language,
    tone,
    tagline,
    identityMarkdown,
    editorialCovers,
    editorialNever,
    audienceDescription,
    audienceSize,
    audienceDemographics,
    audienceGeography,
    audienceInterests,
    activePlatforms,
    voiceRules,
    editorialPriorities,
    contentFrequency,
  } = body;

  const updated = await prisma.brand.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(language !== undefined && { language }),
      ...(tone !== undefined && { tone }),
      ...(tagline !== undefined && { tagline }),
      ...(identityMarkdown !== undefined && { identityMarkdown }),
      ...(editorialCovers !== undefined && { editorialCovers }),
      ...(editorialNever !== undefined && { editorialNever }),
      ...(audienceDescription !== undefined && { audienceDescription }),
      ...(audienceSize !== undefined && { audienceSize }),
      ...(audienceDemographics !== undefined && { audienceDemographics }),
      ...(audienceGeography !== undefined && { audienceGeography }),
      ...(audienceInterests !== undefined && { audienceInterests }),
      ...(activePlatforms !== undefined && { activePlatforms }),
      ...(voiceRules !== undefined && { voiceRules }),
      ...(editorialPriorities !== undefined && { editorialPriorities }),
      ...(contentFrequency !== undefined && { contentFrequency }),
    },
    include: {
      client: { select: { id: true, name: true } },
      platforms: true,
    },
  });

  return NextResponse.json(updated);
}
