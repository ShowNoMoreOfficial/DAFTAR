import { NextRequest, NextResponse } from "next/server";

// POST /api/client/action — Token-based deliverable approval/revision (public, no auth)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token, action, feedback } = body as {
    token?: string;
    action?: string;
    feedback?: string | null;
  };

  // Validate required fields
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Missing or invalid token" }, { status: 400 });
  }

  if (!action || !["APPROVE", "REVISE"].includes(action)) {
    return NextResponse.json(
      { error: "Invalid action. Must be APPROVE or REVISE." },
      { status: 400 },
    );
  }

  if (action === "REVISE" && (!feedback || typeof feedback !== "string" || !feedback.trim())) {
    return NextResponse.json(
      { error: "Feedback is required for revision requests." },
      { status: 400 },
    );
  }

  // In production this would:
  // 1. Look up the token in a SharingToken / PortalLink table
  // 2. Verify it hasn't expired
  // 3. Find the linked ClientDeliverable
  // 4. Update its status to 'approved' or 'revision_requested'
  // 5. Store the feedback
  // 6. Send notification to the content team

  const newStatus = action === "APPROVE" ? "approved" : "revision_requested";

  return NextResponse.json({
    success: true,
    message:
      action === "APPROVE"
        ? "Deliverable approved successfully."
        : "Revision request submitted successfully.",
    data: {
      token,
      status: newStatus,
      feedback: feedback?.trim() || null,
      reviewedAt: new Date().toISOString(),
    },
  });
}
