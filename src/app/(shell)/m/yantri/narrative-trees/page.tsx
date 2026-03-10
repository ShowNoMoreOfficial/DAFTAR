"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GitBranch, Plus, Loader2, Search, Signal, Clock } from "lucide-react";

interface NarrativeTree {
  id: string;
  title: string;
  status: string;
  branchCount: number;
  signalCount: number;
  lastUpdated: string;
  summary: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DISCOVERING: { label: "Discovering", color: "bg-amber-50 text-amber-700 border-amber-200" },
  DEVELOPING: { label: "Developing", color: "bg-blue-50 text-blue-700 border-blue-200" },
  ARCHIVED: { label: "Archived", color: "bg-gray-100 text-gray-500 border-gray-200" },
};

const FILTERS = ["ALL", "DISCOVERING", "DEVELOPING", "ARCHIVED"] as const;

export default function NarrativeTreesPage() {
  const [trees, setTrees] = useState<NarrativeTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const url =
        filter === "ALL"
          ? "/api/m/yantri/narrative-trees"
          : `/api/m/yantri/narrative-trees?status=${filter}`;
      const res = await fetch(url);
      if (res.ok) setTrees(await res.json());
      setLoading(false);
    }
    load();
  }, [filter]);

  const filtered = trees.filter((t) =>
    search
      ? t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.summary.toLowerCase().includes(search.toLowerCase())
      : true
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Narrative Trees</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Semantic story clusters tracked across signals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <Input
              placeholder="Search narratives..."
              className="pl-9 w-60"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button size="sm" className="bg-[#2E86AB] hover:bg-[#256d8a]">
            <Plus className="h-4 w-4 mr-1.5" />
            New Narrative
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        {FILTERS.map((s) => (
          <Button
            key={s}
            size="sm"
            variant={filter === s ? "default" : "outline"}
            onClick={() => setFilter(s)}
            className={filter === s ? "bg-[#2E86AB] hover:bg-[#256d8a] text-xs" : "text-xs"}
          >
            {s === "ALL" ? "All" : STATUS_CONFIG[s]?.label || s}
          </Button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[#6B7280]" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-[#E5E7EB]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <GitBranch className="h-10 w-10 text-[#D1D5DB] mb-3" />
            <p className="text-sm text-[#6B7280]">No narrative trees found.</p>
            <p className="text-xs text-[#9CA3AF] mt-1">
              Create a new narrative or adjust your filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tree) => {
            const cfg = STATUS_CONFIG[tree.status] || STATUS_CONFIG.ARCHIVED;
            return (
              <Card
                key={tree.id}
                className="border-[#E5E7EB] hover:border-[#2E86AB]/30 transition-colors cursor-pointer group"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="text-sm font-semibold text-[#1A1A1A] line-clamp-2 group-hover:text-[#2E86AB] transition-colors">
                      {tree.title}
                    </h3>
                    <Badge
                      className={`shrink-0 text-[10px] font-semibold border ${cfg.color}`}
                    >
                      {cfg.label}
                    </Badge>
                  </div>

                  <p className="text-xs text-[#6B7280] line-clamp-3 mb-4 leading-relaxed">
                    {tree.summary}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-[#6B7280]">
                    <div className="flex items-center gap-1.5">
                      <GitBranch className="h-3.5 w-3.5" />
                      <span className="font-medium">
                        {tree.branchCount} branch{tree.branchCount !== 1 ? "es" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Signal className="h-3.5 w-3.5" />
                      <span className="font-medium">
                        {tree.signalCount} signal{tree.signalCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-[#9CA3AF] mt-3 pt-3 border-t border-[#E5E7EB]">
                    <Clock className="h-3 w-3" />
                    Updated{" "}
                    {new Date(tree.lastUpdated).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
