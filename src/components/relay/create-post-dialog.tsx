"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Image, Hash, AtSign, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────

interface CreatePostDialogProps {
  open: boolean;
  onClose: () => void;
  brands: { id: string; name: string }[];
  onCreated: () => void;
}

// ─── Constants ──────────────────────────────────────────

const PLATFORMS = [
  { value: "youtube", label: "YouTube", color: "#FF0000", icon: "YT", hint: "Best for long-form video content. Add a compelling thumbnail." },
  { value: "x", label: "X", color: "#000000", icon: "X", hint: "280 character limit. Use hashtags and mentions for reach." },
  { value: "instagram", label: "Instagram", color: "#E4405F", icon: "IG", hint: "Image or video required. Use up to 30 hashtags." },
  { value: "linkedin", label: "LinkedIn", color: "#0A66C2", icon: "LI", hint: "Professional tone. Articles and carousels perform well." },
  { value: "facebook", label: "Facebook", color: "#1877F2", icon: "FB", hint: "Visual content gets higher engagement. Keep text concise." },
];

const CHAR_LIMITS: Record<string, number> = {
  x: 280,
  linkedin: 3000,
  facebook: 63206,
  instagram: 2200,
  youtube: 5000,
};

// ─── Component ──────────────────────────────────────────

export function CreatePostDialog({ open, onClose, brands, onCreated }: CreatePostDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState("youtube");
  const [brandId, setBrandId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [taskId, setTaskId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const selectedPlatform = PLATFORMS.find((p) => p.value === platform);
  const charLimit = CHAR_LIMITS[platform] || 5000;
  const contentLength = content.length;
  const isOverLimit = contentLength > charLimit;

  const addMediaUrl = () => {
    if (newMediaUrl.trim() && !mediaUrls.includes(newMediaUrl.trim())) {
      setMediaUrls([...mediaUrls, newMediaUrl.trim()]);
      setNewMediaUrl("");
    }
  };

  const removeMediaUrl = (url: string) => {
    setMediaUrls(mediaUrls.filter((u) => u !== url));
  };

  const addTag = () => {
    const tag = newTag.trim().replace(/^[#@]/, "");
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setPlatform("youtube");
    setBrandId("");
    setScheduledAt("");
    setMediaUrls([]);
    setNewMediaUrl("");
    setTags([]);
    setNewTag("");
    setTaskId("");
    setError("");
  };

  const handleSubmit = async () => {
    if (!title || !brandId) return;
    setSubmitting(true);
    setError("");

    try {
      const metadata: Record<string, unknown> = {};
      if (tags.length > 0) {
        metadata.hashtags = tags.filter((t) => !t.startsWith("@")).map((t) => `#${t}`);
        metadata.mentions = tags.filter((t) => t.startsWith("@"));
      }

      const res = await fetch("/api/relay/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content: content || null,
          platform,
          brandId,
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
          mediaUrls: mediaUrls.length > 0 ? mediaUrls : null,
          metadata: Object.keys(metadata).length > 0 ? metadata : null,
          taskId: taskId || null,
        }),
      });

      if (res.ok) {
        toast.success(scheduledAt ? "Post scheduled successfully" : "Post created as draft");
        resetForm();
        onCreated();
        onClose();
      } else {
        const data = await res.json();
        const msg = data.error || "Failed to create post";
        setError(msg);
        toast.error(msg);
      }
    } catch {
      setError("Network error. Please try again.");
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex w-full max-w-3xl max-h-[90vh] rounded-xl bg-[var(--bg-surface)] shadow-xl">
        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Create Post</h3>
            <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mb-3 rounded-lg bg-[rgba(239,68,68,0.1)] px-3 py-2 text-xs text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Title *</label>
              <Input
                placeholder="Post title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Platform selector */}
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Platform *</label>
              <div className="flex gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPlatform(p.value)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                      platform === p.value
                        ? "border-current shadow-sm"
                        : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#9CA3AF]"
                    )}
                    style={platform === p.value ? { borderColor: p.color, color: p.color } : undefined}
                  >
                    <div
                      className="h-3 w-3 rounded"
                      style={{ backgroundColor: p.color }}
                    />
                    {p.label}
                  </button>
                ))}
              </div>
              {selectedPlatform && (
                <p className="mt-1.5 text-[10px] text-[var(--text-muted)]">{selectedPlatform.hint}</p>
              )}
            </div>

            {/* Brand selector */}
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Brand *</label>
              <select
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm"
              >
                <option value="">Select brand</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Content */}
            <div>
              <label className="mb-1 flex items-center justify-between text-xs font-medium text-[var(--text-secondary)]">
                <span>Content</span>
                <span className={cn(
                  "text-[10px]",
                  isOverLimit ? "text-red-500 font-semibold" : "text-[var(--text-muted)]"
                )}>
                  {contentLength}/{charLimit}
                </span>
              </label>
              <Textarea
                placeholder="Write your content here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className={cn(isOverLimit && "border-red-300 focus:ring-red-500")}
              />
            </div>

            {/* Media URLs */}
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
                <span className="flex items-center gap-1">
                  <Image className="h-3 w-3" /> Media URLs
                </span>
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://..."
                  value={newMediaUrl}
                  onChange={(e) => setNewMediaUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMediaUrl())}
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={addMediaUrl} disabled={!newMediaUrl.trim()}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              {mediaUrls.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {mediaUrls.map((url) => (
                    <Badge key={url} variant="secondary" className="gap-1 text-[10px]">
                      <Link2 className="h-2.5 w-2.5" />
                      {url.length > 40 ? url.slice(0, 40) + "..." : url}
                      <button onClick={() => removeMediaUrl(url)} className="ml-0.5 hover:text-red-500">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Schedule */}
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Schedule (optional)</label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>

            {/* Hashtags / Mentions */}
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
                <span className="flex items-center gap-1">
                  <Hash className="h-3 w-3" /> Hashtags & <AtSign className="h-3 w-3" /> Mentions
                </span>
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="#hashtag or @mention"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={addTag} disabled={!newTag.trim()}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1 text-[10px]">
                      {tag.startsWith("@") ? tag : `#${tag}`}
                      <button onClick={() => removeTag(tag)} className="ml-0.5 hover:text-red-500">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Linked task */}
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Linked Task ID (optional)</label>
              <Input
                placeholder="Task ID"
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !title || !brandId || isOverLimit}
              >
                {submitting ? "Creating..." : scheduledAt ? "Schedule Post" : "Create Draft"}
              </Button>
            </div>
          </div>
        </div>

        {/* Preview panel */}
        <div className="w-64 border-l border-[var(--border-subtle)] bg-[#FAFAFA] p-4 overflow-y-auto rounded-r-xl">
          <h4 className="mb-3 text-xs font-semibold text-[var(--text-secondary)] uppercase">Preview</h4>

          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3">
            {/* Platform indicator */}
            <div className="mb-2 flex items-center gap-2">
              {selectedPlatform && (
                <div
                  className="h-3 w-3 rounded"
                  style={{ backgroundColor: selectedPlatform.color }}
                />
              )}
              <span className="text-[10px] font-medium text-[var(--text-secondary)]">
                {selectedPlatform?.label || "Platform"}
              </span>
            </div>

            {/* Title */}
            <p className="text-xs font-semibold text-[var(--text-primary)]">
              {title || "Post title"}
            </p>

            {/* Content preview */}
            {content && (
              <p className="mt-1.5 text-[10px] text-[var(--text-secondary)] line-clamp-6 whitespace-pre-wrap">
                {content}
              </p>
            )}

            {/* Media indicator */}
            {mediaUrls.length > 0 && (
              <div className="mt-2 flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                <Image className="h-3 w-3" />
                {mediaUrls.length} media file{mediaUrls.length > 1 ? "s" : ""}
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <span key={tag} className="text-[9px] text-[var(--accent-primary)]">
                    {tag.startsWith("@") ? tag : `#${tag}`}
                  </span>
                ))}
              </div>
            )}

            {/* Schedule indicator */}
            {scheduledAt && (
              <div className="mt-2 border-t border-[#F0F2F5] pt-1.5 text-[9px] text-[var(--text-muted)]">
                Scheduled: {new Date(scheduledAt).toLocaleString("en-IN", {
                  day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                })}
              </div>
            )}

            {/* Brand */}
            {brandId && (
              <div className="mt-1 text-[9px] text-[var(--text-muted)]">
                Brand: {brands.find((b) => b.id === brandId)?.name || "Unknown"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
