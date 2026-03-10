import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  processSignal,
  generateDeliverable,
  publishPost,
} from "@/lib/inngest/functions";

// Serve the Inngest API at /api/inngest
// This endpoint handles:
// - Registration: Inngest dev server discovers functions here
// - Invocation: Inngest calls this endpoint to execute function steps
// - Introspection: Inngest UI reads function metadata
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processSignal, generateDeliverable, publishPost],
});
