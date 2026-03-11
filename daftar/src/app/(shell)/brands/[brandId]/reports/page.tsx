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
  weekly: "bg-blue-100 text-blue-700",
  monthly: "bg-purple-100 text-purple-700",
  quarterly: "bg-teal-100 text-teal-700",
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
        className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1A1A1A]"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Brand Dashboard
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[#1A1A1A]">Reports</h1>
        <p className="text-sm text-[#9CA3AF]">Performance reports for your brand</p>
      </div>

      {/* Reports list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#2E86AB]" />
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-xl border border-[#E5E7EB] bg-white px-5 py-16 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-[#9CA3AF]" />
          <p className="text-sm text-[#9CA3AF]">No reports generated yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const isExpanded = expandedId === report.id;
            const metrics = report.metrics || {};

            return (
              <div
                key={report.id}
                className="rounded-xl border border-[#E5E7EB] bg-white"
              >
                {/* Report header - clickable */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : report.id)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[#F8F9FA]"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2E86AB]/10">
                      <BarChart3 className="h-5 w-5 text-[#2E86AB]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[#1A1A1A]">
                        {report.title}
                      </h3>
                      <div className="mt-0.5 flex items-center gap-2">
                        <Badge
                          className={cn(
                            "text-[10px] font-medium",
                            typeStyles[report.type] || "bg-gray-100 text-gray-700"
                          )}
                        >
                          {report.type}
                        </Badge>
                        <span className="flex items-center gap-1 text-[10px] text-[#9CA3AF]">
                          <Calendar className="h-3 w-3" />
                          {report.period}
                        </span>
                        <span className="text-[10px] text-[#9CA3AF]">
                          Generated {formatDate(report.generatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-[#6B7280]" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[#6B7280]" />
                  )}
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-[#E5E7EB] px-5 py-5">
                    {/* Metrics grid */}
                    <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {metrics.views !== undefined && (
                        <div className="rounded-lg bg-[#F8F9FA] p-3">
                          <div className="mb-1 flex items-center gap-1.5">
                            <Eye className="h-3.5 w-3.5 text-[#2E86AB]" />
                            <span className="text-[10px] text-[#6B7280]">Total Views</span>
                          </div>
                          <p className="text-lg font-semibold text-[#1A1A1A]">
                            {formatNumber(metrics.views)}
                          </p>
                        </div>
                      )}
                      {metrics.engagement !== undefined && (
                        <div className="rounded-lg bg-[#F8F9FA] p-3">
                          <div className="mb-1 flex items-center gap-1.5">
                            <TrendingUp className="h-3.5 w-3.5 text-[#A23B72]" />
                            <span className="text-[10px] text-[#6B7280]">Engagement</span>
                          </div>
                          <p className="text-lg font-semibold text-[#1A1A1A]">
                            {metrics.engagement}%
                          </p>
                        </div>
                      )}
                      {metrics.posts_published !== undefined && (
                        <div className="rounded-lg bg-[#F8F9FA] p-3">
                          <div className="mb-1 flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-[#2E86AB]" />
                            <span className="text-[10px] text-[#6B7280]">Posts Published</span>
                          </div>
                          <p className="text-lg font-semibold text-[#1A1A1A]">
                            {metrics.posts_published}
                          </p>
                        </div>
                      )}
                      {metrics.growth !== undefined && (
                        <div className="rounded-lg bg-[#F8F9FA] p-3">
                          <div className="mb-1 flex items-center gap-1.5">
                            <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                            <span className="text-[10px] text-[#6B7280]">Growth</span>
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
                        <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#1A1A1A]">
                          <Trophy className="h-3.5 w-3.5 text-[#A23B72]" />
                          Top Performing Content
                        </h4>
                        <div className="space-y-2">
                          {metrics.top_content.map((item, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between rounded-lg bg-[#F8F9FA] px-3 py-2"
                            >
                              <div className="flex items-center gap-2">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2E86AB]/10 text-[10px] font-semibold text-[#2E86AB]">
                                  {i + 1}
                                </span>
                                <span className="text-xs font-medium text-[#1A1A1A]">
                                  {item.title}
                                </span>
                                <Badge variant="secondary" className="text-[9px]">
                                  {item.platform}
                                </Badge>
                              </div>
                              <span className="text-xs text-[#6B7280]">
                                {formatNumber(item.views)} views
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    {report.summary && (
                      <div className="rounded-lg border border-[#E5E7EB] bg-[#F8F9FA] p-4">
                        <h4 className="mb-1.5 text-xs font-semibold text-[#1A1A1A]">Summary</h4>
                        <p className="whitespace-pre-wrap text-xs leading-relaxed text-[#6B7280]">
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
