"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload,
  Loader2,
  ExternalLink,
  Download,
  FolderOpen,
  FileText,
  Film,
  Image as ImageIcon,
  Music,
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ─── Types ───

interface SharedFile {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  viewUrl: string;
  downloadUrl: string | null;
  thumbnailUrl: string | null;
  category: string;
  notes: string | null;
  direction: string;
  createdAt: string;
  uploadedBy: { name: string; role: string } | null;
  deliverable: { id: string; platform: string; status: string } | null;
  brand: { name: string } | null;
}

interface BrandOption {
  id: string;
  name: string;
  slug: string;
}

// ─── Helpers ───

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("video/")) return <Film className="h-5 w-5" />;
  if (mimeType.startsWith("image/")) return <ImageIcon className="h-5 w-5" />;
  if (mimeType.startsWith("audio/")) return <Music className="h-5 w-5" />;
  if (mimeType.includes("pdf") || mimeType.includes("document") || mimeType.includes("word"))
    return <FileText className="h-5 w-5" />;
  return <Paperclip className="h-5 w-5" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
}

function detectCategory(file: File): string {
  if (file.type.startsWith("video/")) return "raw_footage";
  if (file.type === "application/pdf") return "document";
  if (file.type.startsWith("image/")) return "reference";
  if (file.name.endsWith(".docx") || file.name.endsWith(".doc")) return "document";
  return "general";
}

// ─── FileCard ───

function FileCard({ file }: { file: SharedFile }) {
  const size = formatFileSize(file.fileSize);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 transition hover:border-[var(--text-muted)]">
      {/* Icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-elevated)] text-[var(--text-muted)]">
        {file.thumbnailUrl ? (
          <img
            src={file.thumbnailUrl}
            alt=""
            className="h-full w-full rounded-lg object-cover"
          />
        ) : (
          getFileIcon(file.mimeType)
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--text-primary)]">
          {file.fileName}
        </p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--text-muted)]">
          <span>{size}</span>
          <span>·</span>
          <span>{file.uploadedBy?.name || "Unknown"}</span>
          <span>·</span>
          <span>{new Date(file.createdAt).toLocaleDateString()}</span>
          {file.category !== "general" && (
            <>
              <span>·</span>
              <Badge variant="secondary" className="text-[10px]">
                {file.category.replace(/_/g, " ")}
              </Badge>
            </>
          )}
        </div>
        {file.notes && (
          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{file.notes}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <a
          href={file.viewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg p-2 text-[var(--text-muted)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
          title="View in Drive"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
        {file.downloadUrl && (
          <a
            href={file.downloadUrl}
            className="rounded-lg p-2 text-[var(--text-muted)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );
}

// ─── FileTransferSection ───

export function FileTransferSection({
  brandId,
  brandName,
  deliverableId,
}: {
  brandId: string;
  brandName: string;
  deliverableId?: string;
}) {
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(() => {
    const params = new URLSearchParams({ brandId });
    if (deliverableId) params.set("deliverableId", deliverableId);
    fetch(`/api/files?${params}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setFiles)
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  }, [brandId, deliverableId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUpload = async (fileList: FileList) => {
    setUploading(true);
    for (const file of Array.from(fileList)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("brandId", brandId);
      formData.append("category", detectCategory(file));
      if (deliverableId) formData.append("deliverableId", deliverableId);

      try {
        const res = await fetch("/api/files", { method: "POST", body: formData });
        const data = await res.json();
        if (res.ok) {
          setFiles((prev) => [data, ...prev]);
        }
      } catch {
        // Silently handle upload failures
      }
    }
    setUploading(false);
  };

  const fromTeam = files.filter((f) => f.direction === "to_client");
  const fromClient = files.filter((f) => f.direction === "from_client");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">
          Files — {brandName}
        </h3>
        <Button
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary)]/90"
        >
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          Upload File
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleUpload(e.target.files)}
        />
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) handleUpload(e.dataTransfer.files);
        }}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          dragOver
            ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/5"
            : "border-[var(--border-subtle)] hover:border-[var(--text-muted)]"
        }`}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--accent-primary)]" />
            <span className="text-sm text-[var(--text-secondary)]">Uploading...</span>
          </div>
        ) : (
          <div>
            <Upload className="mx-auto mb-2 h-8 w-8 text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-secondary)]">
              Drag & drop files here, or click Upload
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Videos, documents, images — any file type
            </p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--accent-primary)]" />
        </div>
      ) : (
        <>
          {/* Files from team */}
          {fromTeam.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-[var(--text-secondary)]">
                From ShowNoMore ({fromTeam.length})
              </h4>
              <div className="space-y-2">
                {fromTeam.map((file) => (
                  <FileCard key={file.id} file={file} />
                ))}
              </div>
            </div>
          )}

          {/* Files from client */}
          {fromClient.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-[var(--text-secondary)]">
                Client Uploads ({fromClient.length})
              </h4>
              <div className="space-y-2">
                {fromClient.map((file) => (
                  <FileCard key={file.id} file={file} />
                ))}
              </div>
            </div>
          )}

          {files.length === 0 && !uploading && (
            <p className="py-8 text-center text-sm text-[var(--text-muted)]">
              No files shared yet. Upload a file to get started.
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ─── Page ───

export default function FilesPage() {
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/brands")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setBrands(Array.isArray(data) ? data : []))
      .catch(() => setBrands([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-[var(--accent-primary)]" />
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Files</h1>
        </div>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Share files with your team. Upload videos, documents, and reference material.
        </p>
      </div>

      {brands.length === 0 ? (
        <p className="py-12 text-center text-sm text-[var(--text-muted)]">
          No brands found. You may not have access to any brands yet.
        </p>
      ) : (
        brands.map((brand) => (
          <div
            key={brand.id}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5"
          >
            <FileTransferSection brandId={brand.id} brandName={brand.name} />
          </div>
        ))
      )}
    </div>
  );
}
