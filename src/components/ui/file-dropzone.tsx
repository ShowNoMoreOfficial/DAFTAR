"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Upload, X, CheckCircle2, AlertCircle, FileIcon } from "lucide-react";

interface UploadedFile {
  file: File;
  key: string;
  publicUrl: string;
}

interface FileDropzoneProps {
  /** Called after each file is successfully uploaded */
  onUpload?: (file: UploadedFile) => void;
  /** Called when all queued files finish uploading */
  onAllComplete?: (files: UploadedFile[]) => void;
  /** S3 folder prefix (default: "uploads") */
  folder?: string;
  /** Accepted MIME types (default: images + video + audio + pdf) */
  accept?: string;
  /** Max file size in bytes (default: 50MB) */
  maxSize?: number;
  /** Allow multiple files (default: true) */
  multiple?: boolean;
  className?: string;
}

interface FileEntry {
  id: string;
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
  result?: UploadedFile;
}

export function FileDropzone({
  onUpload,
  onAllComplete,
  folder = "uploads",
  accept,
  maxSize = 50 * 1024 * 1024,
  multiple = true,
  className,
}: FileDropzoneProps) {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const updateEntry = useCallback(
    (id: string, patch: Partial<FileEntry>) => {
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...patch } : e))
      );
    },
    []
  );

  const uploadFile = useCallback(
    async (entry: FileEntry) => {
      updateEntry(entry.id, { status: "uploading", progress: 0 });

      try {
        // 1. Get presigned URL
        const res = await fetch("/api/upload/presigned", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: entry.file.name,
            contentType: entry.file.type,
            size: entry.file.size,
            folder,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to get upload URL");
        }

        const { key, url, publicUrl } = await res.json();

        // 2. Upload directly to S3 via XHR for progress tracking
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", url);
          xhr.setRequestHeader("Content-Type", entry.file.type);

          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const progress = Math.round((e.loaded / e.total) * 100);
              updateEntry(entry.id, { progress });
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed (${xhr.status})`));
            }
          });

          xhr.addEventListener("error", () => reject(new Error("Network error")));
          xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

          xhr.send(entry.file);
        });

        const result: UploadedFile = {
          file: entry.file,
          key,
          publicUrl,
        };

        updateEntry(entry.id, { status: "done", progress: 100, result });
        onUpload?.(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        updateEntry(entry.id, { status: "error", error: message });
        return null;
      }
    },
    [folder, onUpload, updateEntry]
  );

  const processFiles = useCallback(
    async (files: File[]) => {
      const newEntries: FileEntry[] = files.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        status: "pending" as const,
        progress: 0,
      }));

      // Validate sizes
      for (const entry of newEntries) {
        if (entry.file.size > maxSize) {
          entry.status = "error";
          entry.error = `File too large (max ${Math.round(maxSize / 1024 / 1024)}MB)`;
        }
      }

      setEntries((prev) => [...prev, ...newEntries]);

      // Upload valid entries sequentially to avoid thundering herd
      const results: UploadedFile[] = [];
      for (const entry of newEntries) {
        if (entry.status === "error") continue;
        const result = await uploadFile(entry);
        if (result) results.push(result);
      }

      if (results.length > 0) {
        onAllComplete?.(results);
      }
    },
    [maxSize, uploadFile, onAllComplete]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        processFiles(multiple ? files : [files[0]]);
      }
    },
    [multiple, processFiles]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) processFiles(files);
      e.target.value = "";
    },
    [processFiles]
  );

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-all",
          isDragOver
            ? "border-[#2E86AB] bg-[var(--accent-primary)]/5"
            : "border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[#2E86AB]/50 hover:bg-[var(--bg-surface)]/80"
        )}
      >
        <Upload
          className={cn(
            "mb-3 h-8 w-8",
            isDragOver ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)]"
          )}
        />
        <p className="text-sm font-medium text-[var(--text-primary)]">
          {isDragOver ? "Drop files here" : "Drag & drop files here"}
        </p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          or click to browse &middot; Max {Math.round(maxSize / 1024 / 1024)}MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {/* File list */}
      {entries.length > 0 && (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2"
            >
              <FileIcon className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-[var(--text-primary)]">
                  {entry.file.name}
                </p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {(entry.file.size / 1024).toFixed(1)} KB
                </p>
                {entry.status === "uploading" && (
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                    <div
                      className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-200"
                      style={{ width: `${entry.progress}%` }}
                    />
                  </div>
                )}
                {entry.status === "error" && (
                  <p className="mt-0.5 text-[10px] text-red-500">{entry.error}</p>
                )}
              </div>
              <div className="shrink-0">
                {entry.status === "uploading" && (
                  <span className="text-[10px] font-medium text-[var(--accent-primary)]">
                    {entry.progress}%
                  </span>
                )}
                {entry.status === "done" && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                {entry.status === "error" && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
              {(entry.status === "done" || entry.status === "error") && (
                <button
                  onClick={() => removeEntry(entry.id)}
                  className="shrink-0 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
