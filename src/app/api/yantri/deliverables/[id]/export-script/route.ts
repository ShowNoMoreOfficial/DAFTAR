import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/api-utils";

interface ScriptSection {
  type: string;
  text?: string;
  script?: string;
  timeCode?: string;
  duration?: string;
  timestamp?: string;
  title?: string;
  visualNotes?: string;
  visualNote?: string;
  bRoll?: Array<{ description: string; source: string }>;
  lowerThirds?: Array<{ text: string; timing: string }>;
  dataCard?: { stat: string; label: string; source?: string };
  musicMood?: string;
}

interface ScriptData {
  titles?: Array<{ text: string; strategy?: string }>;
  script?: { sections: ScriptSection[]; totalDuration?: string };
  slides?: Array<{ position: number; headline: string; body: string; visualDescription: string; colorAccent: string }>;
  tweets?: Array<{ position: number; text: string; type: string; characterCount?: number }>;
  caption?: string;
  description?: string;
  tags?: string[];
}

interface BRollShot {
  description: string;
  source: string;
  duration: string;
  priority: string;
}

interface BRollEntry {
  section: number;
  shots: BRollShot[];
}

interface PostingPlan {
  bRollSheet?: BRollEntry[];
  keyStakeholders?: Array<{ name: string; title: string; relevance: string; nameCardText: string }>;
  musicBrief?: Array<{ section: string; mood: string; tempo: string; reference: string }>;
}

