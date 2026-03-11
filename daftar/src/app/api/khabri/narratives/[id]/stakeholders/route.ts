import { NextResponse } from "next/server";
import { getAuthSession, unauthorized } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { getNarrativeStakeholders } from "@/lib/khabri";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;

  // Try local DB: extract stakeholders from signals linked to this tree
  try {
    const tree = await prisma.narrativeTree.findUnique({
      where: { id },
      include: {
        nodes: { select: { signalData: true } },
        dossier: { select: { structuredData: true } },
      },
    });

    if (tree) {
      const stakeholders: Array<{ name: string; role: string; mentions: number }> = [];
      const seen = new Set<string>();

      // Extract from dossier if available
      const dossierData = tree.dossier?.structuredData as { quotes?: Array<{ speaker: string; role?: string }> } | null;
      if (dossierData?.quotes) {
        for (const q of dossierData.quotes) {
          if (q.speaker && !seen.has(q.speaker.toLowerCase())) {
            seen.add(q.speaker.toLowerCase());
            stakeholders.push({ name: q.speaker, role: q.role ?? "Unknown", mentions: 1 });
          }
        }
      }

      // Extract from signal stakeholder data
      for (const node of tree.nodes) {
        const data = node.signalData as { stakeholders?: Array<{ name: string; type?: string }> } | null;
        if (data?.stakeholders) {
          for (const s of data.stakeholders) {
            if (s.name && !seen.has(s.name.toLowerCase())) {
              seen.add(s.name.toLowerCase());
              stakeholders.push({ name: s.name, role: s.type ?? "Entity", mentions: 1 });
            }
          }
        }
      }

      if (stakeholders.length > 0) {
        return NextResponse.json({
          data: stakeholders,
          meta: { source: "local" },
        });
      }
    }
  } catch (err) {
    console.warn("[Khabri] Local stakeholders lookup failed:", err);
  }

  // Fallback to external API
  try {
    const result = await getNarrativeStakeholders(id);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch narrative stakeholders";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
