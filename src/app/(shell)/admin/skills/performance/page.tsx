"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface PerformanceItem {
  path: string;
  name: string;
  domain: string;
  totalExecutions: number;
  avgDuration: number;
  avgScore: number | null;
  successRate: number;
}

const DOMAIN_COLORS: Record<string, string> = {
  signals: "bg-orange-100 text-orange-700",
  narrative: "bg-purple-100 text-purple-700",
  production: "bg-blue-100 text-blue-700",
  platforms: "bg-green-100 text-green-700",
  distribution: "bg-cyan-100 text-cyan-700",
  analytics: "bg-pink-100 text-pink-700",
  brand: "bg-amber-100 text-amber-700",
  gi: "bg-indigo-100 text-indigo-700",
  workflows: "bg-teal-100 text-teal-700",
  system: "bg-gray-100 text-gray-700",
};

export default function SkillPerformancePage() {
  const [items, setItems] = useState<PerformanceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/skills/performance")
      .then((r) => r.json())
      .then((data) => {
        setItems(data.performance ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalExecs = items.reduce((a, b) => a + b.totalExecutions, 0);
  const avgSuccess =
    items.length > 0
      ? items.reduce((a, b) => a + b.successRate, 0) / items.length
      : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
          <p className="text-xs text-[#6B7280]">Total Skills</p>
          <p className="text-2xl font-bold text-[#1A1A1A]">{items.length}</p>
        </div>
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
          <p className="text-xs text-[#6B7280]">Total Executions</p>
          <p className="text-2xl font-bold text-[#1A1A1A]">{totalExecs}</p>
        </div>
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
          <p className="text-xs text-[#6B7280]">Avg Success Rate</p>
          <p className="text-2xl font-bold text-[#1A1A1A]">{(avgSuccess * 100).toFixed(1)}%</p>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white">
        <div className="border-b border-[#E5E7EB] p-4">
          <h2 className="text-sm font-semibold text-[#1A1A1A]">Skill Performance Leaderboard</h2>
        </div>

        {loading ? (
          <p className="p-4 text-sm text-[#6B7280]">Loading...</p>
        ) : items.length === 0 ? (
          <p className="p-4 text-sm text-[#9CA3AF]">No execution data yet. Execute skills to see performance metrics.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-left text-xs text-[#6B7280]">
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Skill</th>
                  <th className="px-4 py-3 font-medium">Domain</th>
                  <th className="px-4 py-3 font-medium text-right">Executions</th>
                  <th className="px-4 py-3 font-medium text-right">Avg Duration</th>
                  <th className="px-4 py-3 font-medium text-right">Avg Score</th>
                  <th className="px-4 py-3 font-medium text-right">Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.path} className="border-b border-[#F0F2F5] hover:bg-[#F8F9FA]">
                    <td className="px-4 py-3 text-[#9CA3AF]">{i + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#1A1A1A]">{item.name}</p>
                      <p className="text-xs text-[#9CA3AF]">{item.path}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={DOMAIN_COLORS[item.domain] ?? "bg-gray-100 text-gray-700"}>
                        {item.domain}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-[#1A1A1A]">{item.totalExecutions}</td>
                    <td className="px-4 py-3 text-right text-[#1A1A1A]">
                      {item.avgDuration > 0 ? `${Math.round(item.avgDuration)}ms` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.avgScore !== null ? (
                        <span className={item.avgScore >= 7 ? "text-green-600" : item.avgScore >= 4 ? "text-amber-600" : "text-red-600"}>
                          {item.avgScore.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-[#9CA3AF]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={item.successRate >= 0.9 ? "text-green-600" : item.successRate >= 0.7 ? "text-amber-600" : "text-red-600"}>
                        {(item.successRate * 100).toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
