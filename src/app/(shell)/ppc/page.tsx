"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Target,
  Plus,
  TrendingUp,
  DollarSign,
  MousePointerClick,
  BarChart3,
  Play,
  Pause,
  CheckCircle2,
  Sparkles,
  Loader2,
  Eye,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { CreateCampaignDialog } from "@/components/ppc/create-campaign-dialog";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────

interface Campaign {
  id: string;
  name: string;
  platform: string;
  objective: string;
  status: string;
  dailyBudget: number | null;
  totalBudget: number | null;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  externalId: string | null;
  brand: { id: string; name: string };
  createdBy: { id: string; name: string };
  _count: { dailyMetrics: number; recommendations: number };
  createdAt: string;
}

interface CampaignDetail extends Omit<Campaign, "_count"> {
  dailyMetrics: DailyMetric[];
  recommendations: Recommendation[];
}

interface DailyMetric {
  id: string;
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  ctr: number | null;
  cpc: number | null;
  cpm: number | null;
  roas: number | null;
}

interface Recommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  confidence: number;
  applied: boolean;
  appliedAt: string | null;
  createdAt: string;
}

interface OverviewData {
  activeCampaigns: number;
  totalCampaigns: number;
  totalSpend: number;
  totalClicks: number;
  totalImpressions: number;
  totalConversions: number;
  avgCtr: number;
  spendByPlatform: Record<string, number>;
  spendByBrand: { name: string; spend: number }[];
  dailyTrend: { date: string; spend: number; clicks: number; impressions: number }[];
}

interface BrandOption {
  id: string;
  name: string;
}

// ─── Constants ───────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-[var(--bg-elevated)] text-gray-700",
  ACTIVE: "bg-[rgba(16,185,129,0.15)] text-emerald-700",
  PAUSED: "bg-[rgba(245,158,11,0.15)] text-amber-700",
  COMPLETED: "bg-[rgba(59,130,246,0.15)] text-blue-700",
  CANCELLED: "bg-[var(--bg-elevated)] text-gray-400",
};

const PLATFORM_LABELS: Record<string, string> = {
  GOOGLE_ADS: "Google Ads",
  META_ADS: "Meta Ads",
  YOUTUBE_ADS: "YouTube Ads",
  LINKEDIN_ADS: "LinkedIn Ads",
  X_ADS: "X Ads",
};

const OBJECTIVE_LABELS: Record<string, string> = {
  BRAND_AWARENESS: "Awareness",
  TRAFFIC: "Traffic",
  ENGAGEMENT: "Engagement",
  VIDEO_VIEWS: "Video Views",
  LEAD_GENERATION: "Leads",
  CONVERSIONS: "Conversions",
};

