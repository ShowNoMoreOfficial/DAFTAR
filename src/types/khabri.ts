// ─── Khabri Intelligence API Types ─────────────────────

// ─── Common ─────────────────────────────────────────────

export interface KhabriMeta {
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface KhabriResponse<T> {
  data: T;
  meta: KhabriMeta;
}

export interface KhabriError {
  error: {
    code: string;
    message: string;
  };
}

// ─── Trends ─────────────────────────────────────────────

export interface KhabriTrend {
  id: string;
  rank: number;
  topic: string;
  score: number;
  category: string | null;
  region: string | null;
  momentum?: number;
  sourceCount?: number;
  firstSeen?: string;
  lastUpdated?: string;
}

// ─── Signals ────────────────────────────────────────────

export interface KhabriSignalEntity {
  name: string;
  type: "person" | "organization" | "company" | "country" | "location";
  salience: number;
}

export interface KhabriSignalKeyword {
  keyword: string;
  weight: number;
}

export interface KhabriSignalLocation {
  name: string;
  type: string;
  lat?: number;
  lng?: number;
}

export interface KhabriSignalSentiment {
  label: "POSITIVE" | "NEGATIVE" | "NEUTRAL" | "MIXED";
  score: number; // -1 to 1
}

export interface KhabriSignal {
  id: string;
  title: string;
  content?: string;
  source?: string;
  sourceUrl?: string;
  publishedAt?: string;
  category?: string;
  entities?: KhabriSignalEntity[];
  keywords?: KhabriSignalKeyword[];
  locations?: KhabriSignalLocation[];
  sentiment?: KhabriSignalSentiment;
  createdAt?: string;
}

// ─── Anomalies ──────────────────────────────────────────

export type AnomalyType = "KEYWORD_SPIKE" | "ENTITY_SURGE" | "SENTIMENT_SHIFT" | "GEO_CONCENTRATION";
export type AnomalySeverity = "ELEVATED" | "HIGH" | "CRITICAL";

export interface KhabriAnomaly {
  id: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  subject: string;
  description?: string;
  deviation?: number;
  baseline?: number;
  current?: number;
  sparkline?: number[]; // 24-hour sparkline data
  detectedAt?: string;
}

// ─── Narratives ─────────────────────────────────────────

export type NarrativeArcPhase = "EMERGENCE" | "ESCALATION" | "PEAK" | "RESOLUTION";

export interface KhabriNarrativeNode {
  id: string;
  summary: string;
  keywords: string[];
  signalCount: number;
  arcPhase: NarrativeArcPhase;
  children?: KhabriNarrativeNode[];
}

export interface KhabriNarrative {
  id: string;
  title: string;
  summary: string;
  keywords: string[];
  signalCount: number;
  arcPhase: NarrativeArcPhase;
  stakeholderCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface KhabriStakeholder {
  name: string;
  type: string;
  role: "protagonist" | "antagonist" | "regulator" | "observer";
  sentiment: number;
}

export interface KhabriTimelineEvent {
  timestamp: string;
  title: string;
  summary: string;
  impact: number;
  sentiment: number;
  sourceUrl?: string;
  arcPhase: NarrativeArcPhase;
}

// ─── Geo Intelligence ───────────────────────────────────

export interface KhabriGeoHotspot {
  countryCode: string;
  country: string;
  signalCount: number;
  topCategories?: string[];
  briefing?: string;
}

export interface KhabriCountryIntel {
  countryCode: string;
  country: string;
  signalCount: number;
  briefing?: string;
  topTopics?: string[];
  sentiment?: KhabriSignalSentiment;
  recentSignals?: KhabriSignal[];
}

// ─── Analytics ──────────────────────────────────────────

export interface KhabriVolumePoint {
  timestamp: string;
  count: number;
}

export interface KhabriCategoryBreakdown {
  category: string;
  count: number;
  percentage: number;
}

export interface KhabriSentimentPoint {
  timestamp: string;
  positive: number;
  negative: number;
  neutral: number;
  mixed: number;
  avgScore: number;
}

// ─── Webhooks ───────────────────────────────────────────

export type KhabriEventType =
  | "trend.new"
  | "trend.spike"
  | "anomaly.detected"
  | "narrative.event"
  | "narrative.phase_change";

export interface KhabriWebhook {
  id: string;
  url: string;
  events: KhabriEventType[];
  secret?: string; // Only shown on creation
  isActive: boolean;
  createdAt: string;
}

// ─── Stream ─────────────────────────────────────────────

export interface KhabriStreamEvent {
  type: KhabriEventType;
  data: Record<string, unknown>;
  timestamp: string;
}
