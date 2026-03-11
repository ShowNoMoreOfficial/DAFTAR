"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  Loader2,
  TrendingUp,
  Trophy,
} from "lucide-react";

interface ReportMetrics {
  views?: number;
  engagement?: number;
  posts_published?: number;
  top_content?: { title: string; views: number; platform: string }[];
  growth?: number;
  [key: string]: unknown;
}

interface ClientReport {
  id: string;
  title: string;
  period: string;
  type: string;
  metrics: ReportMetrics;
  summary: string | null;
  generatedAt: string;
}

const typeStyles: Record<string, string> = {
  weekly: "bg-[rgba(59,130,246,0.15)] text-blue-700",
  monthly: "bg-[rgba(168,85,247,0.15)] text-purple-700",
  quarterly: "bg-[rgba(20,184,166,0.15)] text-teal-700",
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function BrandReportsPage() {
  const { brandId } = useParams<{ brandId: string }>();
  const [reports, setReports] = useState<ClientReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/client/brands/${brandId}/reports`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setReports(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [brandId]);

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <Link
        href={`/brands/${brandId}`}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Brand Dashboard
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Reports</h1>
        <p className="text-sm text-[var(--text-muted)]">Performance reports for your brand</p>
      </div>

      {/* Reports list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-primary)]" />
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-5 py-16 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-[var(--text-muted)]" />
          <p className="text-sm text-[var(--text-muted)]">No reports generated yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const isExpanded = expandedId === report.id;
            const metrics = report.metrics || {};

            return (
              <div
                key={report.id}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
              >
                {/* Report header - clickable */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : report.id)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[var(--bg-surface)]"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-primary)]/10">
                      <BarChart3 className="h-5 w-5 text-[var(--accent-primary)]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                        {report.title}
                      </h3>
                      <div className="mt-0.5 flex items-center gap-2">
                        <Badge
                          className={cn(
                            "text-[10px] font-medium",
                            typeStyles[report.type] || "bg-[var(--bg-elevated)] text-gray-700"
                          )}
                        >
                          {report.type}
                        </Badge>
                        <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                          <Calendar className="h-3 w-3" />
                          {report.period}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          Generated {formatDate(report.generatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-[var(--text-secondary)]" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[var(--text-secondary)]" />
                  )}
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-[var(--border-subtle)] px-5 py-5">
                    {/* Metrics grid */}
                    <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {metrics.views !== undefined && (
                        <div className="rounded-lg bg-[var(--bg-surface)] p-3">
                          <div className="mb-1 flex items-center gap-1.5">
                            <Eye className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
                            <span className="text-[10px] text-[var(--text-secondary)]">Total Views</span>
                          </div>
                          <p className="text-lg font-semibold text-[var(--text-primary)]">
                            {formatNumber(metrics.views)}
                          </p>
                        </div>
                      )}
                      {metrics.engagement !== undefined && (
                        <div className="rounded-lg bg-[var(--bg-surface)] p-3">
                          <div className="mb-1 flex items-center gap-1.5">
                            <TrendingUp className="h-3.5 w-3.5 text-[var(--accent-secondary)]" />
                            <span className="text-[10px] text-[var(--text-secondary)]">Engagement</span>
                          </div>
                          <p className="text-lg font-semibold text-[var(--text-primary)]">
                            {metrics.engagement}%
                          </p>
                        </div>
                      )}
                      {metrics.posts_published !== undefined && (
                        <div className="rounded-lg bg-[var(--bg-surface)] p-3">
                          <div className="mb-1 flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
                            <span className="text-[10px] text-[var(--text-secondary)]">Posts Published</span>
                          </div>
                          <p className="text-lg font-semibold text-[var(--text-primary)]">
                            {metrics.posts_published}
                          </p>
                        </div>
                      )}
                      {metrics.growth !== undefined && (
                        <div className="rounded-lg bg-[var(--bg-surface)] p-3">
                          <div className="mb-1 flex items-center gap-1.5">
                            <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                            <span className="text-[10px] text-[var(--text-secondary)]">Growth</span>
                          </div>
                          <p
                            className={cn(
                              "text-lg font-semibold",
                              metrics.growth >= 0 ? "text-green-600" : "text-red-600"
                            )}
                          >
                            {metrics.growth >= 0 ? "+" : ""}
                            {metrics.growth}%
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Top content */}
                    {metrics.top_content && metrics.top_content.length > 0 && (
                      <div className="mb-5">
                        <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)]">
                          <Trophy className="h-3.5 w-3.5 text-[var(--accent-secondary)]" />
                          Top Performing Content
                        </h4>
                        <div className="space-y-2">
                          {metrics.top_content.map((item, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between rounded-lg bg-[var(--bg-surface)] px-3 py-2"
                            >
                              <div className="flex items-center gap-2">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent-primary)]/10 text-[10px] font-semibold text-[var(--accent-primary)]">
                                  {i + 1}
                                </span>
                                <span className="text-xs font-medium text-[var(--text-primary)]">
                                  {item.title}
                                </span>
                                <Badge variant="secondary" className="text-[9px]">
                                  {item.platform}
                                </Badge>
                              </div>
                              <span className="text-xs text-[var(--text-secondary)]">
                                {formatNumber(item.views)} views
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    {report.summary && (
                      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                        <h4 className="mb-1.5 text-xs font-semibold text-[var(--text-primary)]">Summary</h4>
                        <p className="whitespace-pre-wrap text-xs leading-relaxed text-[var(--text-secondary)]">
                          {report.summary}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
