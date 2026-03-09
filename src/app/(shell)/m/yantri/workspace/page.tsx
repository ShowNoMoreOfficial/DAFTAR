"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Eye, Package, FileText } from "lucide-react";

interface Deliverable {
  id: string;
  platform: string;
  pipelineType: string;
  status: string;
  copyMarkdown: string;
  createdAt: string;
  brand: { id: string; name: string } | null;
  tree: { id: string; rootTrend: string } | null;
  assets: { id: string; type: string; url: string | null }[];
}

const STATUS_COLORS: Record<string, string> = {
  PLANNED: "bg-gray-100 text-gray-600 border-gray-200",
  RESEARCHING: "bg-blue-50 text-blue-700 border-blue-200",
  SCRIPTING: "bg-indigo-50 text-indigo-700 border-indigo-200",
  GENERATING_ASSETS: "bg-purple-50 text-purple-700 border-purple-200",
  STORYBOARDING: "bg-amber-50 text-amber-700 border-amber-200",
  REVIEW: "bg-yellow-50 text-yellow-700 border-yellow-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  RELAYED: "bg-cyan-50 text-cyan-700 border-cyan-200",
  PUBLISHED: "bg-green-50 text-green-700 border-green-200",
  KILLED: "bg-red-50 text-red-700 border-red-200",
};

const PLATFORM_LABELS: Record<string, string> = {
  YOUTUBE: "YouTube",
  X_THREAD: "X Thread",
  X_SINGLE: "X Post",
  BLOG: "Blog",
  LINKEDIN: "LinkedIn",
  META_REEL: "Meta Reel",
  META_CAROUSEL: "Meta Carousel",
  META_POST: "Meta Post",
};

export default function WorkspacePage() {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const url = filter === "ALL"
        ? "/api/m/yantri/deliverables"
        : `/api/m/yantri/deliverables?status=${filter}`;
      const res = await fetch(url);
      if (res.ok) setDeliverables(await res.json());
      setLoading(false);
    }
    load();
  }, [filter]);

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/m/yantri/deliverables/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setDeliverables((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status } : d))
      );
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#6B7280]" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Workspace</h1>
        <p className="text-sm text-[#6B7280] mt-1">Review and approve deliverables from the pipeline</p>
      </div>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {["ALL", "REVIEW", "APPROVED", "RESEARCHING", "SCRIPTING", "PUBLISHED", "KILLED"].map((s) => (
          <Button
            key={s}
            size="sm"
            variant={filter === s ? "default" : "outline"}
            onClick={() => { setFilter(s); setLoading(true); }}
            className="text-xs"
          >
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase().replace("_", " ")}
          </Button>
        ))}
      </div>

      {deliverables.length === 0 ? (
        <Card className="border-[#E5E7EB]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-10 w-10 text-[#D1D5DB] mb-3" />
            <p className="text-sm text-[#6B7280]">No deliverables found.</p>
            <p className="text-xs text-[#9CA3AF] mt-1">Deliverables will appear as the pipeline processes narratives.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {deliverables.map((d) => (
            <Card key={d.id} className="border-[#E5E7EB]">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`text-[10px] font-semibold border ${STATUS_COLORS[d.status] || STATUS_COLORS.PLANNED}`}>
                        {d.status}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {PLATFORM_LABELS[d.platform] || d.platform}
                      </Badge>
                      <span className="text-[10px] text-[#9CA3AF]">{d.pipelineType}</span>
                    </div>

                    {d.brand && (
                      <p className="text-sm font-semibold text-[#1A1A1A]">{d.brand.name}</p>
                    )}
                    {d.tree && (
                      <p className="text-xs text-[#6B7280] mt-0.5 line-clamp-1">{d.tree.rootTrend}</p>
                    )}

                    {d.copyMarkdown && (
                      <p className="text-xs text-[#6B7280] mt-2 line-clamp-2 leading-relaxed">
                        {d.copyMarkdown.slice(0, 200)}{d.copyMarkdown.length > 200 ? "..." : ""}
                      </p>
                    )}

                    {d.assets.length > 0 && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-[#9CA3AF]">
                        <FileText className="h-3 w-3" />
                        {d.assets.length} asset{d.assets.length !== 1 ? "s" : ""}
                      </div>
                    )}

                    {expandedId === d.id && d.copyMarkdown && (
                      <div className="mt-3 p-3 bg-[#F8F9FA] rounded-lg border border-[#E5E7EB]">
                        <p className="text-xs text-[#1A1A1A] whitespace-pre-wrap leading-relaxed">{d.copyMarkdown}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {d.status === "REVIEW" && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => updateStatus(d.id, "APPROVED")}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => updateStatus(d.id, "KILLED")}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-[10px] text-[#9CA3AF] mt-2">
                  Created {new Date(d.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
