"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GitBranch, FileText, Loader2, RefreshCw } from "lucide-react";

interface NarrativeTree {
  id: string;
  title?: string;
  rootTrend?: string;
  summary: string | null;
  status: string;
  branchCount?: number;
  signalCount?: number;
  lastUpdated?: string;
  updatedAt?: string;
}

function statusColor(status: string) {
  switch (status) {
    case "ACTIVE":
    case "DISCOVERING": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "DEVELOPING": return "bg-blue-50 text-blue-700 border-blue-200";
    case "ARCHIVED": return "bg-gray-100 text-gray-600 border-gray-200";
    default: return "bg-amber-50 text-amber-700 border-amber-200";
  }
}

export default function NarrativeTreesPage() {
  const [trees, setTrees] = useState<NarrativeTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  async function loadTrees() {
    setLoading(true);
    try {
      const url = filter === "ALL"
        ? "/api/m/yantri/narrative-trees"
        : "/api/m/yantri/narrative-trees?status=" + filter;
      const res = await fetch(url);
      if (res.ok) setTrees(await res.json());
    } catch { /* silent */ }
    setLoading(false);
  }

  useEffect(() => { loadTrees(); }, [filter]);

  const statuses = ["ALL", "DISCOVERING", "DEVELOPING", "ARCHIVED"];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A]">Narrative Trees</h1>
          <p className="text-sm text-[#6B7280] mt-1">Signal clusters organized into narrative arcs</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadTrees} disabled={loading}>
          <RefreshCw className={"h-4 w-4 mr-2 " + (loading ? "animate-spin" : "")} />
          Refresh
        </Button>
      </div>

      <div className="flex gap-2 mb-6">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={"px-3 py-1.5 text-xs font-medium rounded-full border transition-colors " + (
              filter === s
                ? "bg-[#2E86AB] text-white border-[#2E86AB]"
                : "bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#2E86AB]"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[#6B7280]" />
        </div>
      ) : trees.length === 0 ? (
        <Card className="border-[#E5E7EB]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <GitBranch className="h-10 w-10 text-[#D1D5DB] mb-3" />
            <p className="text-sm text-[#6B7280]">No narrative trees found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trees.map((tree) => (
            <Card key={tree.id} className="border-[#E5E7EB] hover:border-[#2E86AB]/30 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-[#1A1A1A]">{tree.rootTrend || tree.title}</h3>
                  <Badge className={"shrink-0 text-[10px] font-semibold border " + statusColor(tree.status)}>
                    {tree.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1 text-xs text-[#6B7280]">
                    <GitBranch className="h-3.5 w-3.5" />
                    <span>{tree.branchCount ?? 0} branches</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#6B7280]">
                    <FileText className="h-3.5 w-3.5" />
                    <span>{tree.signalCount ?? 0} signals</span>
                  </div>
                </div>
                {tree.summary && (
                  <p className="text-xs text-[#6B7280] line-clamp-3 mb-3">{tree.summary}</p>
                )}
                <div className="text-[10px] text-[#9CA3AF]">
                  Updated {new Date(tree.updatedAt || tree.lastUpdated || "").toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
