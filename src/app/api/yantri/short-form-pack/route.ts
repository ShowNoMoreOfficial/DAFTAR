import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";

/**
 * POST /api/yantri/short-form-pack
 *
 * Generates a short-form content pack in parallel:
 *   1. YouTube Short (60s vertical)
 *   2. Instagram Reel (60-90s vertical, adapted)
 *   3. X Post (key quote extracted)
 *   4. Instagram Story (highlight frame)
 *
 * Each is a separate deliverable routed through quick-generate.
 *
 * Body: { topic: string, brandId: string, recommendationContext?: object }
 */

export const maxDuration = 120;

interface PackItem {
  contentType: string;
  label: string;
  status: "pending" | "generating" | "done" | "error";
  deliverableId?: string;
  error?: string;
}

export const POST = apiHandler(async (request: NextRequest) => {
  const body = await request.json();
  const { topic, brandId, recommendationContext } = body as {
    topic: string;
    brandId: string;
    recommendationContext?: Record<string, unknown>;
  };

  if (!topic || !brandId) {
    return NextResponse.json(
      { error: "topic and brandId are required" },
      { status: 400 }
    );
  }

  // Define the 4 pack items
  const packTypes = [
    { contentType: "youtube_short", label: "YouTube Short" },
    { contentType: "instagram_reel", label: "Instagram Reel" },
    { contentType: "x_single", label: "X Post" },
    { contentType: "instagram_carousel", label: "Instagram Story" },
  ];

  // Build the base URL for internal calls
  const origin = request.nextUrl.origin;

  // Generate all 4 in parallel via internal quick-generate calls
  const results = await Promise.allSettled(
    packTypes.map(async ({ contentType, label }): Promise<PackItem> => {
      try {
        const res = await fetch(`${origin}/api/yantri/quick-generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie: request.headers.get("cookie") || "",
          },
          body: JSON.stringify({
            topic,
            brandId,
            contentType,
            recommendationContext: recommendationContext
              ? {
                  ...recommendationContext,
                  angle:
                    recommendationContext.angle ||
                    `Short-form pack: ${label} adaptation`,
                }
              : {
                  angle: `Short-form pack: ${label} adaptation`,
                  reasoning: `Part of short-form content pack for cross-platform distribution`,
                  priority: "high",
                  urgency: "within_24h",
                  assetsRequired: {
                    images: [],
                    video: ["vertical 9:16"],
                    graphics: ["text overlays"],
                    other: [],
                  },
                  keyDataPoints: [],
                  stakeholders: [],
                  sensitivityLevel: "green",
                  suggestedTitle: topic,
                },
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          return {
            contentType,
            label,
            status: "error",
            error:
              typeof data.error === "string"
                ? data.error
                : "Generation failed",
          };
        }

        return {
          contentType,
          label,
          status: "done",
          deliverableId: data.deliverableId,
        };
      } catch (err) {
        return {
          contentType,
          label,
          status: "error",
          error: err instanceof Error ? err.message : "Unknown error",
        };
      }
    })
  );

  const items: PackItem[] = results.map((r) =>
    r.status === "fulfilled"
      ? r.value
      : {
          contentType: "unknown",
          label: "Unknown",
          status: "error" as const,
          error: r.reason?.message || "Failed",
        }
  );

  const succeeded = items.filter((i) => i.status === "done").length;
  const failed = items.filter((i) => i.status === "error").length;

  return NextResponse.json({
    pack: items,
    summary: {
      total: packTypes.length,
      succeeded,
      failed,
    },
  });
});
