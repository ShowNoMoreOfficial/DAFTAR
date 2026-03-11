import { NextResponse } from "next/server";
import { getAuthSession, unauthorized } from "@/lib/api-utils";
import { getCountryIntel } from "@/lib/khabri";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ countryCode: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { countryCode } = await params;

  try {
    const result = await getCountryIntel(countryCode);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch country intelligence";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
