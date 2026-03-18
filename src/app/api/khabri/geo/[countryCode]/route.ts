import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { getCountryIntel } from "@/lib/khabri";

export const GET = apiHandler(async (_req: NextRequest, { params }) => {
  const { countryCode } = params;

  try {
    const result = await getCountryIntel(countryCode);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch country intelligence";
    return NextResponse.json({ error: message }, { status: 502 });
  }
});
