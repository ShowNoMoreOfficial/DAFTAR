import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, unauthorized, badRequest } from "@/lib/api-utils";
import { searchSignals } from "@/lib/khabri";

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { searchParams } = req.nextUrl;
  const query = searchParams.get("q");
  if (!query) return badRequest("Missing search query parameter 'q'");

  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 25;

  try {
    const result = await searchSignals(query, page, pageSize);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to search signals";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
