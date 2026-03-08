"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  MoreHorizontal,
  Eye,
  Trash2,
  Loader2,
  Filter,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  metadata: Record<string, unknown> | null;
  brand: { id: string; name: string } | null;
  createdAt: string;
}

// ─── Constants ──────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-700", icon: <FileText className="h-3.5 w-3.5" /> },
  QUEUED: { label: "Queued", color: "bg-blue-100 text-blue-700", icon: <Clock className="h-3.5 w-3.5" /> },
  SCHEDULED: { label: "Scheduled", color: "bg-purple-100 text-purple-700", icon: <Clock className="h-3.5 w-3.5" /> },
  PUBLISHING: { label: "Publishing", color: "bg-yellow-100 text-yellow-700", icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> },
  PUBLISHED: { label: "Published", color: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  FAILED: { label: "Failed", color: "bg-red-100 text-red-700", icon: <AlertCircle className="h-3.5 w-3.5" /> },
  CANCELLED: { label: "Cancelled", color: "bg-gray-100 text-gray-500", icon: <X className="h-3.5 w-3.5" /> },
};

const PLATFORMS = [
  { value: "youtube", label: "YouTube" },
  { value: "x", label: "X (Twitter)" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "facebook", label: "Facebook" },
];

const STATUS_FILTERS = ["ALL", "DRAFT", "QUEUED", "SCHEDULED", "PUBLISHED", "FAILED"];

// ─── Component ──────────────────────────────────────────

export default function QueuePage() {
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [platformFilter, setPlatformFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Create form
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formPlatform, setFormPlatform] = useState("youtube");
  const [formBrandId, setFormBrandId] = useState("");
  const [formScheduledAt, setFormScheduledAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (platformFilter) params.set("platform", platformFilter);
    if (searchQuery) params.set("search", searchQuery);

    try {
      const res = await fetch(`/api/relay/posts?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.data || data || []);
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, platformFilter, searchQuery]);

  useEffect(() => {
    fetchPosts();
    fetch("/api/brands")
      .then((r) => r.json())
      .then((d) => setBrands(Array.isArray(d) ? d : d.data || []))
      .catch(() => {});
  }, [fetchPosts]);

  const handleCreate = async () => {
    if (!formTitle || !formBrandId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/relay/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          content: formContent || null,
          platform: formPlatform,
          brandId: formBrandId,
          scheduledAt: formScheduledAt || null,
        }),
      });
      if (res.ok) {
        setFormTitle("");
        setFormContent("");
        setFormPlatform("youtube");
        setFormBrandId("");
        setFormScheduledAt("");
        setCreateOpen(false);
        fetchPosts();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (id: string) => {
    const res = await fetch(`/api/relay/posts/${id}/publish`, { method: "POST" });
    if (res.ok) fetchPosts();
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/relay/posts/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSelectedPost(null);
      fetchPosts();
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    const res = await fetch(`/api/relay/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) fetchPosts();
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Content Queue</h2>
          <p className="text-sm text-[#9CA3AF]">
            Manage and schedule content for distribution
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New Post
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
          <Input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-[#E5E7EB] bg-white p-0.5">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                statusFilter === s
                  ? "bg-[#2E86AB] text-white"
                  : "text-[#6B7280] hover:bg-[#F0F2F5]"
              )}
            >
              {s === "ALL" ? "All" : STATUS_CONFIG[s]?.label || s}
            </button>
          ))}
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
      </div>

      {/* Create dialog */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#1A1A1A]">New Content Post</h3>
              <button onClick={() => setCreateOpen(false)} className="text-[#9CA3AF] hover:text-[#6B7280]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <Input
                placeholder="Post title *"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
              <Textarea
                placeholder="Content / caption..."
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={3}
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={formPlatform}
                  onChange={(e) => setFormPlatform(e.target.value)}
                  className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
                <select
                  value={formBrandId}
                  onChange={(e) => setFormBrandId(e.target.value)}
                  className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm"
                >
                  <option value="">Select brand *</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#6B7280]">Schedule (optional)</label>
                <Input
                  type="datetime-local"
                  value={formScheduledAt}
                  onChange={(e) => setFormScheduledAt(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={submitting || !formTitle || !formBrandId}>
                  {submitting ? "Creating..." : "Create Post"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Posts list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#2E86AB]" />
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-8 text-center">
          <Send className="mx-auto h-12 w-12 text-[#D1D5DB]" />
          <h3 className="mt-4 text-sm font-medium text-[#1A1A1A]">No Posts Yet</h3>
          <p className="mt-2 text-sm text-[#9CA3AF]">
            Create your first content post to start distributing.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => {
            const statusCfg = STATUS_CONFIG[post.status] || STATUS_CONFIG.DRAFT;
            return (
              <div
                key={post.id}
                className={cn(
                  "flex items-center gap-4 rounded-lg border border-[#E5E7EB] bg-white p-4 transition-colors hover:border-[#2E86AB]/30",
                  selectedPost === post.id && "border-[#2E86AB] bg-[#F8FBFD]"
                )}
              >
                {/* Platform icon */}
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F0F2F5] text-xs font-bold text-[#6B7280] uppercase">
                  {post.platform.slice(0, 2)}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#1A1A1A]">{post.title}</span>
                    {post.brand && (
                      <Badge variant="secondary" className="text-[10px]">
                        {post.brand.name}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-[10px] text-[#9CA3AF]">
                    <span className="capitalize">{post.platform}</span>
                    {post.scheduledAt && (
                      <span>
                        Scheduled: {new Date(post.scheduledAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    )}
                    {post.publishedAt && (
                      <span>
                        Published: {new Date(post.publishedAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short",
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status */}
                <Badge className={cn("text-[10px] gap-1", statusCfg.color)}>
                  {statusCfg.icon}
                  {statusCfg.label}
                </Badge>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {(post.status === "DRAFT" || post.status === "QUEUED") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => handleStatusUpdate(post.id, "QUEUED")}
                    >
                      Queue
                    </Button>
                  )}
                  {(post.status === "QUEUED" || post.status === "SCHEDULED") && (
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => handlePublish(post.id)}
                    >
                      <Send className="mr-1 h-3 w-3" />
                      Publish
                    </Button>
                  )}
                  {(post.status === "DRAFT" || post.status === "CANCELLED") && (
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="rounded p-1.5 text-[#9CA3AF] hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
