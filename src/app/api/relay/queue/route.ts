import { NextResponse } from "next/server";
import { getAuthSession, unauthorized } from "@/lib/api-utils";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/relay/queue
 *
 * Returns APPROVED deliverables that haven't been bridged to a ContentPost yet.
 * These are the items in the "ready to publish" queue.
 */
export async function GET() {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  if (!hasPermission(session.user.role, session.user.permissions, "relay.read.own")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch APPROVED deliverables (not yet RELAYED/PUBLISHED)
  const deliverables = await prisma.deliverable.findMany({
    where: { status: "APPROVED" },
    include: {
      brand: { select: { id: true, name: true } },
      assets: { select: { id: true, url: true, type: true, slideIndex: true }, orderBy: { slideIndex: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  const queue = deliverables.map((d) => ({
    id: d.id,
    title: extractTitle(d),
    content: d.copyMarkdown?.slice(0, 300) || "",
    platform: d.platform,
    brand: d.brand,
    assetCount: d.assets.length,
    assets: d.assets.slice(0, 4),
    approvedAt: d.updatedAt.toISOString(),
    createdAt: d.createdAt.toISOString(),
  }));

  return NextResponse.json({ data: queue, total: queue.length });
}

function extractTitle(d: { copyMarkdown: string | null; scriptData: unknown; platform: string; brand: { name: string } }): string {
  if (d.platform === "YOUTUBE" && d.scriptData) {
    const script = d.scriptData as Record<string, unknown>;
    if (script.title) return script.title as string;
  }
  const copy = d.copyMarkdown || "";
  const firstLine = copy.split("\n")[0].replace(/^#+\s*/, "").trim();
  if (firstLine.length > 0) {
    return firstLine.length > 100 ? firstLine.slice(0, 100) + "..." : firstLine;
  }
  return `${d.brand.name} — ${d.platform}`;
}
