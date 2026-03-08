"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  Eye,
  TrendingUp,
  Trash2,
  Loader2,
  Search,
  Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CreatePostDialog } from "@/components/relay/create-post-dialog";

// ─── Types ───────────────────────────────────────────────

interface ContentPost {
  id: string;
  title: string;
  content: string | null;
  platform: string;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  publishedUrl: string | null;
  mediaUrls: string[] | null;
  metadata: Record<string, unknown> | null;
  brand: { id: string; name: string } | null;
  analytics: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
    engagementRate: number;
  } | null;
  createdAt: string;
}

// ─── Constants ──────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-700", icon: <FileText className="h-3 w-3" /> },
  SCHEDULED: { label: "Scheduled", color: "bg-blue-100 text-blue-700", icon: <Clock className="h-3 w-3" /> },
  PUBLISHING: { label: "Publishing", color: "bg-yellow-100 text-yellow-700", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  PUBLISHED: { label: "Published", color: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 className="h-3 w-3" /> },
  FAILED: { label: "Failed", color: "bg-red-100 text-red-700", icon: <AlertCircle className="h-3 w-3" /> },
  CANCELLED: { label: "Cancelled", color: "bg-gray-100 text-gray-500", icon: <Ban className="h-3 w-3" /> },
};

const PLATFORM_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  youtube: { label: "YouTube", color: "#FF0000", icon: "YT" },
  x: { label: "X", color: "#000000", icon: "X" },
  instagram: { label: "Instagram", color: "#E4405F", icon: "IG" },
  linkedin: { label: "LinkedIn", color: "#0A66C2", icon: "LI" },
  facebook: { label: "Facebook", color: "#1877F2", icon: "FB" },
};

const PLATFORMS = [
  { value: "youtube", label: "YouTube" },
  { value: "x", label: "X" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "facebook", label: "Facebook" },
];

const STATUS_FILTERS = ["ALL", "DRAFT", "SCHEDULED", "PUBLISHING", "PUBLISHED", "FAILED", "CANCELLED"];

// ─── Component ──────────────────────────────────────────

export default function PostsListPage() {
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [createOpen, setCreateOpen] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [platformFilter, setPlatformFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (platformFilter) params.set("platform", platformFilter);
    if (brandFilter) params.set("brandId", brandFilter);
    if (searchQuery) params.set("search", searchQuery);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    try {
      const res = await fetch(`/api/relay/posts?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.data || data || []);
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, platformFilter, brandFilter, searchQuery, dateFrom, dateTo]);

  useEffect(() => {
    fetchPosts();
    fetch("/api/brands")
      .then((r) => r.json())
      .then((d) => setBrands(Array.isArray(d) ? d : d.data || []))
      .catch(() => {});
  }, [fetchPosts]);

  const handlePublish = async (id: string) => {
    const res = await fetch(`/api/relay/posts/${id}/publish`, { method: "POST" });
    if (res.ok) fetchPosts();
  };

  const handleCancel = async (id: string) => {
    const res = await fetch(`/api/relay/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    if (res.ok) fetchPosts();
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/relay/posts/${id}`, { method: "DELETE" });
    if (res.ok) fetchPosts();
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Content Posts</h2>
          <p className="text-sm text-[#9CA3AF]">
            Manage and distribute content across platforms
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Create Post
        </Button>
      </div>

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
          <Input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs text-[#6B7280]"
        >
          <option value="">All Platforms</option>
          {PLATFORMS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs text-[#6B7280]"
        >
          <option value="ALL">All Statuses</option>
          {STATUS_FILTERS.filter((s) => s !== "ALL").map((s) => (
            <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>
          ))}
        </select>
        <select
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs text-[#6B7280]"
        >
          <option value="">All Brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-8 text-xs"
            placeholder="From"
          />
          <span className="text-xs text-[#9CA3AF]">to</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-8 text-xs"
            placeholder="To"
          />
        </div>
      </div>

      {/* Posts table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#2E86AB]" />
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-8 text-center">
          <Send className="mx-auto h-12 w-12 text-[#D1D5DB]" />
          <h3 className="mt-4 text-sm font-medium text-[#1A1A1A]">No Posts Found</h3>
          <p className="mt-2 text-sm text-[#9CA3AF]">
            Create your first content post to start distributing.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#FAFAFA]">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-[#6B7280]">Title</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-[#6B7280]">Platform</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-[#6B7280]">Brand</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-[#6B7280]">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-[#6B7280]">Date</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-[#6B7280]">Analytics</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-[#6B7280]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F2F5]">
              {posts.map((post) => {
                const statusCfg = STATUS_CONFIG[post.status] || STATUS_CONFIG.DRAFT;
                const platformCfg = PLATFORM_CONFIG[post.platform];
                return (
                  <tr key={post.id} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-[#1A1A1A]">{post.title}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex h-6 w-6 items-center justify-center rounded text-[9px] font-bold text-white"
                          style={{ backgroundColor: platformCfg?.color || "#6B7280" }}
                        >
                          {platformCfg?.icon || "?"}
                        </div>
                        <span className="text-xs text-[#6B7280]">{platformCfg?.label || post.platform}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {post.brand && (
                        <Badge variant="secondary" className="text-[10px]">
                          {post.brand.name}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cn("text-[10px] gap-1", statusCfg.color)}>
                        {statusCfg.icon}
                        {statusCfg.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#6B7280]">
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })
                        : post.scheduledAt
                        ? new Date(post.scheduledAt).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                          })
                        : new Date(post.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short",
                          })}
                    </td>
                    <td className="px-4 py-3">
                      {post.analytics ? (
                        <div className="flex items-center gap-3 text-xs text-[#6B7280]">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {formatNumber(post.analytics.views)}
                          </span>
                          <span className="flex items-center gap-1 text-emerald-600">
                            <TrendingUp className="h-3 w-3" />
                            {post.analytics.engagementRate}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-[#D1D5DB]">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {(post.status === "DRAFT" || post.status === "SCHEDULED") && (
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => handlePublish(post.id)}
                          >
                            <Send className="mr-1 h-3 w-3" />
                            Publish
                          </Button>
                        )}
                        {(post.status === "SCHEDULED" || post.status === "DRAFT") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => handleCancel(post.id)}
                          >
                            Cancel
                          </Button>
                        )}
                        {(post.status === "DRAFT" || post.status === "SCHEDULED") && (
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="rounded p-1.5 text-[#9CA3AF] hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Post Dialog */}
      <CreatePostDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        brands={brands}
        onCreated={fetchPosts}
      />
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}
