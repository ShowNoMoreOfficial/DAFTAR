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
// Yantri pipeline functions (merged from standalone Yantri app)
import {
  factDossierSync,
  gapAnalysisOnIngest,
  contentPiecePipeline,
} from "@/lib/yantri/inngest/functions";
import {
  viralMicroPipeline,
  carouselPipeline,
  cinematicPipeline,
  reelPipeline,
} from "@/lib/yantri/inngest/deliverable-pipelines";
import {
  performanceTrackingStart,
  performanceMeasure,
} from "@/lib/yantri/inngest/performance-loop";

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
    // Yantri pipeline functions
    contentPiecePipeline,
    factDossierSync,
    gapAnalysisOnIngest,
    viralMicroPipeline,
    carouselPipeline,
    cinematicPipeline,
    reelPipeline,
    // Performance feedback loop
    performanceTrackingStart,
    performanceMeasure,
  ],
});
