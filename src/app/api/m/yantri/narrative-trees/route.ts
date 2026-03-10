import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, unauthorized } from "@/lib/api-utils";

const MOCK_TREES = [
  {
    id: "nt-1",
    title: "Iran-Israel Escalation & Regional Fallout",
    status: "DISCOVERING",
    branchCount: 7,
    signalCount: 14,
    lastUpdated: "2026-03-09T18:30:00Z",
    summary: "Tracking the multi-front escalation between Iran and Israel, including proxy dynamics in Lebanon and Yemen, economic sanctions impact, and diplomatic back-channels via Oman.",
  },
  {
    id: "nt-2",
    title: "India's Semiconductor Push — Fab City Gujarat",
    status: "DEVELOPING",
    branchCount: 4,
    signalCount: 9,
    lastUpdated: "2026-03-08T12:15:00Z",
    summary: "India's $10B semiconductor fab investment in Gujarat — supply chain dependencies, geopolitical leverage against China, TSMC partnership signals, and workforce readiness.",
  },
  {
    id: "nt-3",
    title: "Rupee Depreciation & Capital Flight Patterns",
    status: "DEVELOPING",
    branchCount: 5,
    signalCount: 11,
    lastUpdated: "2026-03-07T09:00:00Z",
    summary: "INR hitting 87/USD — RBI intervention limits, FII outflows, impact on import-dependent sectors, and comparison with 2013 taper tantrum dynamics.",
  },
  {
    id: "nt-4",
    title: "AI Regulation — EU AI Act Enforcement Begins",
    status: "DISCOVERING",
    branchCount: 3,
    signalCount: 6,
    lastUpdated: "2026-03-06T14:45:00Z",
    summary: "EU AI Act Phase 1 enforcement starting. Tracking compliance timelines, impact on Indian IT services companies, and US counter-positioning.",
  },
  {
    id: "nt-5",
    title: "Pakistan Political Crisis — Army vs Judiciary",
    status: "DEVELOPING",
    branchCount: 6,
    signalCount: 12,
    lastUpdated: "2026-03-05T20:00:00Z",
    summary: "Escalating constitutional crisis in Pakistan — Supreme Court vs military establishment, PTI's legal strategy, and implications for India-Pakistan relations.",
  },
  {
    id: "nt-6",
    title: "ISRO Gaganyaan — Final Test Flight Coverage",
    status: "ARCHIVED",
    branchCount: 3,
    signalCount: 8,
    lastUpdated: "2026-02-28T16:00:00Z",
    summary: "Coverage arc for ISRO's crewed spaceflight program. Final uncrewed test completed. Archiving as narrative has been fully produced.",
  },
  {
    id: "nt-7",
    title: "Global Tech Layoffs Wave 3 — Q1 2026",
    status: "DISCOVERING",
    branchCount: 2,
    signalCount: 5,
    lastUpdated: "2026-03-10T08:00:00Z",
    summary: "Third wave of tech layoffs hitting mid-size companies. Tracking India GCC impact, startup funding freeze correlation, and workforce migration patterns.",
  },
  {
    id: "nt-8",
    title: "Climate Finance — COP31 Pre-Negotiations",
    status: "ARCHIVED",
    branchCount: 4,
    signalCount: 7,
    lastUpdated: "2026-02-20T11:30:00Z",
    summary: "Pre-COP31 climate finance negotiations. India's position on Loss & Damage fund, carbon credit market developments.",
  },
];

// GET /api/m/yantri/narrative-trees — List narrative trees (mock)
export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");

  let trees = MOCK_TREES;
  if (status && status !== "ALL") {
    trees = trees.filter((t) => t.status === status);
  }

  return NextResponse.json(trees);
}
