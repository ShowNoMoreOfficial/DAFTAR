import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";

// GET /api/gi/config
export const GET = apiHandler(async (_req, { session }) => {
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const configs = await prisma.gIConfig.findMany();
  return NextResponse.json(configs);
});
