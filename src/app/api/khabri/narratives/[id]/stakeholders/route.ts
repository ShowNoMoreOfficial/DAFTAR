import { NextResponse } from "next/server";
import { getAuthSession, unauthorized } from "@/lib/api-utils";
import { getNarrativeStakeholders } from "@/lib/khabri";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;

  try {
    const result = await getNarrativeStakeholders(id);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch narrative stakeholders";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
