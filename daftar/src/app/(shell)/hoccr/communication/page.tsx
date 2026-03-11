"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Megaphone,
  Pin,
  Plus,
  Loader2,
  X,
  Eye,
  Calendar,
  Filter,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---- Types ----

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  type: string;
  scope: string;
  scopeId: string | null;
  authorId: string;
  author: { id: string; name: string; avatar: string | null };
  isPinned: boolean;
  expiresAt: string | null;
  readCount: number;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---- Constants ----

const TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  urgent: { bg: "bg-red-100", text: "text-red-700", label: "Urgent" },
  policy: { bg: "bg-blue-100", text: "text-blue-700", label: "Policy" },
  celebration: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Celebration" },
  general: { bg: "bg-gray-100", text: "text-gray-600", label: "General" },
};

const SCOPE_LABELS: Record<string, string> = {
  org: "Org-wide",
  department: "Department",
  brand: "Brand",
};

// ---- Component ----

export default function CommunicationPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<AnnouncementItem | null>(null);

  // Filters
  const [filterType, setFilterType] = useState("");
  const [filterScope, setFilterScope] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.set("type", filterType);
      if (filterScope) params.set("scope", filterScope);
      if (filterFrom) params.set("from", filterFrom);
      if (filterTo) params.set("to", filterTo);

      const res = await fetch(`/api/hoccr/announcements?${params.toString()}`);
      if (res.ok) {
        setAnnouncements(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [filterType, filterScope, filterFrom, filterTo]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleViewDetail = async (id: string) => {
    setDetailOpen(id);
    const res = await fetch(`/api/hoccr/announcements/${id}`);
    if (res.ok) {
      setDetailData(await res.json());
      // Update read status in list
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isRead: true } : a))
      );
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/hoccr/announcements/${id}`, { method: "DELETE" });
    if (res.ok) {
      setDetailOpen(null);
      setDetailData(null);
      fetchAnnouncements();
    }
  };

  const pinnedAnnouncements = announcements.filter((a) => a.isPinned);
  const regularAnnouncements = announcements.filter((a) => !a.isPinned);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#2E86AB]" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Communication</h2>
          <p className="text-sm text-[#9CA3AF]">Announcements and organizational updates</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="mr-1.5 h-3.5 w-3.5" />
            Filters
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Create Announcement
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-[#E5E7EB] bg-white p-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm"
          >
            <option value="">All Types</option>
            <option value="general">General</option>
            <option value="urgent">Urgent</option>
            <option value="policy">Policy</option>
            <option value="celebration">Celebration</option>
          </select>
          <select
            value={filterScope}
            onChange={(e) => setFilterScope(e.target.value)}
            className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm"
          >
            <option value="">All Scopes</option>
            <option value="org">Org-wide</option>
            <option value="department">Department</option>
            <option value="brand">Brand</option>
          </select>
          <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
            <span>From</span>
            <Input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="h-7 w-36 text-xs"
            />
            <span>To</span>
            <Input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className="h-7 w-36 text-xs"
            />
          </div>
          {(filterType || filterScope || filterFrom || filterTo) && (
            <button
              onClick={() => {
                setFilterType("");
                setFilterScope("");
                setFilterFrom("");
                setFilterTo("");
              }}
              className="text-xs text-[#2E86AB] hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Pinned Announcements */}
      {pinnedAnnouncements.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#1A1A1A]">
            <Pin className="h-4 w-4 text-[#2E86AB]" />
            Pinned
          </h3>
          <div className="space-y-3">
            {pinnedAnnouncements.map((a) => (
              <AnnouncementCard
                key={a.id}
                announcement={a}
                onView={() => handleViewDetail(a.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Announcements Feed */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#1A1A1A]">
          <Megaphone className="h-4 w-4 text-[#2E86AB]" />
          Announcements
        </h3>
        {regularAnnouncements.length === 0 && pinnedAnnouncements.length === 0 ? (
          <div className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-8 text-center text-sm text-[#9CA3AF]">
            No announcements yet. Create one to get started.
          </div>
        ) : regularAnnouncements.length === 0 ? (
          <div className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-6 text-center text-sm text-[#9CA3AF]">
            No additional announcements
          </div>
        ) : (
          <div className="space-y-3">
            {regularAnnouncements.map((a) => (
              <AnnouncementCard
                key={a.id}
                announcement={a}
                onView={() => handleViewDetail(a.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Announcement Dialog */}
      {createOpen && (
        <CreateAnnouncementDialog
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            fetchAnnouncements();
          }}
        />
      )}

      {/* Detail Dialog */}
      {detailOpen && detailData && (
        <AnnouncementDetailDialog
          announcement={detailData}
          onClose={() => {
            setDetailOpen(null);
            setDetailData(null);
          }}
          onDelete={() => handleDelete(detailData.id)}
        />
      )}
    </div>
  );
}

// ---- Sub-components ----

function AnnouncementCard({
  announcement,
  onView,
}: {
  announcement: AnnouncementItem;
  onView: () => void;
}) {
  const typeStyle = TYPE_STYLES[announcement.type] || TYPE_STYLES.general;

  return (
    <div
      className={cn(
        "cursor-pointer rounded-lg border border-[#E5E7EB] bg-white p-4 transition-colors hover:bg-[#F8F9FA]",
        !announcement.isRead && "border-l-4 border-l-[#2E86AB]"
      )}
      onClick={onView}
    >
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Badge className={cn("text-[10px]", typeStyle.bg, typeStyle.text)}>
            {typeStyle.label}
          </Badge>
          {announcement.isPinned && (
            <Pin className="h-3 w-3 text-[#2E86AB]" />
          )}
          <Badge variant="secondary" className="text-[10px]">
            {SCOPE_LABELS[announcement.scope] || announcement.scope}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[#9CA3AF]">
          <Eye className="h-3 w-3" />
          <span>{announcement.readCount} read</span>
        </div>
      </div>
      <h4 className="mb-1 text-sm font-medium text-[#1A1A1A]">{announcement.title}</h4>
      <p className="mb-2 line-clamp-2 text-xs text-[#6B7280]">{announcement.content}</p>
      <div className="flex items-center gap-3 text-[10px] text-[#9CA3AF]">
        <div className="flex items-center gap-1">
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#2E86AB] text-[8px] text-white">
            {announcement.author.name.charAt(0)}
          </div>
          <span>{announcement.author.name}</span>
        </div>
        <span>
          {new Date(announcement.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        {announcement.expiresAt && (
          <span className="flex items-center gap-0.5">
            <Calendar className="h-3 w-3" />
            Expires{" "}
            {new Date(announcement.expiresAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}
          </span>
        )}
      </div>
    </div>
  );
}

function AnnouncementDetailDialog({
  announcement,
  onClose,
  onDelete,
}: {
  announcement: AnnouncementItem;
  onClose: () => void;
  onDelete: () => void;
}) {
  const typeStyle = TYPE_STYLES[announcement.type] || TYPE_STYLES.general;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Badge className={cn("text-xs", typeStyle.bg, typeStyle.text)}>
              {typeStyle.label}
            </Badge>
            {announcement.isPinned && (
              <Badge variant="secondary" className="text-xs">
                <Pin className="mr-1 h-3 w-3" />
                Pinned
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onDelete}
              className="rounded p-1 text-red-500 hover:bg-red-50"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#6B7280]">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <h3 className="mb-2 text-lg font-semibold text-[#1A1A1A]">{announcement.title}</h3>

        <div className="mb-4 flex items-center gap-3 text-xs text-[#9CA3AF]">
          <div className="flex items-center gap-1">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2E86AB] text-[9px] text-white">
              {announcement.author.name.charAt(0)}
            </div>
            <span>{announcement.author.name}</span>
          </div>
          <span>
            {new Date(announcement.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <Badge variant="secondary" className="text-[10px]">
            {SCOPE_LABELS[announcement.scope] || announcement.scope}
          </Badge>
        </div>

        <div className="mb-4 whitespace-pre-wrap rounded-lg bg-[#F8F9FA] p-4 text-sm text-[#1A1A1A]">
          {announcement.content}
        </div>

        <div className="flex items-center gap-3 text-xs text-[#9CA3AF]">
          <div className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            <span>{announcement.readCount} read</span>
          </div>
          {announcement.expiresAt && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Expires{" "}
              {new Date(announcement.expiresAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateAnnouncementDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("general");
  const [scope, setScope] = useState("org");
  const [scopeId, setScopeId] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load departments/brands for scope selection
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/hoccr/intelligence")
      .then((r) => r.json())
      .then((data) => {
        if (data.departments) setDepartments(data.departments);
      })
      .catch(() => {});

    // Try to load brands
    fetch("/api/brands")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.brands || [];
        setBrands(list.map((b: { id: string; name: string }) => ({ id: b.id, name: b.name })));
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!title || !content) return;
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { title, content, type, scope, isPinned };
      if (scope !== "org" && scopeId) body.scopeId = scopeId;
      if (expiresAt) body.expiresAt = expiresAt;

      const res = await fetch("/api/hoccr/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) onCreated();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#1A1A1A]">Create Announcement</h3>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#6B7280]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-[#6B7280]">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#6B7280]">Content</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your announcement..."
              rows={5}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-[#6B7280]">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm"
              >
                <option value="general">General</option>
                <option value="urgent">Urgent</option>
                <option value="policy">Policy</option>
                <option value="celebration">Celebration</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#6B7280]">Scope</label>
              <select
                value={scope}
                onChange={(e) => {
                  setScope(e.target.value);
                  setScopeId("");
                }}
                className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm"
              >
                <option value="org">Org-wide</option>
                <option value="department">Specific Department</option>
                <option value="brand">Specific Brand</option>
              </select>
            </div>
          </div>

          {scope === "department" && (
            <div>
              <label className="mb-1 block text-xs text-[#6B7280]">Department</label>
              <select
                value={scopeId}
                onChange={(e) => setScopeId(e.target.value)}
                className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm"
              >
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {scope === "brand" && (
            <div>
              <label className="mb-1 block text-xs text-[#6B7280]">Brand</label>
              <select
                value={scopeId}
                onChange={(e) => setScopeId(e.target.value)}
                className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm"
              >
                <option value="">Select brand</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-[#6B7280]">Expiry Date (optional)</label>
              <Input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm text-[#6B7280]">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="accent-[#2E86AB]"
                />
                Pin this announcement
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !title || !content}>
              {submitting ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
