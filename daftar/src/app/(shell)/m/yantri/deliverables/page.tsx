"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getContentTypeIcon, getContentTypeLabel, getPlatformLabel } from "@/components/yantri/content-type-icons";
import { Loader2, ChevronRight, Inbox } from "lucide-react";

interface DeliverableListItem {
  id: string;
  status: string;
  contentType: string;
  platform: string;
  brand: { id: string; name: string };
  title: string;
  previewSnippet: string;
  createdAt: string;
  narrativeTreeId: string | null;
}

const STATUS_TABS = [
  { key: "pending_review", label: "Pending Review", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { key: "approved", label: "Approved", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { key: "revision_requested", label: "Revision Requested", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { key: "rejected", label: "Rejected", color: "bg-red-50 text-red-700 border-red-200" },
];

export default function DeliverablesPage() {
  const [deliverables, setDeliverables] = useState<DeliverableListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending_review");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/yantri/deliverables?status=${activeTab}`);
        if (res.ok) {
          const data = await res.json();
          setDeliverables(Array.isArray(data) ? data : data.deliverables || []);
        }
      } catch {
        /* silent */
      }
      setLoading(false);
    }
    load();
  }, [activeTab]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#1A1A1A]">Content Review Queue</h1>
        <p className="text-sm text-[#6B7280] mt-1">Review and approve generated content</p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 border-b border-[#E5E7EB] mb-6">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.key
                ? "border-[#2E86AB] text-[#2E86AB]"
                : "border-transparent text-[#6B7280] hover:text-[#1A1A1A] hover:border-[#E5E7EB]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : deliverables.length === 0 ? (
        <Card className="border-[#E5E7EB]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Inbox className="h-10 w-10 text-[#D1D5DB] mb-3" />
            <p className="text-sm text-[#6B7280]">No deliverables with status &ldquo;{activeTab.replace(/_/g, " ")}&rdquo;.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {deliverables.map((d) => {
            const Icon = getContentTypeIcon(d.contentType);
            const statusCfg = STATUS_TABS.find((t) => t.key === d.status) || STATUS_TABS[0];
            return (
              <Link key={d.id} href={d.narrativeTreeId ? `/m/yantri/workspace/${d.narrativeTreeId}` : `/m/yantri/deliverables`}>
                <Card className="border-[#E5E7EB] hover:border-[#2E86AB]/30 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-[#2E86AB]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-[#1A1A1A] truncate">{d.title || getContentTypeLabel(d.contentType)}</h3>
                      {d.previewSnippet && (
                        <p className="text-xs text-[#6B7280] truncate mt-0.5">{d.previewSnippet}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-[#9CA3AF] mt-1">
                        <span>{d.brand?.name}</span>
                        <span>&middot;</span>
                        <span>{getPlatformLabel(d.platform)}</span>
                        <span>&middot;</span>
                        <span>{new Date(d.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`text-[10px] border ${statusCfg.color}`}>
                        {statusCfg.label}
                      </Badge>
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
