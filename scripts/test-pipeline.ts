/**
 * Direct Pipeline Test Script
 *
 * Tests the Yantri content pipeline end-to-end by calling engines directly,
 * bypassing Inngest. This lets us verify content quality without needing
 * the Inngest dev server.
 *
 * Usage: npx tsx scripts/test-pipeline.ts [engine]
 *   engines: cinematic | viral-micro | carousel | all
 */

import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const prisma = new PrismaClient();

// ─── Config ────────────────────────────────────────────────────
const TEST_TOPIC = "India semiconductor chip manufacturing — Tata vs Adani $10B race to build fab plants";
const SQUIRRELS_BRAND_SLUG = "the-squirrels";

async function getBrand() {
  const brand = await prisma.brand.findUnique({
    where: { slug: SQUIRRELS_BRAND_SLUG },
  });
  if (!brand) throw new Error("Brand not found: " + SQUIRRELS_BRAND_SLUG);
  return brand;
}

function getVoiceRules(brand: { voiceRules: unknown }): string {
  if (Array.isArray(brand.voiceRules)) return brand.voiceRules.join("; ");
  if (brand.voiceRules) return JSON.stringify(brand.voiceRules);
  return "";
}

let cachedResearch: string | null = null;

async function getResearch(): Promise<string> {
  if (cachedResearch) {
    console.log("  Using cached research from this session");
    return cachedResearch;
  }

  // Always do live research for the test topic (existing dossiers are about different topics)
  console.log("  Doing live research via Gemini...");
  const { routeToModel } = await import("../src/lib/yantri/model-router");
  const result = await routeToModel(
    "research",
    `Research the following topic for The Squirrels YouTube channel.
Be concise, data-dense, and cite sources. Include key statistics, timeline, stakeholders, and implications for India.
Focus on: investment amounts, timelines, technology partnerships, strategic implications, global semiconductor supply chain context.`,
    TEST_TOPIC
  );
  cachedResearch = result.raw;
  return result.raw;
}

// ─── Test Cinematic Engine ──────────────────────────────────────
async function testCinematic() {
  console.log("\n═══════════════════════════════════════════════");
  console.log("  TESTING: Cinematic Engine (YouTube Long-Form)");
  console.log("═══════════════════════════════════════════════\n");

  const brand = await getBrand();
  const research = await getResearch();
  const voiceRules = getVoiceRules(brand);

  console.log(`  Brand: ${brand.name}`);
  console.log(`  Tone: ${brand.tone ?? "not set"}`);
  console.log(`  Language: ${brand.language ?? "not set"}`);
  console.log(`  Voice Rules: ${Array.isArray(brand.voiceRules) ? brand.voiceRules.length + " rules" : "none"}`);
  console.log(`  Research: ${research.length} chars`);
  console.log("\n  Generating script...\n");

  const { runCinematicEngine } = await import("../src/lib/yantri/engines/cinematic");

  const start = Date.now();
  const result = await runCinematicEngine({
    narrativeAngle: TEST_TOPIC,
    brandName: brand.name,
    brandTone: brand.tone ?? "analytical-provocative",
    voiceRules,
    language: brand.language ?? "English",
    researchResults: research,
    trendHeadline: "Tata vs Adani: India's $10B Semiconductor Race",
    targetRuntime: "10-15",
  });
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`  ✓ Generated in ${elapsed}s via ${result.model}`);
  console.log(`  ✓ Sections: ${result.script.sections.length}`);
  console.log(`  ✓ Runtime: ${result.script.runtimeEstimate}`);
  console.log(`  ✓ Storyboard: ${result.storyboard.length} frames`);
  console.log(`  ✓ B-Roll: ${result.brollAssets.length} assets`);

  // Print script preview
  console.log("\n  ─── SCRIPT PREVIEW ───");
  const fullScript = result.script.fullScript;
  console.log(fullScript.slice(0, 2000));
  if (fullScript.length > 2000) console.log(`\n  ... [${fullScript.length} total chars]`);

  // Print titles
  const plan = result.postingPlan as Record<string, unknown>;
  const titles = plan?.titles as Record<string, string> | undefined;
  if (titles) {
    console.log("\n  ─── TITLES ───");
    for (const [type, title] of Object.entries(titles)) {
      console.log(`  ${type}: ${title}`);
    }
  }

  // Print thumbnail
  const thumb = plan?.thumbnail as Record<string, string> | undefined;
  if (thumb) {
    console.log("\n  ─── THUMBNAIL BRIEF ───");
    console.log(`  Visual: ${thumb.visual}`);
    console.log(`  Text Overlay: ${thumb.textOverlay}`);
    console.log(`  Emotion: ${thumb.emotion}`);
  }

  // Save as deliverable
  const deliverable = await prisma.deliverable.create({
    data: {
      brandId: brand.id,
      platform: "YOUTUBE",
      pipelineType: "cinematic",
      copyMarkdown: fullScript,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      scriptData: JSON.parse(JSON.stringify({
        sections: result.script.sections,
        runtimeEstimate: result.script.runtimeEstimate,
        actStructure: result.script.actStructure,
      })) as any,
      postingPlan: result.postingPlan as object,
      status: "REVIEW",
    },
  });

  // Save assets
  for (const frame of result.storyboard) {
    await prisma.asset.create({
      data: {
        deliverableId: deliverable.id,
        type: "IMAGE",
        url: "",
        promptUsed: frame.visualPrompt,
        slideIndex: frame.frameNumber,
        metadata: {
          shotType: frame.shotType,
          timestamp: frame.timestamp,
          duration: frame.duration,
        },
      },
    });
  }

  console.log(`\n  ✓ Deliverable saved: ${deliverable.id}`);
  console.log(`  ✓ ${result.storyboard.length} storyboard assets saved`);

  return deliverable.id;
}

