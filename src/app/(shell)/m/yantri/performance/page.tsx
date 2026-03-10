"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, TrendingUp, Target, Clock, Zap } from "lucide-react";

interface PerformanceSummary {
  totalDeliverables: number;
  avgApprovalRate: number;
  avgTurnaroundHours: number;
  topSkills: { path: string; score: number }[];
  byBrand: { name: string; deliverables: number; approvalRate: number }[];
}

export default function YantriPerformancePage() {
  const [data, setData] = useState<PerformanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/pipeline/performance");
        if (res.ok) setData(await res.json());
      } catch { /* silent */ }
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

  const summary = data || {
    totalDeliverables: 0,
    avgApprovalRate: 0,
    avgTurnaroundHours: 0,
    topSkills: [],
    byBrand: [],
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#1A1A1A]">Pipeline Performance</h1>
        <p className="text-sm text-[#6B7280] mt-1">Yantri pipeline effectiveness metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Deliverables", value: String(summary.totalDeliverables), icon: TrendingUp, color: "text-[#2E86AB]" },
          { label: "Approval Rate", value: summary.avgApprovalRate + "%", icon: Target, color: "text-emerald-600" },
          { label: "Avg Turnaround", value: summary.avgTurnaroundHours + "h", icon: Clock, color: "text-amber-600" },
          { label: "Skills Used", value: String(summary.topSkills.length), icon: Zap, color: "text-purple-600" },
        ].map((stat) => (
          <Card key={stat.label} className="border-[#E5E7EB]">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <stat.icon className={"h-5 w-5 " + stat.color} />
                <span className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">{stat.label}</span>
              </div>
              <div className={"text-3xl font-bold " + stat.color}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {summary.topSkills.length > 0 && (
        <Card className="border-[#E5E7EB] mb-6">
          <CardContent className="p-5">
            <h2 className="text-sm font-semibold text-[#1A1A1A] mb-4">Top Performing Skills</h2>
            <div className="space-y-3">
              {summary.topSkills.map((skill) => (
                <div key={skill.path} className="flex items-center justify-between">
                  <span className="text-sm text-[#6B7280] font-mono">{skill.path}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-[#F0F2F5] rounded-full">
                      <div className="h-2 bg-[#2E86AB] rounded-full" style={{ width: (skill.score * 10) + "%" }} />
                    </div>
                    <span className="text-xs font-semibold text-[#1A1A1A] w-8">{skill.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {summary.byBrand.length > 0 && (
        <Card className="border-[#E5E7EB]">
          <CardContent className="p-5">
            <h2 className="text-sm font-semibold text-[#1A1A1A] mb-4">Performance by Brand</h2>
            <div className="space-y-3">
              {summary.byBrand.map((brand) => (
                <div key={brand.name} className="flex items-center justify-between p-3 rounded-lg bg-[#F8F9FA]">
                  <span className="text-sm font-medium text-[#1A1A1A]">{brand.name}</span>
                  <div className="flex items-center gap-4 text-xs text-[#6B7280]">
                    <span>{brand.deliverables} deliverables</span>
                    <span>{brand.approvalRate}% approval</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
