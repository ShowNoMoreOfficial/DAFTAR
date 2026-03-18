import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";

export const PUT = apiHandler(async (request, { params }) => {
  const { id } = params;
  const body = await request.json();
  const rule = await prisma.platformRule.update({
    where: { id },
    data: {
      narrativeType: body.narrativeType,
      primaryPlatform: body.primaryPlatform,
      secondaryPlatform: body.secondaryPlatform || null,
      brandName: body.brandName || null,
      sendWhen: JSON.stringify(body.sendWhen || []),
      neverSend: JSON.stringify(body.neverSend || []),
      speedPriority: body.speedPriority,
    },
  });
  return NextResponse.json(rule);
});

export const DELETE = apiHandler(async (_request, { params }) => {
  const { id } = params;
  await prisma.platformRule.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