// ─── Test ViralMicro Engine ──────────────────────────────────────
async function testViralMicro() {
  console.log("\n═══════════════════════════════════════════════");
  console.log("  TESTING: ViralMicro Engine (X/Twitter)");
  console.log("═══════════════════════════════════════════════\n");

  const brand = await getBrand();
  const research = await getResearch();
  const voiceRules = getVoiceRules(brand);

  console.log("  Generating viral post...\n");

  const { runViralMicroEngine } = await import("../src/lib/yantri/engines/viralMicro");

  const start = Date.now();
  const result = await runViralMicroEngine({
    narrativeAngle: TEST_TOPIC,
    brandName: brand.name,
    brandTone: brand.tone ?? "analytical-provocative",
    voiceRules,
    language: brand.language ?? "English",
    researchResults: research,
    trendHeadline: "India's Semiconductor Race: Tata vs Adani",
    targetPlatform: "x",
  });
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`  ✓ Generated in ${elapsed}s via ${result.model}`);
  console.log(`  ✓ Hook archetype: ${result.hookArchetype}`);
  console.log(`  ✓ Character count: ${result.characterCount}`);

  console.log("\n  ─── HOOK ───");
  console.log(`  ${result.hook}`);
  console.log("\n  ─── FULL POST ───");
  console.log(`  ${result.primaryPost}`);
  console.log("\n  ─── CTA ───");
  console.log(`  ${result.cta}`);

  // Save as deliverable
  const deliverable = await prisma.deliverable.create({
    data: {
      brandId: brand.id,
      platform: "X_SINGLE",
      pipelineType: "viral_micro",
      copyMarkdown: result.primaryPost,
      postingPlan: result.postingPlan as object,
      status: "REVIEW",
    },
  });

  console.log(`\n  ✓ Deliverable saved: ${deliverable.id}`);
  return deliverable.id;
}

// ─── Test Carousel Engine ──────────────────────────────────────
async function testCarousel() {
  console.log("\n═══════════════════════════════════════════════");
  console.log("  TESTING: Carousel Engine (Instagram)");
  console.log("═══════════════════════════════════════════════\n");

  const brand = await getBrand();
  const research = await getResearch();
  const voiceRules = getVoiceRules(brand);

  console.log("  Generating carousel...\n");

  const { runCarouselEngine } = await import("../src/lib/yantri/engines/carousel");

  const start = Date.now();
  const result = await runCarouselEngine({
    narrativeAngle: TEST_TOPIC,
    brandName: brand.name,
    brandTone: brand.tone ?? "analytical-provocative",
    voiceRules,
    language: brand.language ?? "English",
    researchResults: research,
    trendHeadline: "India's $10B Chip Race",
  });
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`  ✓ Generated in ${elapsed}s via ${result.model}`);
  console.log(`  ✓ Slides: ${result.slideCount}`);
  console.log(`  ✓ Narrative arc: ${result.narrativeArc}`);

  console.log("\n  ─── SLIDES ───");
  for (const slide of result.slides) {
    console.log(`  [${slide.position}] ${slide.role.toUpperCase()}: ${slide.headline}`);
    console.log(`      Body: ${slide.bodyText}`);
    console.log(`      Overlay: ${slide.textOverlay}`);
  }

  console.log("\n  ─── CAPTION ───");
  console.log(result.caption.slice(0, 500));

  // Save as deliverable
  const deliverable = await prisma.deliverable.create({
    data: {
      brandId: brand.id,
      platform: "META_CAROUSEL",
      pipelineType: "carousel",
      copyMarkdown: result.caption,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      carouselData: JSON.parse(JSON.stringify({
        slides: result.slides,
        narrativeArc: result.narrativeArc,
        slideCount: result.slideCount,
        hashtags: result.hashtags,
      })) as any,
      status: "REVIEW",
    },
  });

  // Save slide assets
  for (const slide of result.slides) {
    await prisma.asset.create({
      data: {
        deliverableId: deliverable.id,
        type: "CAROUSEL_SLIDE",
        url: "",
        promptUsed: slide.visualPrompt,
        slideIndex: slide.position,
        metadata: {
          headline: slide.headline,
          bodyText: slide.bodyText,
          textOverlay: slide.textOverlay,
          role: slide.role,
          colorHex: slide.colorHex,
        },
      },
    });
  }

  console.log(`\n  ✓ Deliverable saved: ${deliverable.id}`);
  console.log(`  ✓ ${result.slides.length} slide assets saved`);
  return deliverable.id;
}

