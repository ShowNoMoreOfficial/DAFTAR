"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, BarChart3, Eye, TrendingUp, MousePointer } from "lucide-react";

interface PerformanceSummary {
  timeRange: { from: string; to: string; days: number };
  totals: { records: number; impressions: number; views: number; avgEngagementRate: number; avgCtr: number };
  byPlatform: { platform: string; records: number; impressions: number; views: number; avgEngagementRate: number }[];
  byBrand: { brandName: string; records: number; impressions: number; views: number; avgEngagementRate: number }[];
  byContentType: { contentType: string; records: number; impressions: number; views: number; avgEngagementRate: number }[];
  topPerforming: { id: string; platform: string; brandName: string; contentType: string; impressions: number | null; views: number | null; engagementRate: number | null; recordedAt: string }[];
}

function formatNumber(n: number | null): string {
  if (n === null || n === undefined) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

export default function PerformancePage() {
  const [data, setData] = useState<PerformanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/m/yantri/performance/summary?days=30");
      if (res.ok) setData(await res.json());
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#6B7280]" />
      </div>
    );
  }

  if (!data || data.totals.records === 0) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Performance</h1>
          <p className="text-sm text-[#6B7280] mt-1">Content performance analytics (last 30 days)</p>
        </div>
        <Card className="border-[#E5E7EB]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart3 className="h-10 w-10 text-[#D1D5DB] mb-3" />
            <p className="text-sm text-[#6B7280]">No performance data yet.</p>
            <p className="text-xs text-[#9CA3AF] mt-1">Data will appear once content is published and tracked.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Performance</h1>
        <p className="text-sm text-[#6B7280] mt-1">Content performance analytics (last {data.timeRange.days} days)</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Records", value: data.totals.records, icon: BarChart3, color: "text-[#2E86AB]" },
          { label: "Impressions", value: formatNumber(data.totals.impressions), icon: Eye, color: "text-blue-600" },
          { label: "Avg Engagement", value: data.totals.avgEngagementRate + "%", icon: TrendingUp, color: "text-emerald-600" },
          { label: "Avg CTR", value: data.totals.avgCtr + "%", icon: MousePointer, color: "text-amber-600" },
        ].map((stat) => (
          <Card key={stat.label} className="border-[#E5E7EB]">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-[10px] font-medium text-[#6B7280] uppercase tracking-wide">{stat.label}</span>
              </div>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Platform */}
        <Card className="border-[#E5E7EB]">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4">By Platform</h3>
            <div className="space-y-3">
              {data.byPlatform.map((p) => (
                <div key={p.platform} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#1A1A1A]">{p.platform}</p>
                    <p className="text-xs text-[#6B7280]">{p.records} pieces · {formatNumber(p.impressions)} impressions</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {p.avgEngagementRate}% eng
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* By Brand */}
        <Card className="border-[#E5E7EB]">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4">By Brand</h3>
            <div className="space-y-3">
              {data.byBrand.map((b) => (
                <div key={b.brandName} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#1A1A1A]">{b.brandName}</p>
                    <p className="text-xs text-[#6B7280]">{b.records} pieces · {formatNumber(b.impressions)} impressions</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {b.avgEngagementRate}% eng
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing */}
        <Card className="border-[#E5E7EB] lg:col-span-2">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4">Top Performing Content</h3>
            <div className="space-y-3">
              {data.topPerforming.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-[#F8F9FA]">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px]">{t.platform}</Badge>
                      <span className="text-xs text-[#6B7280]">{t.brandName}</span>
                      <span className="text-[10px] text-[#9CA3AF]">{t.contentType}</span>
                    </div>
                    <p className="text-xs text-[#6B7280]">
                      {formatNumber(t.impressions)} impressions · {formatNumber(t.views)} views
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-600">{t.engagementRate}%</p>
                    <p className="text-[10px] text-[#9CA3AF]">engagement</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
