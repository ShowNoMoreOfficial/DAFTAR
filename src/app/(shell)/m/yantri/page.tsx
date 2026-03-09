"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Clock,
  CheckCircle,
  FileText,
  GitBranch,
  BookOpen,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface NarrativeTree {
  id: string;
  rootTrend: string;
  summary: string | null;
  status: string;
  updatedAt: string;
  _count: { nodes: number };
  dossier: { id: string } | null;
}

interface EditorialLog {
  id: string;
  action: string;
  trendHeadline: string | null;
  reasoning: string | null;
  createdAt: string;
}

function treeStatusColor(status: string) {
  switch (status) {
    case "ACTIVE": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "MERGED": return "bg-blue-50 text-blue-700 border-blue-200";
    case "ARCHIVED": return "bg-gray-100 text-gray-600 border-gray-200";
    default: return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

function logDotColor(action: string) {
  switch (action) {
    case "selected": return "bg-emerald-500";
    case "skipped": return "bg-gray-400";
    case "published": return "bg-blue-500";
    default: return "bg-amber-500";
  }
}

async function fetchYantri(path: string) {
  const res = await fetch(`/api/m/yantri/${path}`);
  if (!res.ok) return null;
  return res.json();
}

export default function YantriDashboard() {
  const [trees, setTrees] = useState<NarrativeTree[]>([]);
  const [logs, setLogs] = useState<EditorialLog[]>([]);
  const [stats, setStats] = useState({ trees: 0, deliverables: 0, brands: 0, contentPieces: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [treesData, logsData, deliverablesData, brandsData, contentData] = await Promise.all([
        fetchYantri("narrative-trees"),
        fetchYantri("history"),
        fetchYantri("deliverables"),
        fetchYantri("brands"),
        fetchYantri("content-pieces?limit=100"),
      ]);

      setTrees((treesData || []).slice(0, 6));
      setLogs((logsData || []).slice(0, 8));

      const dArr = deliverablesData || [];
      const bArr = brandsData || [];
      const cArr = contentData || [];

      setStats({
        trees: (treesData || []).length,
        deliverables: dArr.length,
        brands: bArr.length,
        contentPieces: cArr.length,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#6B7280]" />
        <span className="ml-2 text-sm text-[#6B7280]">Loading Yantri...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Yantri Dashboard</h1>
          <p className="text-sm text-[#6B7280] mt-1">Narrative Intelligence Pipeline overview</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          System Live
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Narrative Trees", value: stats.trees, icon: GitBranch, color: "text-[#2E86AB]" },
          { label: "Deliverables", value: stats.deliverables, icon: Clock, color: "text-amber-600" },
          { label: "Brands", value: stats.brands, icon: TrendingUp, color: "text-emerald-600" },
          { label: "Content Pieces", value: stats.contentPieces, icon: FileText, color: "text-blue-600" },
        ].map((stat) => (
          <Card key={stat.label} className="border-[#E5E7EB]">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <span className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">{stat.label}</span>
              </div>
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Narrative Trees */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-[#2E86AB]" />
            <h2 className="text-lg font-semibold text-[#1A1A1A]">Active Narrative Trees</h2>
          </div>
          {trees.length > 0 && (
            <Link href="/m/yantri/narrative-trees" className="flex items-center gap-1 text-xs font-medium text-[#2E86AB] hover:text-[#236b8a]">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {trees.length === 0 ? (
          <Card className="border-[#E5E7EB]">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <GitBranch className="h-10 w-10 text-[#D1D5DB] mb-3" />
              <p className="text-sm text-[#6B7280]">No narrative trees yet.</p>
              <p className="text-xs text-[#9CA3AF] mt-1">Trees will appear as signals are clustered into narratives.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trees.map((tree) => (
              <Card key={tree.id} className="border-[#E5E7EB] hover:border-[#2E86AB]/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-[#1A1A1A] line-clamp-2">{tree.rootTrend}</h3>
                    <Badge className={`shrink-0 text-[10px] font-semibold border ${treeStatusColor(tree.status)}`}>
                      {tree.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1 text-xs text-[#6B7280]">
                      <GitBranch className="h-3.5 w-3.5" />
                      <span>{tree._count.nodes} node{tree._count.nodes !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <BookOpen className="h-3.5 w-3.5" />
                      {tree.dossier ? (
                        <span className="text-emerald-600 font-medium">Dossier ready</span>
                      ) : (
                        <span className="text-[#9CA3AF]">No dossier</span>
                      )}
                    </div>
                  </div>
                  {tree.summary && (
                    <p className="text-xs text-[#6B7280] line-clamp-2 mb-2">{tree.summary}</p>
                  )}
                  <div className="text-[10px] text-[#9CA3AF]">
                    Updated {new Date(tree.updatedAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Recent Activity</h2>
        </div>
        <Card className="border-[#E5E7EB]">
          <CardContent className="p-5">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle className="h-10 w-10 text-[#D1D5DB] mb-3" />
                <p className="text-sm text-[#6B7280]">No recent activity.</p>
                <p className="text-xs text-[#9CA3AF] mt-1">Activity will appear as the pipeline processes signals.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#F8F9FA] transition-colors">
                    <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${logDotColor(log.action)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold uppercase text-[#6B7280]">{log.action}</span>
                        <span className="text-[10px] text-[#9CA3AF]">
                          {new Date(log.createdAt).toLocaleString([], { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })}
                        </span>
                      </div>
                      {log.trendHeadline && (
                        <p className="text-sm font-medium text-[#1A1A1A] mt-0.5 line-clamp-1">{log.trendHeadline}</p>
                      )}
                      {log.reasoning && (
                        <p className="text-xs text-[#6B7280] mt-1 line-clamp-2 italic">{log.reasoning}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
