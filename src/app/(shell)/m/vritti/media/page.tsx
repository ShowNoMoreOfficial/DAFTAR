"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Upload,
  X,
  Image as ImageIcon,
  Film,
  FileText,
  Music,
  File,
  Loader2,
} from "lucide-react";

interface MediaItem {
  id: string;
  articleId: string | null;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  altText: string | null;
  caption: string | null;
  uploadedById: string | null;
  uploadedBy?: { id: string; name: string } | null;
  article?: { id: string; title: string } | null;
  createdAt: string;
}

const FILE_TYPE_FILTERS = [
  { key: "", label: "All" },
  { key: "image", label: "Images" },
  { key: "video", label: "Videos" },
  { key: "document", label: "Documents" },
  { key: "audio", label: "Audio" },
];

function getFileIcon(fileType: string) {
  if (fileType.startsWith("image")) return ImageIcon;
  if (fileType.startsWith("video")) return Film;
  if (fileType.startsWith("audio")) return Music;
  if (
    fileType.includes("pdf") ||
    fileType.includes("doc") ||
    fileType.includes("text")
  )
    return FileText;
  return File;
}

function humanizeFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isImageType(fileType: string) {
  return fileType.startsWith("image");
}

export default function MediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterType) params.set("type", filterType);
      const res = await fetch(`/api/vritti/media?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMedia(data.media || data || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [search, filterType]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--text-secondary)]" />
        <span className="ml-2 text-sm text-[var(--text-secondary)]">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">Media Library</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {media.length} file{media.length !== 1 ? "s" : ""}
          </p>
        </div>
        {/* Upload not yet implemented */}
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            placeholder="Search by filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8"
          />
        </div>
        <div className="flex items-center gap-1">
          {FILE_TYPE_FILTERS.map((ft) => (
            <Button
              key={ft.key}
              variant={filterType === ft.key ? "default" : "outline"}
              size="xs"
              className={cn(
                filterType === ft.key &&
                  "bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary)]/90"
              )}
              onClick={() => setFilterType(ft.key)}
            >
              {ft.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {media.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <ImageIcon className="h-10 w-10 text-[var(--text-muted)]" />
              <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">No media files</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {search || filterType
                  ? "Try adjusting your filters"
                  : "Upload your first media file to get started"}
              </p>
              {/* Upload not yet implemented */}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {media.map((item) => {
                const IconComponent = getFileIcon(item.fileType);
                const isSelected = selectedItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "cursor-pointer rounded-xl border bg-[var(--bg-surface)] p-2 transition-all hover:shadow-sm",
                      isSelected
                        ? "border-[#2E86AB] ring-1 ring-[#2E86AB]/30"
                        : "border-[var(--border-subtle)]"
                    )}
                    onClick={() => setSelectedItem(isSelected ? null : item)}
                  >
                    {/* Thumbnail */}
                    <div className="flex aspect-square items-center justify-center rounded-lg bg-[var(--bg-surface)]">
                      {isImageType(item.fileType) ? (
                        <img
                          src={item.fileUrl}
                          alt={item.altText || item.fileName}
                          className="h-full w-full rounded-lg object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                            (e.target as HTMLImageElement).parentElement!.innerHTML =
                              '<div class="flex items-center justify-center h-full w-full"><svg class="h-8 w-8 text-[var(--text-muted)]" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>';
                          }}
                        />
                      ) : (
                        <IconComponent className="h-8 w-8 text-[var(--text-muted)]" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="mt-2 px-1">
                      <p className="truncate text-xs font-medium text-[var(--text-primary)]">
                        {item.fileName}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                        {humanizeFileSize(item.fileSize)}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {formatDate(item.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedItem && (
          <div className="w-72 shrink-0 border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Details</h3>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setSelectedItem(null)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Preview */}
            <div className="mb-4 flex aspect-video items-center justify-center rounded-lg bg-[var(--bg-surface)]">
              {isImageType(selectedItem.fileType) ? (
                <img
                  src={selectedItem.fileUrl}
                  alt={selectedItem.altText || selectedItem.fileName}
                  className="h-full w-full rounded-lg object-contain"
                />
              ) : (
                (() => {
                  const Icon = getFileIcon(selectedItem.fileType);
                  return <Icon className="h-10 w-10 text-[var(--text-muted)]" />;
                })()
              )}
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase">Filename</p>
                <p className="text-sm text-[var(--text-primary)] break-all">{selectedItem.fileName}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase">Type</p>
                <p className="text-sm text-[var(--text-primary)]">{selectedItem.fileType}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase">Size</p>
                <p className="text-sm text-[var(--text-primary)]">{humanizeFileSize(selectedItem.fileSize)}</p>
              </div>
              {selectedItem.altText && (
                <div>
                  <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase">Alt Text</p>
                  <p className="text-sm text-[var(--text-primary)]">{selectedItem.altText}</p>
                </div>
              )}
              {selectedItem.caption && (
                <div>
                  <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase">Caption</p>
                  <p className="text-sm text-[var(--text-primary)]">{selectedItem.caption}</p>
                </div>
              )}
              {selectedItem.article && (
                <div>
                  <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase">
                    Associated Article
                  </p>
                  <a
                    href={`/m/vritti/articles/${selectedItem.article.id}`}
                    className="text-sm text-[var(--accent-primary)] hover:underline"
                  >
                    {selectedItem.article.title}
                  </a>
                </div>
              )}
              <div>
                <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase">Uploaded</p>
                <p className="text-sm text-[var(--text-primary)]">{formatDate(selectedItem.createdAt)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