const PLATFORM_COLORS: Record<string, string> = {
  GOOGLE_ADS: "bg-[rgba(66,133,244,0.15)] text-blue-700",
  META_ADS: "bg-[rgba(59,130,246,0.15)] text-blue-700",
  YOUTUBE_ADS: "bg-[rgba(239,68,68,0.15)] text-red-700",
  LINKEDIN_ADS: "bg-[rgba(10,102,194,0.15)] text-blue-800",
  X_ADS: "bg-[var(--bg-elevated)] text-gray-700",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

// ─── Main Page ──────────────────────────────────────────

export default function PPCPage() {
  const { data: session } = useSession();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "campaigns" | "recommendations">("overview");
  const [createOpen, setCreateOpen] = useState(false);

  // Campaign filters
  const [statusFilter, setStatusFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");

  // Reference data
  const [brands, setBrands] = useState<BrandOption[]>([]);

  // Detail panel
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Recommendations
  const [recCampaignId, setRecCampaignId] = useState("");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [generatingRecs, setGeneratingRecs] = useState(false);

  const isEditor = session?.user?.role === "ADMIN" || session?.user?.role === "DEPT_HEAD";

  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch("/api/ppc/overview");
      if (res.ok) setOverview(await res.json());
    } catch {
      /* ignore */
    }
  }, []);

  const fetchCampaigns = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (brandFilter) params.set("brandId", brandFilter);
    if (platformFilter) params.set("platform", platformFilter);

    try {
      const res = await fetch(`/api/ppc/campaigns?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setCampaigns(Array.isArray(json) ? json : json.data ?? []);
      }
    } catch {
      /* ignore */
    }
  }, [statusFilter, brandFilter, platformFilter]);

  const fetchBrands = useCallback(async () => {
    try {
      const res = await fetch("/api/brands");
      if (res.ok) {
        const d = await res.json();
        setBrands(Array.isArray(d) ? d : []);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchOverview(), fetchCampaigns(), fetchBrands()]).finally(() =>
      setLoading(false)
    );
  }, [fetchOverview, fetchCampaigns, fetchBrands]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/ppc/campaigns/${id}`);
      if (res.ok) setSelectedCampaign(await res.json());
    } catch {
      /* ignore */
    } finally {
      setDetailLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/ppc/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success(`Campaign ${status.toLowerCase()}`);
        fetchCampaigns();
        fetchOverview();
        if (selectedCampaign?.id === id) openDetail(id);
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const generateRecommendations = async () => {
    if (!recCampaignId) return;
    setGeneratingRecs(true);
    try {
      const res = await fetch("/api/ppc/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: recCampaignId }),
      });
      if (res.ok) {
        const recs = await res.json();
        setRecommendations(recs);
        toast.success(`${recs.length} recommendations generated`);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to generate recommendations");
      }
    } catch {
      toast.error("Failed to generate recommendations");
    } finally {
      setGeneratingRecs(false);
    }
  };

  const applyRecommendation = async (id: string) => {
    try {
      const res = await fetch(`/api/ppc/recommendations/${id}`, { method: "PATCH" });
      if (res.ok) {
        setRecommendations((prev) =>
          prev.map((r) => (r.id === id ? { ...r, applied: true, appliedAt: new Date().toISOString() } : r))
        );
        toast.success("Recommendation marked as applied");
      }
    } catch {
      toast.error("Failed to apply recommendation");
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-primary)]" />
      </div>
    );
  }

  const selectClass =
    "rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]";

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Campaigns</h2>
          <p className="text-sm text-[var(--text-muted)]">
            Manage PPC campaigns, track performance, and get AI recommendations
          </p>
        </div>
        {isEditor && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Create Campaign
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <KPICard
          label="Active Campaigns"
          value={overview?.activeCampaigns ?? 0}
          icon={<Target className="h-4 w-4 text-[var(--accent-primary)]" />}
        />
        <KPICard
          label="Total Spend (30d)"
          value={formatCurrency(overview?.totalSpend ?? 0)}
          icon={<DollarSign className="h-4 w-4 text-emerald-600" />}
        />
        <KPICard
          label="Avg CTR"
          value={`${overview?.avgCtr ?? 0}%`}
          icon={<MousePointerClick className="h-4 w-4 text-blue-600" />}
        />
        <KPICard
          label="Conversions (30d)"
          value={formatNumber(overview?.totalConversions ?? 0)}
          icon={<TrendingUp className="h-4 w-4 text-purple-600" />}
        />
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-lg bg-[var(--bg-elevated)] p-1">
        {(["overview", "campaigns", "recommendations"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-md px-4 py-1.5 text-xs font-medium transition-colors",
              tab === t
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            )}
          >
            {t === "overview" ? "Overview" : t === "campaigns" ? "Campaigns" : "AI Recommendations"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "overview" && <OverviewTab overview={overview} />}
      {tab === "campaigns" && (
        <CampaignsTab
          campaigns={campaigns}
          brands={brands}
          statusFilter={statusFilter}
          brandFilter={brandFilter}
          platformFilter={platformFilter}
          onStatusFilter={setStatusFilter}
          onBrandFilter={setBrandFilter}
          onPlatformFilter={setPlatformFilter}
          onViewDetail={openDetail}
          onUpdateStatus={updateStatus}
          isEditor={isEditor}
          selectClass={selectClass}
        />
      )}
      {tab === "recommendations" && (
        <RecommendationsTab
          campaigns={campaigns}
          recCampaignId={recCampaignId}
          onCampaignSelect={setRecCampaignId}
          recommendations={recommendations}
          generating={generatingRecs}
          onGenerate={generateRecommendations}
          onApply={applyRecommendation}
          isEditor={isEditor}
          selectClass={selectClass}
        />
      )}

      {/* Create Campaign Dialog */}
      <CreateCampaignDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          fetchCampaigns();
          fetchOverview();
        }}
      />

      {/* Detail Slide-over */}
      {(selectedCampaign || detailLoading) && (
        <DetailPanel
          campaign={selectedCampaign}
          loading={detailLoading}
          onClose={() => setSelectedCampaign(null)}
          onUpdateStatus={updateStatus}
          isEditor={isEditor}
        />
      )}
    </div>
  );
}

