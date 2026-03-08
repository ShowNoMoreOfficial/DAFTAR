"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────

interface CalendarEntry {
  id: string;
  title: string;
  description: string | null;
  brandId: string;
  platform: string;
  deliverableType: string;
  date: string;
  assigneeId: string | null;
  status: string;
  postId: string | null;
}

// ─── Constants ──────────────────────────────────────────

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const PLATFORMS = [
  { value: "youtube", label: "YouTube", color: "bg-red-100 text-red-700" },
  { value: "x", label: "X", color: "bg-gray-100 text-gray-700" },
  { value: "instagram", label: "IG", color: "bg-pink-100 text-pink-700" },
  { value: "linkedin", label: "LI", color: "bg-blue-100 text-blue-700" },
  { value: "facebook", label: "FB", color: "bg-indigo-100 text-indigo-700" },
];

const DELIVERABLE_TYPES = [
  "video", "carousel", "reel", "thread", "post", "story", "short", "blog",
];

const STATUS_COLORS: Record<string, string> = {
  planned: "border-l-gray-400",
  in_progress: "border-l-blue-500",
  ready: "border-l-emerald-500",
  posted: "border-l-purple-500",
};

// ─── Component ──────────────────────────────────────────

export default function ContentCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDate, setCreateDate] = useState<string>("");

  // Create form
  const [formTitle, setFormTitle] = useState("");
  const [formBrandId, setFormBrandId] = useState("");
  const [formPlatform, setFormPlatform] = useState("youtube");
  const [formType, setFormType] = useState("video");
  const [formDate, setFormDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const start = new Date(year, month, 1).toISOString();
    const end = new Date(year, month + 1, 0).toISOString();
    try {
      const res = await fetch(`/api/relay/calendar?start=${start}&end=${end}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(Array.isArray(data) ? data : data.data || []);
      }
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchEntries();
    fetch("/api/brands")
      .then((r) => r.json())
      .then((d) => setBrands(Array.isArray(d) ? d : d.data || []))
      .catch(() => {});
  }, [fetchEntries]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [year, month]);

  const getEntriesForDay = (day: number) => {
    return entries.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const handleCreate = async () => {
    if (!formTitle || !formBrandId || !formDate) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/relay/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          brandId: formBrandId,
          platform: formPlatform,
          deliverableType: formType,
          date: new Date(formDate).toISOString(),
        }),
      });
      if (res.ok) {
        setFormTitle("");
        setFormBrandId("");
        setFormPlatform("youtube");
        setFormType("video");
        setFormDate("");
        setCreateOpen(false);
        fetchEntries();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openCreateForDate = (day: number) => {
    const d = new Date(year, month, day);
    setFormDate(d.toISOString().slice(0, 10));
    setCreateOpen(true);
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[160px] text-center text-sm font-semibold text-[#1A1A1A]">
            {MONTHS[month]} {year}
          </span>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Entry
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white">
        <div className="grid grid-cols-7 border-b border-[#E5E7EB]">
          {DAYS.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-[#9CA3AF]">{d}</div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-[#2E86AB]" />
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              const dayEntries = day ? getEntriesForDay(day) : [];
              return (
                <div
                  key={i}
                  className={cn(
                    "min-h-[110px] border-b border-r border-[#F0F2F5] p-1.5",
                    !day && "bg-[#FAFAFA]",
                    day && "cursor-pointer hover:bg-[#F8FBFD]"
                  )}
                  onDoubleClick={() => day && openCreateForDate(day)}
                >
                  {day && (
                    <>
                      <span
                        className={cn(
                          "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
                          isToday(day) ? "bg-[#2E86AB] font-bold text-white" : "text-[#6B7280]"
                        )}
                      >
                        {day}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {dayEntries.slice(0, 3).map((entry) => {
                          const platformCfg = PLATFORMS.find((p) => p.value === entry.platform);
                          return (
                            <div
                              key={entry.id}
                              className={cn(
                                "flex items-center gap-1 rounded border-l-2 px-1 py-0.5 text-[10px] text-[#6B7280] hover:bg-[#F0F2F5]",
                                STATUS_COLORS[entry.status] || "border-l-gray-300"
                              )}
                            >
                              {platformCfg && (
                                <span className={cn("rounded px-1 py-0 text-[8px] font-bold", platformCfg.color)}>
                                  {platformCfg.label}
                                </span>
                              )}
                              <span className="truncate">{entry.title}</span>
                            </div>
                          );
                        })}
                        {dayEntries.length > 3 && (
                          <span className="pl-1 text-[10px] text-[#2E86AB]">
                            +{dayEntries.length - 3} more
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create dialog */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#1A1A1A]">Add Calendar Entry</h3>
              <button onClick={() => setCreateOpen(false)} className="text-[#9CA3AF] hover:text-[#6B7280]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <Input placeholder="Title *" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
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
                <select
                  value={formPlatform}
                  onChange={(e) => setFormPlatform(e.target.value)}
                  className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm"
                >
                  {DELIVERABLE_TYPES.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={submitting || !formTitle || !formBrandId || !formDate}>
                  {submitting ? "Adding..." : "Add Entry"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
