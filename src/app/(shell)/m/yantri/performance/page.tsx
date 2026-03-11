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
        <Loader2 className="h-6 w-6 animate-spin text-[var(--text-secondary)]" />
      </div>
    );
  }

  const s = data || { total: 0, incoming: 0, inProduction: 0, completed: 0, skipped: 0, totalDeliverables: 0, approvalRate: 0 };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Pipeline Performance</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Yantri pipeline effectiveness metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Narratives", value: String(s.total), icon: TrendingUp, color: "text-[var(--accent-primary)]" },
          { label: "Approval Rate", value: s.approvalRate + "%", icon: Target, color: "text-emerald-600" },
          { label: "Total Deliverables", value: String(s.totalDeliverables), icon: Clock, color: "text-amber-600" },
          { label: "Completed", value: String(s.completed), icon: Zap, color: "text-purple-600" },
        ].map((stat) => (
          <Card key={stat.label} className="border-[var(--border-subtle)]">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <stat.icon className={"h-5 w-5 " + stat.color} />
                <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">{stat.label}</span>
              </div>
              <div className={"text-3xl font-bold " + stat.color}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-[var(--border-subtle)]">
        <CardContent className="p-5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Pipeline Breakdown</h2>
          <div className="space-y-3">
            {[
              { label: "Incoming (awaiting review)", count: s.incoming, color: "bg-[rgba(59,130,246,0.1)]0" },
              { label: "In Production", count: s.inProduction, color: "bg-[rgba(168,85,247,0.1)]0" },
              { label: "Completed", count: s.completed, color: "bg-[rgba(16,185,129,0.1)]0" },
              { label: "Skipped", count: s.skipped, color: "bg-gray-400" },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <div className={"w-3 h-3 rounded-full shrink-0 " + row.color} />
                <span className="text-sm text-[var(--text-secondary)] flex-1">{row.label}</span>
                <span className="text-sm font-bold text-[var(--text-primary)]">{row.count}</span>
                {s.total > 0 && (
                  <div className="w-20 h-2 bg-[var(--bg-elevated)] rounded-full">
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