// ─── Sub-Components ─────────────────────────────────────

function KPICard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">{label}</span>
      </div>
      <p className="text-xl font-bold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function OverviewTab({ overview }: { overview: OverviewData | null }) {
  if (!overview) {
    return <p className="text-sm text-[var(--text-muted)]">No data available yet.</p>;
  }

  const maxDailySpend = Math.max(...overview.dailyTrend.map((d) => d.spend), 1);
  const maxPlatformSpend = Math.max(...Object.values(overview.spendByPlatform), 1);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Daily Spend Trend */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
        <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Daily Spend Trend</h3>
        {overview.dailyTrend.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">No spend data yet.</p>
        ) : (
          <div className="flex items-end gap-[2px]" style={{ height: 120 }}>
            {overview.dailyTrend.slice(-30).map((d) => (
              <div
                key={d.date}
                className="flex-1 rounded-t bg-[var(--accent-primary)] opacity-80 transition-all hover:opacity-100"
                style={{ height: `${(d.spend / maxDailySpend) * 100}%`, minHeight: 2 }}
                title={`${d.date}: ${formatCurrency(d.spend)}`}
              />
            ))}
          </div>
        )}
        <div className="mt-2 flex justify-between text-[10px] text-[var(--text-muted)]">
          <span>{overview.dailyTrend[0]?.date ?? ""}</span>
          <span>{overview.dailyTrend[overview.dailyTrend.length - 1]?.date ?? ""}</span>
        </div>
      </div>

      {/* Spend by Platform */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
        <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Spend by Platform</h3>
        {Object.keys(overview.spendByPlatform).length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">No platform data yet.</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(overview.spendByPlatform)
              .sort(([, a], [, b]) => b - a)
              .map(([platform, spend]) => (
                <div key={platform}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-[var(--text-secondary)]">
                      {PLATFORM_LABELS[platform] || platform}
                    </span>
                    <span className="font-medium text-[var(--text-primary)]">{formatCurrency(spend)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--bg-elevated)]">
                    <div
                      className="h-2 rounded-full bg-[var(--accent-primary)]"
                      style={{ width: `${(spend / maxPlatformSpend) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Spend by Brand */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
        <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Spend by Brand</h3>
        {overview.spendByBrand.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">No brand data yet.</p>
        ) : (
          <div className="space-y-2">
            {overview.spendByBrand.map((b, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-[var(--bg-elevated)] px-3 py-2">
                <span className="text-xs font-medium text-[var(--text-primary)]">{b.name}</span>
                <span className="text-xs font-semibold text-[var(--text-primary)]">{formatCurrency(b.spend)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
        <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">30-Day Summary</h3>
        <div className="grid grid-cols-2 gap-3">
          <StatItem label="Total Impressions" value={formatNumber(overview.totalImpressions)} />
          <StatItem label="Total Clicks" value={formatNumber(overview.totalClicks)} />
          <StatItem label="Total Conversions" value={formatNumber(overview.totalConversions)} />
          <StatItem label="Total Campaigns" value={overview.totalCampaigns.toString()} />
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[var(--bg-elevated)] p-3">
      <p className="text-[10px] text-[var(--text-muted)]">{label}</p>
      <p className="text-lg font-bold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function CampaignsTab({
  campaigns,
  brands,
  statusFilter,
  brandFilter,
  platformFilter,
  onStatusFilter,
  onBrandFilter,
  onPlatformFilter,
  onViewDetail,
  onUpdateStatus,
  isEditor,
  selectClass,
}: {
  campaigns: Campaign[];
  brands: BrandOption[];
  statusFilter: string;
  brandFilter: string;
  platformFilter: string;
  onStatusFilter: (v: string) => void;
  onBrandFilter: (v: string) => void;
  onPlatformFilter: (v: string) => void;
  onViewDetail: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  isEditor: boolean;
  selectClass: string;
}) {
  return (
    <div>
      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select value={statusFilter} onChange={(e) => onStatusFilter(e.target.value)} className={selectClass}>
          <option value="">All Statuses</option>
          {Object.keys(STATUS_STYLES).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={brandFilter} onChange={(e) => onBrandFilter(e.target.value)} className={selectClass}>
          <option value="">All Brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <select value={platformFilter} onChange={(e) => onPlatformFilter(e.target.value)} className={selectClass}>
          <option value="">All Platforms</option>
          {Object.entries(PLATFORM_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {campaigns.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border-subtle)] p-10 text-center">
          <Target className="mx-auto mb-2 h-8 w-8 text-[var(--text-muted)]" />
          <p className="text-sm text-[var(--text-muted)]">No campaigns found</p>
          <p className="text-xs text-[var(--text-muted)]">Create your first campaign to get started</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                <th className="px-4 py-2.5 font-medium text-[var(--text-muted)]">Name</th>
                <th className="px-4 py-2.5 font-medium text-[var(--text-muted)]">Brand</th>
                <th className="px-4 py-2.5 font-medium text-[var(--text-muted)]">Platform</th>
                <th className="px-4 py-2.5 font-medium text-[var(--text-muted)]">Objective</th>
                <th className="px-4 py-2.5 font-medium text-[var(--text-muted)]">Status</th>
                <th className="px-4 py-2.5 font-medium text-[var(--text-muted)]">Budget</th>
                <th className="px-4 py-2.5 font-medium text-[var(--text-muted)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-[var(--border-subtle)] transition-colors hover:bg-[var(--bg-elevated)] cursor-pointer"
                  onClick={() => onViewDetail(c.id)}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--text-primary)]">{c.name}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      Created {formatDate(c.createdAt)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{c.brand.name}</td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", PLATFORM_COLORS[c.platform] || "")}>
                      {PLATFORM_LABELS[c.platform] || c.platform}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {OBJECTIVE_LABELS[c.objective] || c.objective}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", STATUS_STYLES[c.status] || "")}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {c.totalBudget ? formatCurrency(c.totalBudget) : c.dailyBudget ? `${formatCurrency(c.dailyBudget)}/day` : "—"}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onViewDetail(c.id)}>
                        <Eye className="h-3 w-3" />
                      </Button>
                      {isEditor && c.status === "DRAFT" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-emerald-600"
                          onClick={() => onUpdateStatus(c.id, "ACTIVE")}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                      {isEditor && c.status === "ACTIVE" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-amber-600"
                          onClick={() => onUpdateStatus(c.id, "PAUSED")}
                        >
                          <Pause className="h-3 w-3" />
                        </Button>
                      )}
                      {isEditor && c.status === "PAUSED" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-emerald-600"
                          onClick={() => onUpdateStatus(c.id, "ACTIVE")}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RecommendationsTab({
  campaigns,
  recCampaignId,
  onCampaignSelect,
  recommendations,
  generating,
  onGenerate,
  onApply,
  isEditor,
  selectClass,
}: {
  campaigns: Campaign[];
  recCampaignId: string;
  onCampaignSelect: (id: string) => void;
  recommendations: Recommendation[];
  generating: boolean;
  onGenerate: () => void;
  onApply: (id: string) => void;
  isEditor: boolean;
  selectClass: string;
}) {
  const TYPE_STYLES: Record<string, string> = {
    budget: "bg-[rgba(16,185,129,0.15)] text-emerald-700",
    targeting: "bg-[rgba(59,130,246,0.15)] text-blue-700",
    creative: "bg-[rgba(168,85,247,0.15)] text-purple-700",
    timing: "bg-[rgba(245,158,11,0.15)] text-amber-700",
    platform: "bg-[rgba(236,72,153,0.15)] text-pink-700",
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <select value={recCampaignId} onChange={(e) => onCampaignSelect(e.target.value)} className={selectClass}>
          <option value="">Select a campaign...</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({PLATFORM_LABELS[c.platform] || c.platform})
            </option>
          ))}
        </select>
        {isEditor && (
          <Button size="sm" disabled={!recCampaignId || generating} onClick={onGenerate}>
            {generating ? (
              <>
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="mr-1.5 h-3 w-3" />
                Generate Recommendations
              </>
            )}
          </Button>
        )}
      </div>

      {recommendations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border-subtle)] p-10 text-center">
          <Sparkles className="mx-auto mb-2 h-8 w-8 text-[var(--text-muted)]" />
          <p className="text-sm text-[var(--text-muted)]">No recommendations yet</p>
          <p className="text-xs text-[var(--text-muted)]">
            Select a campaign and generate AI-powered optimization recommendations
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className={cn(
                "rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4",
                rec.applied && "opacity-60"
              )}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", TYPE_STYLES[rec.type] || "bg-[var(--bg-elevated)] text-gray-700")}>
                  {rec.type}
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-16 rounded-full bg-[var(--bg-elevated)]">
                    <div
                      className="h-1.5 rounded-full bg-[var(--accent-primary)]"
                      style={{ width: `${rec.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {Math.round(rec.confidence * 100)}%
                  </span>
                </div>
              </div>
              <h4 className="mb-1 text-sm font-semibold text-[var(--text-primary)]">{rec.title}</h4>
              <p className="mb-3 text-xs text-[var(--text-secondary)] leading-relaxed">{rec.description}</p>
              {rec.applied ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                  <CheckCircle2 className="h-3 w-3" />
                  Applied
                </span>
              ) : (
                isEditor && (
                  <Button variant="outline" size="sm" className="text-[10px]" onClick={() => onApply(rec.id)}>
                    Apply Recommendation
                  </Button>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DetailPanel({
  campaign,
  loading,
  onClose,
  onUpdateStatus,
  isEditor,
}: {
  campaign: CampaignDetail | null;
  loading: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => void;
  isEditor: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <div className="h-full w-full max-w-lg overflow-y-auto bg-[var(--bg-surface)] shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Campaign Details</h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading || !campaign ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--accent-primary)]" />
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Info */}
            <div>
              <h4 className="text-base font-semibold text-[var(--text-primary)]">{campaign.name}</h4>
              <p className="text-xs text-[var(--text-muted)]">{campaign.brand.name} &middot; {PLATFORM_LABELS[campaign.platform]}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <DetailField label="Status" value={campaign.status} />
              <DetailField label="Objective" value={OBJECTIVE_LABELS[campaign.objective] || campaign.objective} />
              <DetailField label="Daily Budget" value={campaign.dailyBudget ? formatCurrency(campaign.dailyBudget) : "—"} />
              <DetailField label="Total Budget" value={campaign.totalBudget ? formatCurrency(campaign.totalBudget) : "—"} />
              <DetailField label="Start Date" value={campaign.startDate ? formatDate(campaign.startDate) : "—"} />
              <DetailField label="End Date" value={campaign.endDate ? formatDate(campaign.endDate) : "—"} />
            </div>

            {campaign.notes && (
              <div>
                <p className="mb-1 text-[10px] font-medium uppercase text-[var(--text-muted)]">Notes</p>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{campaign.notes}</p>
              </div>
            )}

            {/* Status Actions */}
            {isEditor && (
              <div className="flex gap-2">
                {campaign.status === "DRAFT" && (
                  <Button size="sm" className="flex-1" onClick={() => onUpdateStatus(campaign.id, "ACTIVE")}>
                    <Play className="mr-1.5 h-3 w-3" />
                    Activate
                  </Button>
                )}
                {campaign.status === "ACTIVE" && (
                  <>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => onUpdateStatus(campaign.id, "PAUSED")}>
                      <Pause className="mr-1.5 h-3 w-3" />
                      Pause
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => onUpdateStatus(campaign.id, "COMPLETED")}>
                      <CheckCircle2 className="mr-1.5 h-3 w-3" />
                      Complete
                    </Button>
                  </>
                )}
                {campaign.status === "PAUSED" && (
                  <Button size="sm" className="flex-1" onClick={() => onUpdateStatus(campaign.id, "ACTIVE")}>
                    <Play className="mr-1.5 h-3 w-3" />
                    Resume
                  </Button>
                )}
              </div>
            )}

            {/* Metrics Chart */}
            {campaign.dailyMetrics.length > 0 && (
              <div>
                <h4 className="mb-3 text-xs font-semibold text-[var(--text-primary)]">Recent Performance</h4>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {(() => {
                    const totals = campaign.dailyMetrics.reduce(
                      (acc, m) => ({
                        impressions: acc.impressions + m.impressions,
                        clicks: acc.clicks + m.clicks,
                        conversions: acc.conversions + m.conversions,
                        spend: acc.spend + m.spend,
                      }),
                      { impressions: 0, clicks: 0, conversions: 0, spend: 0 }
                    );
                    return (
                      <>
                        <MiniStat label="Impressions" value={formatNumber(totals.impressions)} />
                        <MiniStat label="Clicks" value={formatNumber(totals.clicks)} />
                        <MiniStat label="Conversions" value={formatNumber(totals.conversions)} />
                        <MiniStat label="Spend" value={formatCurrency(totals.spend)} />
                      </>
                    );
                  })()}
                </div>
                <div className="flex items-end gap-[2px]" style={{ height: 60 }}>
                  {campaign.dailyMetrics
                    .slice()
                    .reverse()
                    .map((m) => {
                      const max = Math.max(...campaign.dailyMetrics.map((x) => x.spend), 1);
                      return (
                        <div
                          key={m.id}
                          className="flex-1 rounded-t bg-[var(--accent-primary)] opacity-70"
                          style={{ height: `${(m.spend / max) * 100}%`, minHeight: 2 }}
                          title={`${m.date.split("T")[0]}: ${formatCurrency(m.spend)}`}
                        />
                      );
                    })}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {campaign.recommendations.length > 0 && (
              <div>
                <h4 className="mb-3 text-xs font-semibold text-[var(--text-primary)]">
                  Recommendations ({campaign.recommendations.length})
                </h4>
                <div className="space-y-2">
                  {campaign.recommendations.slice(0, 5).map((rec) => (
                    <div key={rec.id} className="rounded-lg bg-[var(--bg-elevated)] p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-medium text-[var(--accent-primary)]">{rec.type}</span>
                        {rec.applied && (
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        )}
                      </div>
                      <p className="text-xs font-medium text-[var(--text-primary)]">{rec.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase text-[var(--text-muted)]">{label}</p>
      <p className="text-sm text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[var(--bg-elevated)] px-3 py-2">
      <p className="text-[10px] text-[var(--text-muted)]">{label}</p>
      <p className="text-sm font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}
