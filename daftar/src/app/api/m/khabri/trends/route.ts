import { NextResponse } from "next/server";
import { getAuthSession, unauthorized } from "@/lib/api-utils";

// ─── Mock Trend Time-Series Data ────────────────────────

function generateTimeSeries(keyword: string, spikeHour: number, baseVolume: number, spikeMultiplier: number) {
  const now = new Date("2026-03-10T12:00:00Z");
  const points = [];
  for (let h = 47; h >= 0; h--) {
    const t = new Date(now.getTime() - h * 3600000);
    const distFromSpike = Math.abs(h - spikeHour);
    const spike = distFromSpike < 4 ? spikeMultiplier * Math.exp(-0.5 * distFromSpike) : 1;
    const noise = 0.8 + Math.random() * 0.4;
    points.push({
      timestamp: t.toISOString(),
      volume: Math.round(baseVolume * spike * noise),
    });
  }
  return { keyword, points };
}

const MOCK_TRENDS = [
  generateTimeSeries("AI Video", 6, 120, 8.5),
  generateTimeSeries("Next.js 16", 12, 80, 6.2),
  generateTimeSeries("Deepfake Elections", 3, 60, 12.0),
  generateTimeSeries("Creator Economy", 18, 150, 3.5),
  generateTimeSeries("EU AI Act", 10, 95, 5.0),
  generateTimeSeries("AlphaFold 4", 8, 70, 7.8),
  generateTimeSeries("Data Breach India", 4, 45, 11.0),
  generateTimeSeries("YouTube Shorts", 20, 200, 2.8),
];

// Breaking anomalies: keywords that spiked > 500% in last 24h
const MOCK_ANOMALIES = [
  {
    id: "anom-001",
    keyword: "Deepfake Elections",
    currentVolume: 720,
    baselineVolume: 60,
    spikePercent: 1100,
    detectedAt: "2026-03-10T09:00:00Z",
    severity: "CRITICAL" as const,
  },
  {
    id: "anom-002",
    keyword: "Data Breach India",
    currentVolume: 495,
    baselineVolume: 45,
    spikePercent: 1000,
    detectedAt: "2026-03-10T08:15:00Z",
    severity: "CRITICAL" as const,
  },
  {
    id: "anom-003",
    keyword: "AI Video",
    currentVolume: 1020,
    baselineVolume: 120,
    spikePercent: 750,
    detectedAt: "2026-03-10T06:30:00Z",
    severity: "HIGH" as const,
  },
  {
    id: "anom-004",
    keyword: "AlphaFold 4",
    currentVolume: 546,
    baselineVolume: 70,
    spikePercent: 680,
    detectedAt: "2026-03-10T04:00:00Z",
    severity: "HIGH" as const,
  },
  {
    id: "anom-005",
    keyword: "EU AI Act",
    currentVolume: 475,
    baselineVolume: 95,
    spikePercent: 400,
    detectedAt: "2026-03-09T16:20:00Z",
    severity: "ELEVATED" as const,
  },
];

// GET /api/m/khabri/trends — Return mocked time-series trend data + anomalies
export async function GET() {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  return NextResponse.json({
    trends: MOCK_TRENDS,
    anomalies: MOCK_ANOMALIES.filter((a) => a.spikePercent >= 500),
    allAnomalies: MOCK_ANOMALIES,
  });
}
