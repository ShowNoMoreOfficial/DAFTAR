"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  FileCheck,
  CheckCircle2,
  MessageSquare,
  Filter,
  Image as ImageIcon,
  Loader2,
  Send,
  X,
} from "lucide-react";

interface Deliverable {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  fileUrl: string | null;
  thumbnailUrl: string | null;
  feedback: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "ready_for_review", label: "Ready for Review" },
  { value: "approved", label: "Approved" },
  { value: "revision_requested", label: "Revision Requested" },
  { value: "final", label: "Final" },
];

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  ready_for_review: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  revision_requested: "bg-orange-100 text-orange-800",
  final: "bg-emerald-100 text-emerald-800",
};

const typeStyles: Record<string, string> = {
  video: "bg-purple-100 text-purple-700",
  article: "bg-sky-100 text-sky-700",
  graphic: "bg-pink-100 text-pink-700",
  report: "bg-teal-100 text-teal-700",
  social_post: "bg-indigo-100 text-indigo-700",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusLabel(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function BrandDeliverablesPage() {
  const { brandId } = useParams<{ brandId: string }>();
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");

  const fetchDeliverables = useCallback(() => {
    setLoading(true);
    const qs = statusFilter ? `?status=${statusFilter}` : "";
    fetch(`/api/client/brands/${brandId}/deliverables${qs}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setDeliverables(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [brandId, statusFilter]);

  useEffect(() => {
    fetchDeliverables();
  }, [fetchDeliverables]);

  async function handleReview(id: string, action: "approve" | "request_revision", feedback?: string) {
    setReviewingId(id);
    try {
      const res = await fetch(`/api/client/deliverables/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, feedback }),
      });
      if (res.ok) {
        const updated = await res.json();
        setDeliverables((prev) =>
          prev.map((d) => (d.id === id ? { ...d, ...updated } : d))
        );
        setFeedbackId(null);
        setFeedbackText("");
      }
    } finally {
      setReviewingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <Link
        href={`/brands/${brandId}`}
        className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1A1A1A]"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Brand Dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1A1A1A]">Deliverables</h1>
          <p className="text-sm text-[#9CA3AF]">Review and manage deliverables for this brand</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#6B7280]" />
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  statusFilter === opt.value
                    ? "bg-[#2E86AB] text-white"
                    : "bg-[#F8F9FA] text-[#6B7280] hover:bg-[#E5E7EB]"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Deliverables list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#2E86AB]" />
        </div>
      ) : deliverables.length === 0 ? (
        <p className="py-16 text-center text-sm text-[#9CA3AF]">
          No deliverables found{statusFilter ? ` with status "${statusLabel(statusFilter)}"` : ""}.
        </p>
      ) : (
        <div className="space-y-3">
          {deliverables.map((d) => (
            <div
              key={d.id}
              className="rounded-xl border border-[#E5E7EB] bg-white p-5"
            >
              <div className="flex items-start gap-4">
                {/* Thumbnail */}
                {d.thumbnailUrl ? (
                  <img
                    src={d.thumbnailUrl}
                    alt={d.title}
                    className="h-16 w-16 shrink-0 rounded-lg border border-[#E5E7EB] object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-[#F8F9FA]">
                    <ImageIcon className="h-6 w-6 text-[#9CA3AF]" />
                  </div>
                )}

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-[#1A1A1A]">{d.title}</h3>
                      {d.description && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-[#6B7280]">{d.description}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge
                        className={cn(
                          "text-[10px] font-medium",
                          typeStyles[d.type] || "bg-gray-100 text-gray-700"
                        )}
                      >
                        {d.type.replace(/_/g, " ")}
                      </Badge>
                      <Badge
                        className={cn(
                          "text-[10px] font-medium",
                          statusStyles[d.status] || "bg-gray-100 text-gray-700"
                        )}
                      >
                        {statusLabel(d.status)}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-3 text-[10px] text-[#9CA3AF]">
                    <span>Created {formatDate(d.createdAt)}</span>
                    {d.approvedAt && <span>Approved {formatDate(d.approvedAt)}</span>}
                  </div>

                  {/* Existing feedback */}
                  {d.feedback && d.status === "revision_requested" && (
                    <div className="mt-2 rounded-lg bg-orange-50 px-3 py-2 text-xs text-orange-800">
                      <span className="font-medium">Revision feedback:</span> {d.feedback}
                    </div>
                  )}

                  {/* Actions for reviewable deliverables */}
                  {(d.status === "ready_for_review" || d.status === "pending") && (
                    <div className="mt-3">
                      {feedbackId === d.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder="Enter revision feedback..."
                            className="h-8 flex-1 text-xs"
                          />
                          <Button
                            size="sm"
                            className="h-8 bg-[#A23B72] text-xs hover:bg-[#A23B72]/90"
                            disabled={!feedbackText.trim() || reviewingId === d.id}
                            onClick={() =>
                              handleReview(d.id, "request_revision", feedbackText.trim())
                            }
                          >
                            {reviewingId === d.id ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <Send className="mr-1 h-3 w-3" />
                            )}
                            Send
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs"
                            onClick={() => {
                              setFeedbackId(null);
                              setFeedbackText("");
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-[#A23B72] hover:bg-[#A23B72]/5"
                            disabled={reviewingId === d.id}
                            onClick={() => setFeedbackId(d.id)}
                          >
                            <MessageSquare className="mr-1 h-3 w-3" />
                            Request Revision
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 bg-[#2E86AB] text-xs hover:bg-[#2E86AB]/90"
                            disabled={reviewingId === d.id}
                            onClick={() => handleReview(d.id, "approve")}
                          >
                            {reviewingId === d.id ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                            )}
                            Approve
                          </Button>
                          {d.fileUrl && (
                            <a
                              href={d.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-auto"
                            >
                              <Button size="sm" variant="ghost" className="h-7 text-xs text-[#2E86AB]">
                                <FileCheck className="mr-1 h-3 w-3" />
                                View File
                              </Button>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
