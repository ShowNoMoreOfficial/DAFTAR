import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// GET /api/yantri/relay/publish
// Lists all narratives with status "published" that have NOT yet been relayed.
// Sorted by urgency (breaking first) then priority (highest first).
// Also includes APPROVED ContentPieces that haven't been relayed.
// ---------------------------------------------------------------------------

const URGENCY_ORDER: Record<string, number> = {
  breaking: 0,
  "30_minutes": 1,
  "2_4_hours": 2,
  "24_48_hours": 3,
  "48_72_hours": 4,
  "1_week": 5,
};

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Legacy narratives ready for relay
    const narratives = await prisma.editorialNarrative.findMany({
      where: { status: "published" },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });

    // Fetch related brands and trends for all narratives
    const brandIds = [...new Set(narratives.map((n) => n.brandId))];
    const trendIds = [...new Set(narratives.map((n) => n.trendId))];
    const [brands, trends] = await Promise.all([
      prisma.brand.findMany({ where: { id: { in: brandIds } } }),
      prisma.importedTrend.findMany({ where: { id: { in: trendIds } } }),
    ]);
    const brandMap = new Map(brands.map((b) => [b.id, b]));
    const trendMap = new Map(trends.map((t) => [t.id, t]));

    // Sort by urgency (not natively sortable in Prisma string field)
    const sortedNarratives = narratives.sort((a, b) => {
      const urgA = URGENCY_ORDER[a.urgency] ?? 99;
      const urgB = URGENCY_ORDER[b.urgency] ?? 99;
      if (urgA !== urgB) return urgA - urgB;
      return b.priority - a.priority;
    });

    // V3 ContentPieces ready for relay (APPROVED status)
    const contentPieces = await prisma.contentPiece.findMany({
      where: { status: "APPROVED" },
      include: { brand: true },
      orderBy: [{ createdAt: "asc" }],
    });

    return NextResponse.json({
      narratives: sortedNarratives.map((n) => ({
        id: n.id,
        angle: n.angle,
        platform: n.platform,
        urgency: n.urgency,
        priority: n.priority,
        brandName: brandMap.get(n.brandId)?.name ?? "Unknown",
        trendHeadline: trendMap.get(n.trendId)?.headline ?? "",
        hasFinalContent: !!n.finalContent,
        createdAt: n.createdAt,
      })),
      contentPieces: contentPieces.map((cp) => ({
        id: cp.id,
        platform: cp.platform,
        brandName: cp.brand.name,
        hasBody: !!cp.bodyText,
        createdAt: cp.createdAt,
      })),
    });
  } catch (error) {
    console.error("[relay/publish] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch publishable items" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/yantri/relay/publish
// Accepts either:
//   { narrativeId: string, targetPlatform?: string }  -- legacy narrative
//   { contentPieceId: string }                        -- v3 content piece
//
// Validates the item is approved/published, packages it for Relay, and
// creates an EditorialLog entry with action "relayed".
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { narrativeId, targetPlatform, contentPieceId } = body as {
      narrativeId?: string;
      targetPlatform?: string;
      contentPieceId?: string;
    };

    if (!narrativeId && !contentPieceId) {
      return NextResponse.json(
        { error: "Either narrativeId or contentPieceId is required" },
        { status: 400 },
      );
    }

    // ── V3 ContentPiece path ──────────────────────────────────────────────
    if (contentPieceId) {
      return await handleContentPieceRelay(contentPieceId);
    }

    // ── Legacy EditorialNarrative path ─────────────────────────────────────
    return await handleNarrativeRelay(narrativeId!, targetPlatform);
  } catch (error) {
    console.error("[relay/publish] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

async function handleNarrativeRelay(
  narrativeId: string,
  targetPlatform?: string,
) {
  const narrative = await prisma.editorialNarrative.findUnique({
    where: { id: narrativeId },
  });

  if (!narrative) {
    return NextResponse.json(
      { error: "EditorialNarrative not found" },
      { status: 404 },
    );
  }

  if (narrative.status !== "published") {
    return NextResponse.json(
      {
        error: `EditorialNarrative must have status "published" to relay. Current status: "${narrative.status}"`,
      },
      { status: 400 },
    );
  }

  if (!narrative.finalContent) {
    return NextResponse.json(
      { error: "EditorialNarrative has no finalContent. Package it before relaying." },
      { status: 400 },
    );
  }

  // Fetch related brand and trend separately
  const brand = await prisma.brand.findUnique({ where: { id: narrative.brandId } });
  const trend = narrative.trendId
    ? await prisma.importedTrend.findUnique({ where: { id: narrative.trendId } })
    : null;

  // Parse stored JSON fields safely
  const finalContent = safeJsonParse(narrative.finalContent);
  const packageData = narrative.packageData
    ? safeJsonParse(narrative.packageData)
    : null;

  // Mark as relayed
  await prisma.editorialNarrative.update({
    where: { id: narrativeId },
    data: { status: "relayed" },
  });

  // Create editorial log
  await prisma.editorialLog.create({
    data: {
      action: "relayed",
      reasoning: `EditorialNarrative relayed to ${targetPlatform || narrative.platform} for publishing`,
      trendHeadline: trend?.headline ?? "",
      narrativeAngle: narrative.angle,
      platform: targetPlatform || narrative.platform,
      brandName: brand?.name ?? "Unknown",
    },
  });

  return NextResponse.json({
    success: true,
    payload: {
      content: finalContent,
      platform: targetPlatform || narrative.platform,
      postingPlan: packageData?.postingPlan ?? null,
      brand: {
        id: brand?.id ?? narrative.brandId,
        name: brand?.name ?? "Unknown",
        tone: brand?.tone ?? "",
        language: brand?.language ?? "en",
      },
      metadata: {
        narrativeId: narrative.id,
        trendHeadline: trend?.headline ?? "",
        angle: narrative.angle,
        urgency: narrative.urgency,
        priority: narrative.priority,
        format: narrative.format,
        secondaryPlatform: narrative.secondaryPlatform,
        relayedAt: new Date().toISOString(),
      },
    },
  });
}

async function handleContentPieceRelay(contentPieceId: string) {
  const contentPiece = await prisma.contentPiece.findUnique({
    where: { id: contentPieceId },
    include: { brand: true },
  });

  if (!contentPiece) {
    return NextResponse.json(
      { error: "ContentPiece not found" },
      { status: 404 },
    );
  }

  if (contentPiece.status !== "APPROVED") {
    return NextResponse.json(
      {
        error: `ContentPiece must have status "APPROVED" to relay. Current status: "${contentPiece.status}"`,
      },
      { status: 400 },
    );
  }

  if (!contentPiece.bodyText) {
    return NextResponse.json(
      { error: "ContentPiece has no body text. Draft it before relaying." },
      { status: 400 },
    );
  }

  // Mark as relayed
  await prisma.contentPiece.update({
    where: { id: contentPieceId },
    data: { status: "RELAYED" },
  });

  // Create editorial log
  await prisma.editorialLog.create({
    data: {
      action: "relayed",
      reasoning: `ContentPiece relayed to ${contentPiece.platform} for publishing`,
      trendHeadline: `[ContentPiece] ${contentPiece.platform}`,
      narrativeAngle: null,
      platform: contentPiece.platform,
      brandName: contentPiece.brand.name,
    },
  });

  return NextResponse.json({
    success: true,
    payload: {
      content: contentPiece.bodyText,
      platform: contentPiece.platform,
      postingPlan: contentPiece.postingPlan ?? null,
      brand: {
        id: contentPiece.brand.id,
        name: contentPiece.brand.name,
        tone: contentPiece.brand.tone ?? "",
        language: contentPiece.brand.language ?? "en",
      },
      metadata: {
        contentPieceId: contentPiece.id,
        treeId: contentPiece.treeId,
        visualPrompts: contentPiece.visualPrompts,
        relayedAt: new Date().toISOString(),
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeJsonParse(value: string): Record<string, unknown> {
  try {
    return JSON.parse(value);
  } catch {
    return { raw: value };
  }
}
