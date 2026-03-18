import { NextRequest, NextResponse } from "next/server";
import { badRequest } from "@/lib/api-utils";
import { apiHandler } from "@/lib/api-handler";
import { hasPermission } from "@/lib/permissions";
import { bridgeDeliverableToPost } from "@/lib/relay/deliverable-bridge";

/**
 * POST /api/relay/bridge
 *
 * Bridge an approved Deliverable into a ContentPost for publishing.
 * Body: { deliverableId: string, scheduledAt?: string }
 */
export const POST = apiHandler(async (req: NextRequest, { session }) => {
  if (!hasPermission(session.user.role, session.user.permissions, "relay.read.own")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { deliverableId?: string; scheduledAt?: string };
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  if (!body.deliverableId) {
    return badRequest("deliverableId is required");
  }

  try {
    const postId = await bridgeDeliverableToPost(
      body.deliverableId,
      session.user.id,
      body.scheduledAt ? new Date(body.scheduledAt) : undefined
    );

    return NextResponse.json({ postId, status: "bridged" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
});
