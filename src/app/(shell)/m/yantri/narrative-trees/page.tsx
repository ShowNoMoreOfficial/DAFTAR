"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GitBranch, BookOpen, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface NarrativeTree {
  id: string;
  rootTrend: string;
  summary: string | null;
  status: string;
  updatedAt: string;
  _count: { nodes: number };
  dossier: { id: string } | null;
  nodes: { id: string; signalTitle: string; identifiedAt: string }[];
}

function statusColor(status: string) {
  switch (status) {
    case "ACTIVE": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "MERGED": return "bg-blue-50 text-blue-700 border-blue-200";
    case "ARCHIVED": return "bg-gray-100 text-gray-600 border-gray-200";
    default: return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

export default function NarrativeTreesPage() {
  const [trees, setTrees] = useState<NarrativeTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const url = filter === "ALL" ? "/api/m/yantri/narrative-trees" : `/api/m/yantri/narrative-trees?status=${filter}`;
      const res = await fetch(url);
      if (res.ok) setTrees(await res.json());
      setLoading(false);
    }
    load();
  }, [filter]);

  const filtered = trees.filter((t) =>
    search ? t.rootTrend.toLowerCase().includes(search.toLowerCase()) : true
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#6B7280]" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Narrative Trees</h1>
          <p className="text-sm text-[#6B7280] mt-1">Semantic clusters of signals and their research dossiers</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <Input
              placeholder="Search trees..."
              className="pl-9 w-60"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        {["ALL", "ACTIVE", "MERGED", "ARCHIVED"].map((s) => (
          <Button
            key={s}
            size="sm"
            variant={filter === s ? "default" : "outline"}
            onClick={() => { setFilter(s); setLoading(true); }}
            className="text-xs"
          >
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="border-[#E5E7EB]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <GitBranch className="h-10 w-10 text-[#D1D5DB] mb-3" />
            <p className="text-sm text-[#6B7280]">No narrative trees found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tree) => (
            <Card key={tree.id} className="border-[#E5E7EB] hover:border-[#2E86AB]/30 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-[#1A1A1A] line-clamp-2">{tree.rootTrend}</h3>
                  <Badge className={`shrink-0 text-[10px] font-semibold border ${statusColor(tree.status)}`}>
                    {tree.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                    <GitBranch className="h-3.5 w-3.5" />
                    <span className="font-medium">{tree._count.nodes} node{tree._count.nodes !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <BookOpen className="h-3.5 w-3.5" />
                    {tree.dossier ? (
                      <span className="text-emerald-600 font-medium">Dossier ready</span>
                    ) : (
                      <span className="text-[#9CA3AF]">No dossier</span>
                    )}
                  </div>
                </div>

                {tree.summary && (
                  <p className="text-xs text-[#6B7280] line-clamp-3 mb-3 leading-relaxed">{tree.summary}</p>
                )}

                {tree.nodes && tree.nodes.length > 0 && (
                  <div className="border-t border-[#E5E7EB] pt-3 mt-3 space-y-1.5">
                    <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wide">Recent Signals</p>
                    {tree.nodes.map((node) => (
                      <p key={node.id} className="text-xs text-[#6B7280] line-clamp-1">
                        • {node.signalTitle}
                      </p>
                    ))}
                  </div>
                )}

                <div className="text-[10px] text-[#9CA3AF] mt-3">
                  Updated {new Date(tree.updatedAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
