// ─── Khabri Intelligence API Client ────────────────────
//
// Server-side client for the Khabri API.
// Base URL: https://khabri.stallone.co.in/api/v1
// Auth: Bearer token via KHABRI_API_KEY env var
// Rate limit: 500 req/min sliding window

import type {
  KhabriResponse,
  KhabriTrend,
  KhabriSignal,
  KhabriAnomaly,
  KhabriNarrative,
  KhabriNarrativeNode,
  KhabriStakeholder,
  KhabriTimelineEvent,
  KhabriGeoHotspot,
  KhabriCountryIntel,
  KhabriVolumePoint,
  KhabriCategoryBreakdown,
  KhabriSentimentPoint,
  KhabriWebhook,
  KhabriEventType,
  AnomalySeverity,
} from "@/types/khabri";

const KHABRI_BASE_URL = "https://khabri.stallone.co.in/api/v1";

function getApiKey(): string {
  const key = process.env.KHABRI_API_KEY;
  if (!key) throw new Error("KHABRI_API_KEY environment variable is not set");
  return key;
}

async function khabriRequest<T>(
  path: string,
  params?: Record<string, string | number | undefined>
): Promise<KhabriResponse<T>> {
  const url = new URL(`${KHABRI_BASE_URL}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    next: { revalidate: 60 }, // Cache for 60 seconds
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    const code = errorBody?.error?.code || `HTTP_${res.status}`;
    const message = errorBody?.error?.message || res.statusText;
    throw new KhabriApiError(code, message, res.status);
  }

  return res.json();
}

async function khabriMutate<T>(
  path: string,
  method: "POST" | "DELETE",
  body?: Record<string, unknown>
): Promise<KhabriResponse<T>> {
  const res = await fetch(`${KHABRI_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    const code = errorBody?.error?.code || `HTTP_${res.status}`;
    const message = errorBody?.error?.message || res.statusText;
    throw new KhabriApiError(code, message, res.status);
  }

  return res.json();
}

export class KhabriApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "KhabriApiError";
  }
}

// ─── Trends ─────────────────────────────────────────────

export async function getTrends(page = 1, pageSize = 25) {
  return khabriRequest<KhabriTrend[]>("/trends", { page, page_size: pageSize });
}

export async function getTopTrends(limit = 10) {
  return khabriRequest<KhabriTrend[]>("/trends/top", { page_size: limit });
}

export async function getTrendById(id: string) {
  return khabriRequest<KhabriTrend>(`/trends/${encodeURIComponent(id)}`);
}

// ─── Signals ────────────────────────────────────────────

export async function getSignals(page = 1, pageSize = 25) {
  return khabriRequest<KhabriSignal[]>("/signals", { page, page_size: pageSize });
}

export async function searchSignals(query: string, page = 1, pageSize = 25) {
  return khabriRequest<KhabriSignal[]>("/signals/search", { q: query, page, page_size: pageSize });
}

export async function getSignalById(id: string) {
  return khabriRequest<KhabriSignal>(`/signals/${encodeURIComponent(id)}`);
}

// ─── Anomalies ──────────────────────────────────────────

export async function getAnomalies(severity?: AnomalySeverity) {
  return khabriRequest<KhabriAnomaly[]>("/anomalies", { severity });
}

export async function getTrendingAnomalies() {
  return khabriRequest<KhabriAnomaly[]>("/anomalies/trending");
}

// ─── Narratives ─────────────────────────────────────────

export async function getNarratives(page = 1, pageSize = 10) {
  return khabriRequest<KhabriNarrative[]>("/narratives", { page, page_size: pageSize });
}

export async function getNarrativeTree(id: string) {
  return khabriRequest<KhabriNarrativeNode>(`/narratives/${encodeURIComponent(id)}`);
}

export async function getNarrativeTimeline(id: string) {
  return khabriRequest<KhabriTimelineEvent[]>(`/narratives/${encodeURIComponent(id)}/timeline`);
}

export async function getNarrativeStakeholders(id: string) {
  return khabriRequest<KhabriStakeholder[]>(`/narratives/${encodeURIComponent(id)}/stakeholders`);
}

// ─── Geo Intelligence ───────────────────────────────────

export async function searchGeoSignals(query: string, page = 1, pageSize = 25) {
  return khabriRequest<KhabriSignal[]>("/geo/search", { q: query, page, page_size: pageSize });
}

export async function getGeoHotspots(hours = 24, limit = 10) {
  return khabriRequest<KhabriGeoHotspot[]>("/geo/hotspots", { hours, limit });
}

export async function getCountryIntel(countryCode: string) {
  return khabriRequest<KhabriCountryIntel>(`/geo/${encodeURIComponent(countryCode)}`);
}

// ─── Analytics ──────────────────────────────────────────

export async function getSignalVolume(hours = 24, interval: "hour" | "day" = "hour") {
  return khabriRequest<KhabriVolumePoint[]>("/analytics/volume", { hours, interval });
}

export async function getCategoryDistribution(hours = 24) {
  return khabriRequest<KhabriCategoryBreakdown[]>("/analytics/categories", { hours });
}

export async function getSentimentAnalysis(hours = 24, interval: "hour" | "day" = "hour") {
  return khabriRequest<KhabriSentimentPoint[]>("/analytics/sentiment", { hours, interval });
}

// ─── Webhooks ───────────────────────────────────────────

export async function createWebhook(url: string, events: KhabriEventType[]) {
  return khabriMutate<KhabriWebhook>("/webhooks", "POST", { url, events });
}

export async function getWebhooks() {
  return khabriRequest<KhabriWebhook[]>("/webhooks");
}

export async function getWebhookById(id: string) {
  return khabriRequest<KhabriWebhook>(`/webhooks/${encodeURIComponent(id)}`);
}

export async function deleteWebhook(id: string) {
  return khabriMutate<null>(`/webhooks/${encodeURIComponent(id)}`, "DELETE");
}
