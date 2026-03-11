"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GitBranch, FileText, TrendingUp, Clock, ArrowRight, Loader2,
  Inbox, Factory, CheckCircle2, AlertTriangle,
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
}

interface Stats {
  trees: { total: number; incoming: number; inProduction: number; completed: number };
  deliverables: number;
  brands: number;
  recentActivity: {
    id: string; action: string; title: string; urgency: string;
    createdBy: string; deliverableCount: number; createdAt: string;
  }[];
}

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  INCOMING: { label: "Incoming", color: "bg-blue-50 text-blue-700 border-blue-200" },
  EVALUATING: { label: "Evaluating", color: "bg-amber-50 text-amber-700 border-amber-200" },
  APPROVED: { label: "Approved", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  IN_PRODUCTION: { label: "In Production", color: "bg-purple-50 text-purple-700 border-purple-200" },
  COMPLETED: { label: "Completed", color: "bg-gray-50 text-gray-600 border-gray-200" },
  SKIPPED: { label: "Skipped", color: "bg-gray-50 text-gray-500 border-gray-200" },
};

const URG_CFG: Record<string, { label: string; color: string }> = {
  breaking: { label: "Breaking", color: "bg-red-500 text-white" },
  high: { label: "High", color: "bg-amber-500 text-white" },
  normal: { label: "Normal", color: "bg-gray-100 text-gray-600" },
};

function dotColor(action: string) {
  if (action === "signal_received") return "bg-blue-500";
  if (action === "in_production") return "bg-purple-500";
  if (action === "completed") return "bg-emerald-500";
  return "bg-amber-500";
}

export default function YantriDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [trees, setTrees] = useState<NarrativeTree[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [sr, tr] = await Promise.all([
          fetch("/api/yantri/stats"), fetch("/api/yantri/narratives?limit=6"),
        ]);
        if (sr.ok) setStats(await sr.json());
        if (tr.ok) setTrees(await tr.json());
      } catch { /* ignore */ } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-[#6B7280]" />
      <span className="ml-2 text-sm text-[#6B7280]">Loading Yantri...</span>
    </div>
  );

  const ts = stats?.trees || { total: 0, incoming: 0, inProduction: 0, completed: 0 };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Yantri Dashboard</h1>
          <p className="text-sm text-[#6B7280] mt-1">Signal &rarr; Narrative &rarr; Deliverable pipeline</p>
        </div>
        <Link href="/m/khabri/signals">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <TrendingUp className="h-3.5 w-3.5" /> Browse Signals
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Inbox, label: "Incoming", val: ts.incoming, color: "text-blue-600", desc: "Signals awaiting review" },
          { icon: Factory, label: "In Production", val: ts.inProduction, color: "text-purple-600", desc: "Deliverables being created" },
          { icon: CheckCircle2, label: "Completed", val: ts.completed, color: "text-emerald-600", desc: "Published or done" },
          { icon: FileText, label: "Deliverables", val: stats?.deliverables || 0, color: "text-[#2E86AB]", desc: "Total brand x platform items" },
        ].map((s) => (
          <Card key={s.label} className="border-[#E5E7EB]">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <s.icon className={"h-5 w-5 " + s.color} />
                <span className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">{s.label}</span>
              </div>
              <div className={"text-3xl font-bold " + s.color}>{s.val}</div>
              <p className="text-xs text-[#9CA3AF] mt-1">{s.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-[#2E86AB]" />
            <h2 className="text-lg font-semibold text-[#1A1A1A]">Narrative Pipeline</h2>
          </div>
          <Link href="/m/yantri/narrative-trees" className="flex items-center gap-1 text-xs font-medium text-[#2E86AB]">
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {trees.length === 0 ? (
          <Card className="border-[#E5E7EB]">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <GitBranch className="h-10 w-10 text-[#D1D5DB] mb-3" />
              <p className="text-sm text-[#6B7280]">No narratives yet.</p>
              <p className="text-xs text-[#9CA3AF] mt-1">Send signals from Khabri to start building narratives.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trees.map((tree) => {
              const sc = STATUS_CFG[tree.status] || STATUS_CFG.INCOMING;
              const uc = URG_CFG[tree.urgency] || URG_CFG.normal;
              return (
                <Link key={tree.id} href={"/m/yantri/narrative-trees/" + tree.id}>
                  <Card className="border-[#E5E7EB] hover:border-[#2E86AB]/30 transition-colors cursor-pointer h-full">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-sm font-semibold text-[#1A1A1A] line-clamp-2">{tree.title}</h3>
                        <div className="flex gap-1 shrink-0">
                          {tree.urgency !== "normal" && (
                            <Badge className={"text-[9px] font-semibold " + uc.color}>
                              {tree.urgency === "breaking" && <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />}
                              {uc.label}
                            </Badge>
                          )}
                          <Badge className={"text-[10px] font-semibold border " + sc.color}>{sc.label}</Badge>
                        </div>
                      </div>
                      {tree.summary && <p className="text-xs text-[#6B7280] line-clamp-2 mb-3">{tree.summary}</p>}
                      <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
                        <span>{tree._count.narratives} deliverable{tree._count.narratives !== 1 ? "s" : ""}</span>
                        <span>{new Date(tree.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Recent Activity</h2>
        <Card className="border-[#E5E7EB]">
          <CardContent className="p-5">
            {(!stats?.recentActivity || stats.recentActivity.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-10 w-10 text-[#D1D5DB] mb-3" />
                <p className="text-sm text-[#6B7280]">No activity yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentActivity.map((item) => (
                  <Link key={item.id} href={"/m/yantri/narrative-trees/" + item.id}>
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#F8F9FA] transition-colors cursor-pointer">
                      <div className={"mt-1.5 w-2 h-2 rounded-full shrink-0 " + dotColor(item.action)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold uppercase text-[#6B7280]">{item.action.replace("_", " ")}</span>
                          <span className="text-[10px] text-[#9CA3AF]">
                            {new Date(item.createdAt).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-[#1A1A1A] mt-0.5 line-clamp-1">{item.title}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
