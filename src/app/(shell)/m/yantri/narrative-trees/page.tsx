"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GitBranch, Loader2, AlertTriangle, Inbox, Factory, CheckCircle2, Ban, ArrowRight,
} from "lucide-react";

interface NarrativeTree {
  id: string;
  title: string;
  summary: string | null;
  status: string;
  urgency: string;
  createdAt: string;
  createdBy: { name: string };
  _count: { narratives: number };
  narratives: { brandId: string; platform: string; status: string }[];
}

const STATUSES = ["ALL", "INCOMING", "IN_PRODUCTION", "APPROVED", "COMPLETED", "SKIPPED"] as const;

const STATUS_CFG: Record<string, { label: string; color: string; icon: typeof Inbox }> = {
  INCOMING: { label: "Incoming", color: "bg-[rgba(59,130,246,0.1)] text-blue-700 border-blue-200", icon: Inbox },
  EVALUATING: { label: "Evaluating", color: "bg-[rgba(245,158,11,0.1)] text-amber-700 border-amber-200", icon: Inbox },
  APPROVED: { label: "Approved", color: "bg-[rgba(16,185,129,0.1)] text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  IN_PRODUCTION: { label: "In Production", color: "bg-[rgba(168,85,247,0.1)] text-purple-700 border-purple-200", icon: Factory },
  COMPLETED: { label: "Completed", color: "bg-[var(--bg-elevated)] text-gray-600 border-gray-200", icon: CheckCircle2 },
  SKIPPED: { label: "Skipped", color: "bg-[var(--bg-elevated)] text-gray-500 border-gray-200", icon: Ban },
};

export default function NarrativeTreesPage() {
  const [trees, setTrees] = useState<NarrativeTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  const fetchTrees = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter === "ALL" ? "/api/yantri/narratives" : "/api/yantri/narratives?status=" + filter;
      const res = await fetch(url);
      if (res.ok) setTrees(await res.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchTrees(); }, [fetchTrees]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Narrative Trees</h1>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUSES.map((s) => (
          <Button
            key={s}
            variant={filter === s ? "default" : "outline"}
            size="sm"
            className={filter === s ? "bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white" : ""}
            onClick={() => setFilter(s)}
          >
            {s === "ALL" ? "All" : (STATUS_CFG[s]?.label || s)}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-primary)]" />
        </div>
      ) : trees.length === 0 ? (
        <Card className="border-[var(--border-subtle)]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <GitBranch className="h-10 w-10 text-[var(--text-muted)] mb-3" />
            <p className="text-sm text-[var(--text-secondary)]">No narratives found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {trees.map((tree) => {
            const sc = STATUS_CFG[tree.status] || STATUS_CFG.INCOMING;
            const platforms = [...new Set(tree.narratives.map((n) => n.platform))];
            return (
              <Link key={tree.id} href={"/m/yantri/narrative-trees/" + tree.id}>
                <Card className="border-[var(--border-subtle)] hover:border-[#2E86AB]/30 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{tree.title}</h3>
                          {tree.urgency === "breaking" && (
                            <Badge className="bg-[rgba(239,68,68,0.1)]0 text-white text-[9px]">
                              <AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> Breaking
                            </Badge>
                          )}
                          {tree.urgency === "high" && (
                            <Badge className="bg-[rgba(245,158,11,0.1)]0 text-white text-[9px]">High</Badge>
                          )}
                        </div>
                        {tree.summary && <p className="text-xs text-[var(--text-secondary)] line-clamp-1 mb-2">{tree.summary}</p>}
                        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                          <span>{tree._count.narratives} deliverable{tree._count.narratives !== 1 ? "s" : ""}</span>
                          {platforms.length > 0 && (
                            <span className="flex gap-1">
                              {platforms.map((p) => (
                                <Badge key={p} variant="outline" className="text-[9px] py-0">{p}</Badge>
                              ))}
                            </span>
                          )}
                          <span>by {tree.createdBy.name}</span>
                          <span>{new Date(tree.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={"text-[10px] font-semibold border " + sc.color}>{sc.label}</Badge>
                        <ArrowRight className="h-4 w-4 text-[var(--text-muted)]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
