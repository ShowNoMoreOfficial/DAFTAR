import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  processSignal,
  generateDeliverable,
  publishPost,
} from "@/lib/inngest/functions";
import { generateDeliverableV2 } from "@/lib/inngest/yantri-workflows";
import { khabriHourlyScan } from "@/lib/inngest/khabri-workflows";
import { ingestVrittiArticle } from "@/lib/inngest/vritti-workflows";

// Serve the Inngest API at /api/inngest
// This endpoint handles:
// - Registration: Inngest dev server discovers functions here
// - Invocation: Inngest calls this endpoint to execute function steps
// - Introspection: Inngest UI reads function metadata
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processSignal,
    generateDeliverable, // v1: basic draft pipeline (legacy)
    generateDeliverableV2, // v2: full pipeline with engine routing + fact-checking
    publishPost,
    khabriHourlyScan,
    ingestVrittiArticle,
  ],
});
