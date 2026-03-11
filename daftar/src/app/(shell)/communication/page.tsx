"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Megaphone,
  MessageSquare,
  Plus,
  X,
  Pin,
  Check,
  ChevronRight,
  AlertCircle,
  Loader2,
  ThumbsUp,
  Send,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  authorId: string;
  authorName?: string;
  departmentId: string | null;
  departmentName?: string | null;
  isPinned: boolean;
  expiresAt: string | null;
  readCount: number;
  isRead: boolean;
  createdAt: string;
}

interface FeedbackChannel {
  id: string;
  name: string;
  description: string | null;
  type: string;
  isAnonymous: boolean;
  entryCount?: number;
}

interface FeedbackEntry {
  id: string;
  content: string;
  status: string;
  response: string | null;
  respondedBy: string | null;
  upvotes: number;
  createdAt: string;
  channelName?: string;
}

// ─── Constants ──────────────────────────────────────────

const PRIORITY_STYLES: Record<string, { bg: string; text: string }> = {
  LOW: { bg: "bg-gray-100", text: "text-gray-600" },
  NORMAL: { bg: "bg-blue-50", text: "text-blue-700" },
  HIGH: { bg: "bg-orange-50", text: "text-orange-700" },
  URGENT: { bg: "bg-red-50", text: "text-red-700" },
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-700",
  acknowledged: "bg-blue-100 text-blue-700",
  in_progress: "bg-purple-100 text-purple-700",
  resolved: "bg-emerald-100 text-emerald-700",
  closed: "bg-gray-100 text-gray-500",
};

// ─── Component ──────────────────────────────────────────