function safeParseJson<T>(value: unknown): T | null {
  if (value == null) return null;
  if (typeof value === "string") {
    try { return JSON.parse(value) as T; } catch { return null; }
  }
  return value as T;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const CSS = `
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 24px; color: #1a1a1a; line-height: 1.6; background: #fafafa; }
  h1 { font-size: 24px; margin-bottom: 8px; color: #111; }
  .meta { color: #666; font-size: 13px; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 2px solid #e5e5e5; }
  .meta span { margin-right: 16px; }
  .section { margin-bottom: 28px; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden; background: #fff; }
  .section-header { padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f0f0f0; }
  .section-type { font-weight: 700; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; color: #0066cc; }
  .section-title { font-size: 13px; color: #444; margin-left: 8px; }
  .section-time { font-family: 'Consolas', monospace; font-size: 12px; color: #999; }
  .section-body { padding: 16px; }
  .section-body p { font-size: 15px; white-space: pre-wrap; }
  .visual-note { margin-top: 12px; padding: 10px 14px; background: #f0f7ff; border-left: 3px solid #0066cc; font-size: 13px; color: #0066cc; font-style: italic; border-radius: 0 4px 4px 0; }
  .broll-cue { margin-top: 8px; padding: 8px 12px; background: #fff8e1; border-left: 3px solid #ffa000; font-size: 12px; color: #795548; border-radius: 0 4px 4px 0; }
  .data-card { margin-top: 12px; padding: 14px; background: #e8f5e9; border: 1px solid #c8e6c9; border-radius: 6px; text-align: center; }
  .data-card .stat { font-size: 28px; font-weight: 800; color: #2e7d32; }
  .data-card .label { font-size: 13px; color: #4caf50; margin-top: 4px; }
  .data-card .source { font-size: 11px; color: #999; margin-top: 4px; }
  .lower-third { margin-top: 8px; padding: 6px 12px; background: #f3e5f5; border-left: 3px solid #9c27b0; font-size: 12px; color: #6a1b9a; border-radius: 0 4px 4px 0; }
  .music-mood { margin-top: 8px; font-size: 11px; color: #e91e63; font-style: italic; }
  .broll-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  .broll-table th { background: #f5f5f5; padding: 8px 12px; text-align: left; font-size: 12px; font-weight: 600; border-bottom: 2px solid #e0e0e0; }
  .broll-table td { padding: 8px 12px; font-size: 13px; border-bottom: 1px solid #f0f0f0; }
  .broll-table tr:hover { background: #fafafa; }
  .priority-must { color: #d32f2f; font-weight: 600; }
  .priority-nice { color: #1976d2; }
  .stock-links { margin-top: 4px; }
  .stock-links a { font-size: 11px; color: #0066cc; text-decoration: none; margin-right: 12px; }
  .stock-links a:hover { text-decoration: underline; }
  .tweet-card { margin-bottom: 12px; padding: 16px; border: 1px solid #e5e5e5; border-radius: 12px; background: #fff; }
  .tweet-pos { font-size: 11px; font-weight: 700; color: #1da1f2; margin-bottom: 6px; }
  .tweet-text { font-size: 15px; white-space: pre-wrap; }
  .tweet-meta { margin-top: 8px; font-size: 11px; color: #999; }
  .slide-card { margin-bottom: 16px; padding: 16px; border: 1px solid #e5e5e5; border-radius: 8px; background: #fff; display: flex; gap: 16px; }
  .slide-num { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: #fff; flex-shrink: 0; }
  .slide-content { flex: 1; }
  .slide-headline { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
  .slide-body { font-size: 13px; color: #555; }
  .slide-visual { font-size: 12px; color: #0066cc; font-style: italic; margin-top: 8px; }
  @media print { body { padding: 20px; } .section { break-inside: avoid; } }
</style>
`;

function buildScriptHtml(deliverable: {
  id: string;
  platform: string;
  brand: { name: string } | null;
  tree: { title: string } | null;
  researchPrompt: string | null;
  copyMarkdown: string | null;
  scriptData: unknown;
  carouselData: unknown;
  postingPlan: unknown;
  createdAt: Date;
}): string {
  const structured: ScriptData = safeParseJson(deliverable.scriptData) ?? safeParseJson(deliverable.carouselData) ?? {};
  const title = deliverable.tree?.title ?? deliverable.researchPrompt ?? "Content Script";
  const brand = deliverable.brand?.name ?? "—";
  const platform = deliverable.platform;
  const sections = structured.script?.sections ?? [];
  const tweets = structured.tweets ?? [];
  const slides = structured.slides ?? [];
  const totalDuration = structured.script?.totalDuration ?? "";
  const titles = structured.titles ?? [];
  const date = new Date(deliverable.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  let html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(title)} — Script</title>${CSS}</head><body>`;

  html += `<h1>${escapeHtml(title)}</h1>`;
  html += `<div class="meta"><span>Brand: <strong>${escapeHtml(brand)}</strong></span><span>Platform: <strong>${platform}</strong></span>${totalDuration ? `<span>Duration: <strong>${escapeHtml(totalDuration)}</strong></span>` : ""}<span>Date: ${date}</span></div>`;

  // Title options
  if (titles.length > 0) {
    html += `<div class="section"><div class="section-header"><span class="section-type">Title Options</span></div><div class="section-body">`;
    for (const t of titles) {
      html += `<p style="margin-bottom:8px"><strong>${escapeHtml(t.text)}</strong>${t.strategy ? ` <em style="color:#999;font-size:12px">(${escapeHtml(t.strategy.replace(/_/g, " "))})</em>` : ""}</p>`;
    }
    html += `</div></div>`;
  }

  // Script sections (YouTube / editorial)
  if (sections.length > 0) {
    for (const s of sections) {
      const sectionText = s.text ?? s.script ?? "";
      const timeDisplay = s.timeCode ?? s.duration ?? s.timestamp ?? "";
      const visualDisplay = s.visualNotes ?? s.visualNote ?? "";

      html += `<div class="section"><div class="section-header"><div><span class="section-type">${escapeHtml(s.type)}</span>${s.title ? `<span class="section-title">${escapeHtml(s.title)}</span>` : ""}</div><span class="section-time">${escapeHtml(timeDisplay)}</span></div><div class="section-body">`;
      html += `<p>${escapeHtml(sectionText)}</p>`;
      if (visualDisplay) html += `<div class="visual-note">Visual: ${escapeHtml(visualDisplay)}</div>`;
      if (s.bRoll) {
        for (const b of s.bRoll) {
          html += `<div class="broll-cue">B-Roll: ${escapeHtml(b.description)}${b.source ? ` (${escapeHtml(b.source)})` : ""}</div>`;
        }
      }
      if (s.dataCard) {
        html += `<div class="data-card"><div class="stat">${escapeHtml(s.dataCard.stat)}</div><div class="label">${escapeHtml(s.dataCard.label)}</div>${s.dataCard.source ? `<div class="source">Source: ${escapeHtml(s.dataCard.source)}</div>` : ""}</div>`;
      }
      if (s.lowerThirds) {
        for (const lt of s.lowerThirds) {
          html += `<div class="lower-third">Lower Third: "${escapeHtml(lt.text)}" @ ${escapeHtml(lt.timing)}</div>`;
        }
      }
      if (s.musicMood) html += `<div class="music-mood">Music mood: ${escapeHtml(s.musicMood)}</div>`;
      html += `</div></div>`;
    }
  }

  // X Thread
  if (tweets.length > 0) {
    for (const t of tweets) {
      html += `<div class="tweet-card"><div class="tweet-pos">Tweet ${t.position}</div><div class="tweet-text">${escapeHtml(t.text)}</div><div class="tweet-meta">${t.type}${t.characterCount ? ` — ${t.characterCount} chars` : ""}</div></div>`;
    }
  }

  // Carousel slides
  if (slides.length > 0) {
    for (const s of slides) {
      const color = s.colorAccent || "#333";
      html += `<div class="slide-card"><div class="slide-num" style="background:${color}">${s.position}</div><div class="slide-content"><div class="slide-headline">${escapeHtml(s.headline)}</div><div class="slide-body">${escapeHtml(s.body)}</div><div class="slide-visual">${escapeHtml(s.visualDescription)}</div></div></div>`;
    }
  }

  // Raw markdown fallback
  if (sections.length === 0 && tweets.length === 0 && slides.length === 0 && deliverable.copyMarkdown) {
    html += `<div class="section"><div class="section-header"><span class="section-type">Content</span></div><div class="section-body"><p>${escapeHtml(deliverable.copyMarkdown)}</p></div></div>`;
  }

  html += `</body></html>`;
  return html;
}

function buildBRollHtml(deliverable: {
  platform: string;
  brand: { name: string } | null;
  tree: { title: string } | null;
  researchPrompt: string | null;
  postingPlan: unknown;
  createdAt: Date;
}): string {
  const posting = safeParseJson<PostingPlan>(deliverable.postingPlan);
  const bRollSheet = posting?.bRollSheet ?? [];
  const title = deliverable.tree?.title ?? deliverable.researchPrompt ?? "B-Roll Sheet";
  const brand = deliverable.brand?.name ?? "—";
  const date = new Date(deliverable.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  let html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(title)} — B-Roll Sheet</title>${CSS}</head><body>`;
  html += `<h1>B-Roll Sheet</h1>`;
  html += `<div class="meta"><span><strong>${escapeHtml(title)}</strong></span><span>Brand: ${escapeHtml(brand)}</span><span>${date}</span></div>`;

  for (const entry of bRollSheet) {
    html += `<div class="section"><div class="section-header"><span class="section-type">Section ${entry.section}</span><span class="section-time">${entry.shots.length} shot${entry.shots.length !== 1 ? "s" : ""}</span></div><div class="section-body"><table class="broll-table"><thead><tr><th>Description</th><th>Source</th><th>Duration</th><th>Priority</th><th>Stock Search</th></tr></thead><tbody>`;
    for (const shot of entry.shots) {
      const searchTerms = shot.description.replace(/[^\w\s]/g, "").split(" ").filter(w => w.length > 3).slice(0, 3).join(" ");
      const pexelsUrl = `https://www.pexels.com/search/videos/${encodeURIComponent(searchTerms)}/`;
      const pixabayUrl = `https://pixabay.com/videos/search/${encodeURIComponent(searchTerms)}/`;
      const priorityClass = shot.priority === "must-have" ? "priority-must" : "priority-nice";

      html += `<tr><td>${escapeHtml(shot.description)}</td><td>${escapeHtml(shot.source)}</td><td>${escapeHtml(shot.duration)}</td><td class="${priorityClass}">${escapeHtml(shot.priority)}</td><td class="stock-links"><a href="${pexelsUrl}" target="_blank">Pexels</a><a href="${pixabayUrl}" target="_blank">Pixabay</a></td></tr>`;
    }
    html += `</tbody></table></div></div>`;
  }

  // Stakeholders
  const stakeholders = posting?.keyStakeholders ?? [];
  if (stakeholders.length > 0) {
    html += `<div class="section"><div class="section-header"><span class="section-type">Key Stakeholders</span></div><div class="section-body"><table class="broll-table"><thead><tr><th>Name</th><th>Title</th><th>Name Card Text</th><th>Relevance</th></tr></thead><tbody>`;
    for (const s of stakeholders) {
      html += `<tr><td><strong>${escapeHtml(s.name)}</strong></td><td>${escapeHtml(s.title)}</td><td>${escapeHtml(s.nameCardText)}</td><td>${escapeHtml(s.relevance)}</td></tr>`;
    }
    html += `</tbody></table></div></div>`;
  }

  // Music brief
  const musicBrief = posting?.musicBrief ?? [];
  if (musicBrief.length > 0) {
    html += `<div class="section"><div class="section-header"><span class="section-type">Music Brief</span></div><div class="section-body"><table class="broll-table"><thead><tr><th>Sections</th><th>Mood</th><th>Tempo</th><th>Reference</th></tr></thead><tbody>`;
    for (const m of musicBrief) {
      html += `<tr><td>${escapeHtml(m.section)}</td><td>${escapeHtml(m.mood)}</td><td>${escapeHtml(m.tempo)}</td><td>${escapeHtml(m.reference)}</td></tr>`;
    }
    html += `</tbody></table></div></div>`;
  }

  html += `</body></html>`;
  return html;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const exportType = req.nextUrl.searchParams.get("type") ?? "script";

  const deliverable = await prisma.deliverable.findUnique({
    where: { id },
    include: {
      brand: { select: { name: true } },
      tree: { select: { title: true } },
    },
  });

  if (!deliverable) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const safeTitle = (deliverable.tree?.title ?? deliverable.researchPrompt ?? "content")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .substring(0, 50);

  if (exportType === "broll") {
    const html = buildBRollHtml(deliverable);
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${safeTitle}-broll-sheet.html"`,
      },
    });
  }

  const html = buildScriptHtml(deliverable);
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeTitle}-script.html"`,
    },
  });
}
