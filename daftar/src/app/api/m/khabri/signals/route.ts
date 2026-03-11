import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, unauthorized } from "@/lib/api-utils";

// ─── Mock Signal Data ───────────────────────────────────

const MOCK_SIGNALS = [
  {
    id: "sig-001",
    title: "OpenAI announces GPT-5 with native video understanding",
    source: "TechCrunch",
    category: "AI",
    impactScore: 9.2,
    sentiment: "Positive" as const,
    timeScraped: "2026-03-10T08:12:00Z",
    content: "OpenAI revealed GPT-5 at a live event, showcasing real-time video comprehension and multi-modal reasoning capabilities.",
    entities: [{ name: "OpenAI", type: "organization" as const, salience: 0.95 }],
    keywords: [{ keyword: "GPT-5", weight: 0.9 }, { keyword: "AI Video", weight: 0.85 }],
  },
  {
    id: "sig-002",
    title: "India's IT Ministry proposes mandatory AI content labeling",
    source: "Reuters",
    category: "Regulation",
    impactScore: 8.5,
    sentiment: "Neutral" as const,
    timeScraped: "2026-03-10T07:45:00Z",
    content: "The Ministry of Electronics and IT released a draft framework requiring AI-generated content to carry visible labels across all platforms.",
    entities: [{ name: "MeitY", type: "organization" as const, salience: 0.88 }],
    keywords: [{ keyword: "AI regulation", weight: 0.92 }, { keyword: "content labeling", weight: 0.78 }],
  },
  {
    id: "sig-003",
    title: "YouTube Shorts overtakes TikTok in India daily active users",
    source: "Bloomberg",
    category: "Social Media",
    impactScore: 7.8,
    sentiment: "Positive" as const,
    timeScraped: "2026-03-10T06:30:00Z",
    content: "Internal data shows YouTube Shorts now has 280M DAUs in India, surpassing TikTok's pre-ban peak.",
    entities: [{ name: "YouTube", type: "company" as const, salience: 0.9 }, { name: "TikTok", type: "company" as const, salience: 0.7 }],
    keywords: [{ keyword: "YouTube Shorts", weight: 0.88 }, { keyword: "short-form video", weight: 0.72 }],
  },
  {
    id: "sig-004",
    title: "Major data breach at Indian fintech unicorn exposes 15M records",
    source: "Economic Times",
    category: "Cybersecurity",
    impactScore: 9.5,
    sentiment: "Negative" as const,
    timeScraped: "2026-03-10T05:15:00Z",
    content: "A critical vulnerability led to the exposure of personal and financial data of 15 million users, prompting CERT-In investigation.",
    entities: [{ name: "CERT-In", type: "organization" as const, salience: 0.82 }],
    keywords: [{ keyword: "data breach", weight: 0.95 }, { keyword: "fintech", weight: 0.8 }],
  },
  {
    id: "sig-005",
    title: "Next.js 16 released with React Server Components improvements",
    source: "Vercel Blog",
    category: "Web Dev",
    impactScore: 6.4,
    sentiment: "Positive" as const,
    timeScraped: "2026-03-10T04:00:00Z",
    content: "Vercel shipped Next.js 16 with dramatically improved RSC streaming, partial prerendering GA, and new cache APIs.",
    entities: [{ name: "Vercel", type: "company" as const, salience: 0.85 }],
    keywords: [{ keyword: "Next.js 16", weight: 0.9 }, { keyword: "React Server Components", weight: 0.82 }],
  },
  {
    id: "sig-006",
    title: "Creator economy reaches $500B valuation globally",
    source: "Forbes",
    category: "Business",
    impactScore: 7.2,
    sentiment: "Positive" as const,
    timeScraped: "2026-03-09T22:30:00Z",
    content: "A Goldman Sachs report pegs the global creator economy at $500B, with India accounting for 12% of total creator revenue.",
    entities: [{ name: "Goldman Sachs", type: "organization" as const, salience: 0.78 }],
    keywords: [{ keyword: "creator economy", weight: 0.88 }, { keyword: "media business", weight: 0.65 }],
  },
  {
    id: "sig-007",
    title: "Google DeepMind achieves breakthrough in protein-drug interaction",
    source: "Nature",
    category: "Science",
    impactScore: 8.9,
    sentiment: "Positive" as const,
    timeScraped: "2026-03-09T20:00:00Z",
    content: "AlphaFold 4 can now predict drug-protein binding with 94% accuracy, potentially cutting drug discovery timelines by years.",
    entities: [{ name: "Google DeepMind", type: "organization" as const, salience: 0.92 }],
    keywords: [{ keyword: "AlphaFold", weight: 0.9 }, { keyword: "drug discovery", weight: 0.85 }],
  },
  {
    id: "sig-008",
    title: "X (Twitter) rolls out long-form video monetization for creators",
    source: "The Verge",
    category: "Social Media",
    impactScore: 6.8,
    sentiment: "Neutral" as const,
    timeScraped: "2026-03-09T18:45:00Z",
    content: "X now allows creators to upload videos up to 3 hours and earn ad revenue, directly competing with YouTube.",
    entities: [{ name: "X Corp", type: "company" as const, salience: 0.88 }],
    keywords: [{ keyword: "X monetization", weight: 0.82 }, { keyword: "video creators", weight: 0.75 }],
  },
  {
    id: "sig-009",
    title: "EU AI Act enforcement begins with first compliance audits",
    source: "Financial Times",
    category: "Regulation",
    impactScore: 8.1,
    sentiment: "Neutral" as const,
    timeScraped: "2026-03-09T16:20:00Z",
    content: "European regulators have started compliance audits under the AI Act, targeting high-risk AI systems in hiring and law enforcement.",
    entities: [{ name: "European Commission", type: "organization" as const, salience: 0.9 }],
    keywords: [{ keyword: "EU AI Act", weight: 0.95 }, { keyword: "AI compliance", weight: 0.82 }],
  },
  {
    id: "sig-010",
    title: "Viral misinformation campaign detected targeting Indian elections",
    source: "BBC",
    category: "Misinformation",
    impactScore: 9.8,
    sentiment: "Negative" as const,
    timeScraped: "2026-03-09T14:00:00Z",
    content: "A coordinated deepfake campaign using AI-generated politician voices has been identified across WhatsApp and Telegram.",
    entities: [{ name: "Election Commission of India", type: "organization" as const, salience: 0.85 }],
    keywords: [{ keyword: "deepfake", weight: 0.95 }, { keyword: "election misinformation", weight: 0.92 }],
  },
  {
    id: "sig-011",
    title: "Instagram tests AI-powered content recommendation overhaul",
    source: "Wired",
    category: "Social Media",
    impactScore: 5.9,
    sentiment: "Neutral" as const,
    timeScraped: "2026-03-09T12:15:00Z",
    content: "Meta is testing a new recommendation algorithm for Instagram that prioritizes original content over reposts.",
    entities: [{ name: "Meta", type: "company" as const, salience: 0.9 }],
    keywords: [{ keyword: "Instagram algorithm", weight: 0.85 }, { keyword: "content discovery", weight: 0.7 }],
  },
  {
    id: "sig-012",
    title: "Anthropic raises $5B at $60B valuation",
    source: "Wall Street Journal",
    category: "Business",
    impactScore: 8.3,
    sentiment: "Positive" as const,
    timeScraped: "2026-03-09T10:00:00Z",
    content: "Anthropic closed its latest funding round, making it one of the most valuable AI startups globally.",
    entities: [{ name: "Anthropic", type: "company" as const, salience: 0.95 }],
    keywords: [{ keyword: "AI funding", weight: 0.88 }, { keyword: "startup valuation", weight: 0.75 }],
  },
];

// GET /api/m/khabri/signals — Return mocked signals with optional filters
export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search")?.toLowerCase() || "";
  const source = searchParams.get("source") || "";
  const minImpact = parseFloat(searchParams.get("minImpact") || "0");

  let filtered = MOCK_SIGNALS;

  if (search) {
    filtered = filtered.filter(
      (s) =>
        s.title.toLowerCase().includes(search) ||
        s.source.toLowerCase().includes(search) ||
        s.category.toLowerCase().includes(search)
    );
  }

  if (source) {
    filtered = filtered.filter((s) => s.source === source);
  }

  if (minImpact > 0) {
    filtered = filtered.filter((s) => s.impactScore >= minImpact);
  }

  return NextResponse.json({
    data: filtered,
    meta: {
      total: filtered.length,
      page: 1,
      pageSize: filtered.length,
      hasMore: false,
    },
    sources: [...new Set(MOCK_SIGNALS.map((s) => s.source))],
  });
}