export default function CommunicationPage() {
  const [activeTab, setActiveTab] = useState<"announcements" | "feedback">("announcements");

  return (
    <div className="h-full overflow-y-auto">
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-[#E5E7EB] bg-white px-6">
        {([
          { key: "announcements" as const, label: "Announcements", icon: Megaphone },
          { key: "feedback" as const, label: "Feedback", icon: MessageSquare },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm transition-colors",
              activeTab === tab.key
                ? "border-[#2E86AB] font-medium text-[#2E86AB]"
                : "border-transparent text-[#6B7280] hover:text-[#1A1A1A]"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {activeTab === "announcements" && <AnnouncementsTab />}
        {activeTab === "feedback" && <FeedbackTab />}
      </div>
    </div>
  );
}

// ─── Announcements Tab ──────────────────────────────────

function AnnouncementsTab() {
  const { data: session } = useSession();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);

  // Form
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formPriority, setFormPriority] = useState("NORMAL");
  const [formDeptId, setFormDeptId] = useState("");
  const [formPinned, setFormPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canCreate = session?.user?.role === "ADMIN" || session?.user?.role === "HEAD_HR" || session?.user?.role === "DEPT_HEAD";

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/communication/announcements");
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.data || data || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
    fetch("/api/departments")
      .then((r) => r.json())
      .then((d) => setDepartments(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [fetchAnnouncements]);

  const handleCreate = async () => {
    if (!formTitle || !formContent) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/communication/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          content: formContent,
          priority: formPriority,
          departmentId: formDeptId || null,
          isPinned: formPinned,
        }),
      });
      if (res.ok) {
        setFormTitle("");
        setFormContent("");
        setFormPriority("NORMAL");
        setFormDeptId("");
        setFormPinned(false);
        setCreateOpen(false);
        fetchAnnouncements();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    await fetch(`/api/communication/announcements/${id}/read`, { method: "POST" });
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isRead: true } : a))
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[#2E86AB]" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#1A1A1A]">Announcements</h3>
          <p className="text-xs text-[#9CA3AF]">Organization and department updates</p>
        </div>
        {canCreate && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Announcement
          </Button>
        )}
      </div>

      {/* Create dialog */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#1A1A1A]">New Announcement</h3>
              <button onClick={() => setCreateOpen(false)} className="text-[#9CA3AF] hover:text-[#6B7280]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <Input placeholder="Title *" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
              <Textarea
                placeholder="Content *"
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={4}
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value)}
                  className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm"
                >
                  <option value="LOW">Low Priority</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High Priority</option>
                  <option value="URGENT">Urgent</option>
                </select>
                <select
                  value={formDeptId}
                  onChange={(e) => setFormDeptId(e.target.value)}
                  className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm"
                >
                  <option value="">Organization-wide</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-[#6B7280]">
                <input
                  type="checkbox"
                  checked={formPinned}
                  onChange={(e) => setFormPinned(e.target.checked)}
                  className="accent-[#2E86AB]"
                />
                Pin this announcement
              </label>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={submitting || !formTitle || !formContent}>
                  {submitting ? "Posting..." : "Post Announcement"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Announcements list */}
      {announcements.length === 0 ? (
        <div className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-8 text-center text-sm text-[#9CA3AF]">
          No announcements yet.
        </div>
      ) : (
        <div className="space-y-3">
          {/* Pinned first */}
          {announcements
            .sort((a, b) => (a.isPinned === b.isPinned ? 0 : a.isPinned ? -1 : 1))
            .map((ann) => {
              const prStyle = PRIORITY_STYLES[ann.priority] || PRIORITY_STYLES.NORMAL;
              return (
                <div
                  key={ann.id}
                  className={cn(
                    "rounded-lg border bg-white p-4 transition-colors",
                    !ann.isRead ? "border-[#2E86AB]/30 bg-[#F8FBFD]" : "border-[#E5E7EB]"
                  )}
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {ann.isPinned && <Pin className="h-3.5 w-3.5 text-[#2E86AB]" />}
                      <h4 className="text-sm font-medium text-[#1A1A1A]">{ann.title}</h4>
                      <Badge className={cn("text-[10px]", prStyle.bg, prStyle.text)}>
                        {ann.priority}
                      </Badge>
                      {ann.departmentName && (
                        <Badge variant="secondary" className="text-[10px]">{ann.departmentName}</Badge>
                      )}
                    </div>
                    {!ann.isRead && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-[#2E86AB]"
                        onClick={() => handleMarkRead(ann.id)}
                      >
                        <Check className="mr-1 h-3 w-3" />
                        Mark Read
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-[#6B7280] whitespace-pre-line">{ann.content}</p>
                  <div className="mt-3 flex items-center gap-3 text-[10px] text-[#9CA3AF]">
                    {ann.authorName && <span>By {ann.authorName}</span>}
                    <span>
                      {new Date(ann.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {ann.readCount} read
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

// ─── Feedback Tab ───────────────────────────────────────

function FeedbackTab() {
  const { data: session } = useSession();
  const [channels, setChannels] = useState<FeedbackChannel[]>([]);
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [submitFeedbackOpen, setSubmitFeedbackOpen] = useState(false);

  // Channel form
  const [chName, setChName] = useState("");
  const [chDesc, setChDesc] = useState("");
  const [chType, setChType] = useState("suggestion");
  const [chAnonymous, setChAnonymous] = useState(true);

  // Feedback form
  const [fbContent, setFbContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "HEAD_HR";

  const fetchChannels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/communication/feedback/channels");
      if (res.ok) {
        const data = await res.json();
        setChannels(data.data || data || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEntries = useCallback(async (channelId: string) => {
    const res = await fetch(`/api/communication/feedback/entries?channelId=${channelId}`);
    if (res.ok) {
      const data = await res.json();
      setEntries(data.data || data || []);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  useEffect(() => {
    if (selectedChannel) fetchEntries(selectedChannel);
  }, [selectedChannel, fetchEntries]);

  const handleCreateChannel = async () => {
    if (!chName) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/communication/feedback/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: chName, description: chDesc || null, type: chType, isAnonymous: chAnonymous }),
      });
      if (res.ok) {
        setChName("");
        setChDesc("");
        setChType("suggestion");
        setChAnonymous(true);
        setCreateChannelOpen(false);
        fetchChannels();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!fbContent || !selectedChannel) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/communication/feedback/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId: selectedChannel, content: fbContent }),
      });
      if (res.ok) {
        setFbContent("");
        setSubmitFeedbackOpen(false);
        fetchEntries(selectedChannel);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");

  const handleUpdateStatus = async (entryId: string, status: string) => {
    const res = await fetch(`/api/communication/feedback/entries/${entryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok && selectedChannel) fetchEntries(selectedChannel);
  };

  const handleRespond = async (entryId: string) => {
    if (!responseText.trim()) return;
    const res = await fetch(`/api/communication/feedback/entries/${entryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response: responseText.trim(), status: "acknowledged" }),
    });
    if (res.ok) {
      setRespondingTo(null);
      setResponseText("");
      if (selectedChannel) fetchEntries(selectedChannel);
    }
  };

  const handleUpvote = async (entryId: string) => {
    const res = await fetch(`/api/communication/feedback/entries/${entryId}`, {
      method: "POST",
    });
    if (res.ok && selectedChannel) fetchEntries(selectedChannel);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[#2E86AB]" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#1A1A1A]">Feedback Channels</h3>
          <p className="text-xs text-[#9CA3AF]">Share ideas, concerns, and suggestions</p>
        </div>
        {isAdmin && (
          <Button size="sm" variant="outline" onClick={() => setCreateChannelOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Channel
          </Button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Channel list */}
        <div className="space-y-2">
          {channels.length === 0 ? (
            <p className="py-8 text-center text-xs text-[#9CA3AF]">No channels yet</p>
          ) : (
            channels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setSelectedChannel(ch.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                  selectedChannel === ch.id
                    ? "border-[#2E86AB] bg-[#F8FBFD]"
                    : "border-[#E5E7EB] bg-white hover:border-[#2E86AB]/30"
                )}
              >
                <MessageSquare className={cn("h-4 w-4", selectedChannel === ch.id ? "text-[#2E86AB]" : "text-[#9CA3AF]")} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#1A1A1A]">{ch.name}</p>
                  <p className="text-[10px] text-[#9CA3AF] capitalize">{ch.type}</p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-[#9CA3AF]" />
              </button>
            ))
          )}
        </div>

        {/* Entries */}
        <div className="col-span-3">
          {!selectedChannel ? (
            <div className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-12 text-center text-sm text-[#9CA3AF]">
              Select a channel to view feedback
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-[#1A1A1A]">
                  {channels.find((c) => c.id === selectedChannel)?.name}
                </h4>
                <Button size="sm" onClick={() => setSubmitFeedbackOpen(true)}>
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  Submit Feedback
                </Button>
              </div>

              {entries.length === 0 ? (
                <div className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-8 text-center text-sm text-[#9CA3AF]">
                  No feedback yet. Be the first to share.
                </div>
              ) : (
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <div key={entry.id} className="rounded-lg border border-[#E5E7EB] bg-white p-4">
                      <p className="text-sm text-[#1A1A1A] whitespace-pre-line">{entry.content}</p>
                      {entry.response && (
                        <div className="mt-2 rounded-lg bg-[#F0F2F5] p-3">
                          <p className="text-xs font-medium text-[#2E86AB]">Response:</p>
                          <p className="text-sm text-[#6B7280]">{entry.response}</p>
                        </div>
                      )}
                      {/* Admin response form */}
                      {isAdmin && !entry.response && respondingTo === entry.id && (
                        <div className="mt-2 space-y-2">
                          <Textarea
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            placeholder="Write your response..."
                            rows={2}
                            className="text-sm"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleRespond(entry.id)} disabled={!responseText.trim()}>
                              Send Response
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => { setRespondingTo(null); setResponseText(""); }}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] text-[#9CA3AF]">
                          <Badge className={cn("text-[10px]", STATUS_COLORS[entry.status] || "")}>
                            {entry.status}
                          </Badge>
                          <span>
                            {new Date(entry.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric", month: "short",
                            })}
                          </span>
                          <button
                            onClick={() => handleUpvote(entry.id)}
                            className="flex items-center gap-0.5 hover:text-[#2E86AB] transition-colors"
                          >
                            <ThumbsUp className="h-3 w-3" /> {entry.upvotes}
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          {isAdmin && !entry.response && respondingTo !== entry.id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 text-[10px] text-[#2E86AB]"
                              onClick={() => { setRespondingTo(entry.id); setResponseText(""); }}
                            >
                              Reply
                            </Button>
                          )}
                          {isAdmin && entry.status !== "resolved" && (
                            <select
                              value={entry.status}
                              onChange={(e) => handleUpdateStatus(entry.id, e.target.value)}
                              className="rounded border border-[#E5E7EB] px-2 py-0.5 text-[10px]"
                            >
                              <option value="open">Open</option>
                              <option value="acknowledged">Acknowledged</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                              <option value="closed">Closed</option>
                            </select>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create channel dialog */}
      {createChannelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#1A1A1A]">New Feedback Channel</h3>
              <button onClick={() => setCreateChannelOpen(false)} className="text-[#9CA3AF] hover:text-[#6B7280]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <Input placeholder="Channel name *" value={chName} onChange={(e) => setChName(e.target.value)} />
              <Textarea placeholder="Description" value={chDesc} onChange={(e) => setChDesc(e.target.value)} rows={2} />
              <select
                value={chType}
                onChange={(e) => setChType(e.target.value)}
                className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm"
              >
                <option value="suggestion">Suggestion</option>
                <option value="concern">Concern</option>
                <option value="idea">Idea</option>
                <option value="general">General</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-[#6B7280]">
                <input
                  type="checkbox"
                  checked={chAnonymous}
                  onChange={(e) => setChAnonymous(e.target.checked)}
                  className="accent-[#2E86AB]"
                />
                Allow anonymous submissions
              </label>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateChannelOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateChannel} disabled={submitting || !chName}>
                  {submitting ? "Creating..." : "Create Channel"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit feedback dialog */}
      {submitFeedbackOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#1A1A1A]">Submit Feedback</h3>
              <button onClick={() => setSubmitFeedbackOpen(false)} className="text-[#9CA3AF] hover:text-[#6B7280]">
                <X className="h-5 w-5" />
              </button>
            </div>
            {channels.find((c) => c.id === selectedChannel)?.isAnonymous && (
              <p className="mb-3 rounded-lg bg-[#F0F2F5] px-3 py-2 text-xs text-[#6B7280]">
                This channel supports anonymous submissions. Your identity will not be recorded.
              </p>
            )}
            <Textarea
              placeholder="Share your feedback..."
              value={fbContent}
              onChange={(e) => setFbContent(e.target.value)}
              rows={4}
              className="mb-3"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSubmitFeedbackOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmitFeedback} disabled={submitting || !fbContent}>
                {submitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
