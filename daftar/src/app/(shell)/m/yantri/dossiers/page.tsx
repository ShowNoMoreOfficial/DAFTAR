"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Search, Loader2, ChevronRight, Filter } from "lucide-react";

interface Dossier {
  id: string;
  topic: string;
  status: string;
  createdAt: string;
  brand: { id: string; name: string } | null;
  narrativeTreeId: string | null;
  hasStrategy: boolean;
  hasDeliverable: boolean;
  deliverableStatus: string | null;
}

export default function DossiersPage() {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams();
        if (filterBrand) params.set("brandId", filterBrand);
        if (filterStatus) params.set("status", filterStatus);
        const res = await fetch(`/api/yantri/dossiers?${params}`);
        if (res.ok) {
          const data = await res.json();
          setDossiers(Array.isArray(data) ? data : data.dossiers || []);
        }
      } catch {
        /* silent */
      }
      setLoading(false);
    }
    load();
  }, [filterBrand, filterStatus]);

  const filtered = dossiers.filter((d) =>
    !search || d.topic.toLowerCase().includes(search.toLowerCase())
  );

  function statusLabel(d: Dossier): { text: string; color: string } {
    if (d.deliverableStatus === "approved") return { text: "Approved", color: "bg-emerald-50 text-emerald-700" };
    if (d.hasDeliverable) return { text: "Has Content", color: "bg-purple-50 text-purple-700" };
    if (d.hasStrategy) return { text: "Strategy Done", color: "bg-blue-50 text-blue-700" };
    if (d.status === "complete") return { text: "Dossier Ready", color: "bg-amber-50 text-amber-700" };
    if (d.status === "failed") return { text: "Failed", color: "bg-red-50 text-red-700" };
    return { text: "Pending", color: "bg-gray-50 text-gray-600" };
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A]">Dossier Library</h1>
          <p className="text-sm text-[#6B7280] mt-1">{dossiers.length} fact dossiers</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
          <Input
            className="pl-9 border-[#E5E7EB]"
            placeholder="Search dossiers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="complete">Dossier Ready</option>
          <option value="has_strategy">Has Strategy</option>
          <option value="has_content">Has Content</option>
          <option value="approved">Approved</option>
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card className="border-[#E5E7EB]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-10 w-10 text-[#D1D5DB] mb-3" />
            <p className="text-sm text-[#6B7280]">No dossiers found.</p>
            <p className="text-xs text-[#9CA3AF] mt-1">Dossiers are created when signals enter the Yantri pipeline.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((d) => {
            const sl = statusLabel(d);
            return (
              <Link key={d.id} href={d.narrativeTreeId ? `/m/yantri/workspace/${d.narrativeTreeId}` : "#"}>
                <Card className="border-[#E5E7EB] hover:border-[#2E86AB]/30 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <FileText className="h-5 w-5 text-[#2E86AB] shrink-0" />
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-[#1A1A1A] truncate">{d.topic}</h3>
                        <div className="flex items-center gap-2 text-xs text-[#9CA3AF] mt-0.5">
                          {d.brand && <span>{d.brand.name}</span>}
                          <span>{new Date(d.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`text-[10px] ${sl.color}`}>{sl.text}</Badge>
                      <ChevronRight className="h-4 w-4 text-[#D1D5DB]" />
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