// ─── Test Approval Flow ──────────────────────────────────────
async function testApprovalFlow(deliverableId: string) {
  console.log("\n═══════════════════════════════════════════════");
  console.log("  TESTING: Approval Flow");
  console.log("═══════════════════════════════════════════════\n");

  // Check current status
  const d = await prisma.deliverable.findUnique({ where: { id: deliverableId } });
  console.log(`  Deliverable: ${deliverableId}`);
  console.log(`  Current status: ${d?.status}`);
  console.log(`  Platform: ${d?.platform}`);

  // Test approve
  console.log("\n  Testing APPROVE action...");
  await prisma.deliverable.update({
    where: { id: deliverableId },
    data: { status: "APPROVED" },
  });

  // Create PMS task (simulating what the API does)
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (admin) {
    const task = await prisma.task.create({
      data: {
        title: `Publish: ${d?.platform?.replace(/_/g, " ")} content`,
        description: `Approved Yantri deliverable.\nDeliverable ID: ${deliverableId}\nPlatform: ${d?.platform}`,
        status: "CREATED",
        priority: "HIGH",
        creatorId: admin.id,
        brandId: d?.brandId ?? undefined,
      },
    });
    console.log(`  ✓ Deliverable APPROVED`);
    console.log(`  ✓ PMS Task created: ${task.id} — "${task.title}"`);
  }

  // Test reject on another deliverable
  const reviewDeliverable = await prisma.deliverable.findFirst({
    where: { status: "REVIEW", id: { not: deliverableId } },
  });
  if (reviewDeliverable) {
    console.log(`\n  Testing KILL (reject) on ${reviewDeliverable.id}...`);
    await prisma.deliverable.update({
      where: { id: reviewDeliverable.id },
      data: { status: "KILLED" },
    });
    console.log(`  ✓ Deliverable KILLED`);
  }
}

// ─── Main ──────────────────────────────────────────────────────
async function main() {
  const engine = process.argv[2] ?? "all";

  console.log("╔═══════════════════════════════════════════════╗");
  console.log("║  YANTRI PIPELINE END-TO-END TEST              ║");
  console.log("╚═══════════════════════════════════════════════╝");
  console.log(`\n  Topic: "${TEST_TOPIC}"`);
  console.log(`  Engine: ${engine}`);
  console.log(`  Time: ${new Date().toISOString()}`);

  // Check env
  console.log("\n  ─── ENVIRONMENT CHECK ───");
  console.log(`  ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? "✓ set" : "✗ MISSING"}`);
  console.log(`  GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? "✓ set" : "✗ MISSING"}`);
  console.log(`  DATABASE_URL: ${process.env.DATABASE_URL ? "✓ set" : "✗ MISSING"}`);

  const deliverableIds: string[] = [];

  try {
    if (engine === "cinematic" || engine === "all") {
      deliverableIds.push(await testCinematic());
    }
    if (engine === "viral-micro" || engine === "all") {
      deliverableIds.push(await testViralMicro());
    }
    if (engine === "carousel" || engine === "all") {
      deliverableIds.push(await testCarousel());
    }

    // Test approval flow on first deliverable
    if (deliverableIds.length > 0) {
      await testApprovalFlow(deliverableIds[0]);
    }

    // Final summary
    console.log("\n╔═══════════════════════════════════════════════╗");
    console.log("║  TEST SUMMARY                                 ║");
    console.log("╚═══════════════════════════════════════════════╝\n");

    const allDeliverables = await prisma.deliverable.findMany({
      where: { id: { in: deliverableIds } },
      select: { id: true, status: true, platform: true, pipelineType: true },
    });
    for (const d of allDeliverables) {
      console.log(`  ${d.platform} (${d.pipelineType}): ${d.status} — ${d.id}`);
    }

    const taskCount = await prisma.task.count({
      where: { description: { contains: "Yantri deliverable" } },
    });
    console.log(`\n  PMS Tasks created from approvals: ${taskCount}`);

  } catch (error) {
    console.error("\n  ✗ Pipeline test failed:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
