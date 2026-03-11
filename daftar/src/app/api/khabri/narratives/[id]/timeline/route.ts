import { NextResponse } from "next/server";
import { getAuthSession, unauthorized } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { getNarrativeTimeline } from "@/lib/khabri";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;

  // Try local DB: build timeline from narrative nodes
  try {
    const tree = await prisma.narrativeTree.findUnique({
      where: { id },
      include: {
        nodes: { orderBy: { identifiedAt: "asc" }, select: { id: true, signalTitle: true, signalData: true, identifiedAt: true } },
        dossier: { select: { structuredData: true } },
      },
    });

    if (tree && tree.nodes.length > 0) {
      // Build timeline from nodes + dossier timeline data
      const timeline: Array<{ id: string; timestamp: string; summary: string; type: "signal" | "event" }> = tree.nodes.map((n) => ({
        id: n.id,
        timestamp: n.identifiedAt.toISOString(),
        summary: n.signalTitle ?? "Signal received",
        type: "signal" as const,
      }));

      // Add dossier timeline events if available
      const dossierData = tree.dossier?.structuredData as { timeline?: Array<{ date: string; event: string }> } | null;
      if (dossierData?.timeline) {
        for (const event of dossierData.timeline) {
          timeline.push({
            id: `dossier-${event.date}`,
            timestamp: event.date,
            summary: event.event,
            type: "event" as const,
          });
        }
      }

      return NextResponse.json({
        data: timeline.sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
        meta: { source: "local" },
      });
    }
  } catch (err) {
    console.warn("[Khabri] Local timeline lookup failed:", err);
  }

  // Fallback to external API
  try {
    const result = await getNarrativeTimeline(id);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch narrative timeline";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
