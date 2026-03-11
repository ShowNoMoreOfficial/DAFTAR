"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, TrendingUp, Target, Clock, Zap } from "lucide-react";

interface PerformanceSummary {
  total: number;
  incoming: number;
  inProduction: number;
  completed: number;
  skipped: number;
  totalDeliverables: number;
  approvalRate: number;
}

export default function YantriPerformancePage() {
  const [data, setData] = useState<PerformanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/yantri/performance/summary");
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

  const s = data || { total: 0, incoming: 0, inProduction: 0, completed: 0, skipped: 0, totalDeliverables: 0, approvalRate: 0 };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#1A1A1A]">Pipeline Performance</h1>
        <p className="text-sm text-[#6B7280] mt-1">Yantri pipeline effectiveness metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Narratives", value: String(s.total), icon: TrendingUp, color: "text-[#2E86AB]" },
          { label: "Approval Rate", value: s.approvalRate + "%", icon: Target, color: "text-emerald-600" },
          { label: "Total Deliverables", value: String(s.totalDeliverables), icon: Clock, color: "text-amber-600" },
          { label: "Completed", value: String(s.completed), icon: Zap, color: "text-purple-600" },
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

      <Card className="border-[#E5E7EB]">
        <CardContent className="p-5">
          <h2 className="text-sm font-semibold text-[#1A1A1A] mb-4">Pipeline Breakdown</h2>
          <div className="space-y-3">
            {[
              { label: "Incoming (awaiting review)", count: s.incoming, color: "bg-blue-500" },
              { label: "In Production", count: s.inProduction, color: "bg-purple-500" },
              { label: "Completed", count: s.completed, color: "bg-emerald-500" },
              { label: "Skipped", count: s.skipped, color: "bg-gray-400" },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <div className={"w-3 h-3 rounded-full shrink-0 " + row.color} />
                <span className="text-sm text-[#6B7280] flex-1">{row.label}</span>
                <span className="text-sm font-bold text-[#1A1A1A]">{row.count}</span>
                {s.total > 0 && (
                  <div className="w-20 h-2 bg-[#F0F2F5] rounded-full">
                    <div className={"h-2 rounded-full " + row.color} style={{ width: Math.round((row.count / s.total) * 100) + "%" }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
