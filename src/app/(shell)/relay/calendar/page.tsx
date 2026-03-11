"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────

interface CalendarPost {
  id: string;
  title: string;
  platform: string;
  status: string;
  date: string;
  brandId: string;
  brandName: string;
}

// ─── Constants ──────────────────────────────────────────

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const PLATFORM_DOTS: Record<string, string> = {
  youtube: "bg-[#FF0000]",
  x: "bg-[#000000]",
  instagram: "bg-[#E4405F]",
  linkedin: "bg-[#0A66C2]",
  facebook: "bg-[#1877F2]",
};

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  x: "X",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  facebook: "Facebook",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "border-l-gray-400",
  SCHEDULED: "border-l-blue-500",
  PUBLISHING: "border-l-yellow-500",
  PUBLISHED: "border-l-emerald-500",
  FAILED: "border-l-red-500",
  CANCELLED: "border-l-gray-300",
};

// ─── Component ──────────────────────────────────────────

export default function RelayCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<CalendarPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/relay/calendar?month=${month + 1}&year=${year}`);
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

  const selectedDayEntries = selectedDay ? getEntriesForDay(selectedDay) : [];

  return (
    <div className="flex h-full">
      {/* Calendar grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[160px] text-center text-sm font-semibold text-[var(--text-primary)]">
              {MONTHS[month]} {year}
            </span>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
          </div>
          <Button size="sm" onClick={() => window.location.href = "/relay/posts"}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Schedule Post
          </Button>
        </div>

        {/* Platform legend */}
        <div className="mb-3 flex items-center gap-4">
          {Object.entries(PLATFORM_DOTS).map(([platform, color]) => (
            <div key={platform} className="flex items-center gap-1.5">
              <div className={cn("h-2.5 w-2.5 rounded-full", color)} />
              <span className="text-xs text-[var(--text-secondary)]">{PLATFORM_LABELS[platform]}</span>
            </div>
          ))}
        </div>

        {/* Calendar */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <div className="grid grid-cols-7 border-b border-[var(--border-subtle)]">
            {DAYS.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-medium text-[var(--text-muted)]">{d}</div>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-primary)]" />
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {calendarDays.map((day, i) => {
                const dayEntries = day ? getEntriesForDay(day) : [];
                const isSelected = selectedDay === day;
                return (
                  <div
                    key={i}
                    className={cn(
                      "min-h-[110px] border-b border-r border-[#F0F2F5] p-1.5",
                      !day && "bg-[#FAFAFA]",
                      day && "cursor-pointer hover:bg-[#F8FBFD]",
                      isSelected && "bg-[#F0F8FF] ring-1 ring-inset ring-[#2E86AB]/30"
                    )}
                    onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
                  >
                    {day && (
                      <>
                        <span
                          className={cn(
                            "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
                            isToday(day) ? "bg-[var(--accent-primary)] font-bold text-white" : "text-[var(--text-secondary)]"
                          )}
                        >
                          {day}
                        </span>
                        {/* Platform dots */}
                        {dayEntries.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {dayEntries.slice(0, 6).map((entry) => (
                              <div
                                key={entry.id}
                                className={cn(
                                  "h-2 w-2 rounded-full",
                                  PLATFORM_DOTS[entry.platform] || "bg-gray-400"
                                )}
                                title={`${entry.title} (${PLATFORM_LABELS[entry.platform] || entry.platform})`}
                              />
                            ))}
                            {dayEntries.length > 6 && (
                              <span className="text-[9px] text-[var(--text-muted)]">+{dayEntries.length - 6}</span>
                            )}
                          </div>
                        )}
                        {/* Entry titles */}
                        <div className="mt-0.5 space-y-0.5">
                          {dayEntries.slice(0, 2).map((entry) => (
                            <div
                              key={entry.id}
                              className={cn(
                                "truncate rounded border-l-2 px-1 py-0.5 text-[10px] text-[var(--text-secondary)]",
                                STATUS_COLORS[entry.status] || "border-l-gray-300"
                              )}
                            >
                              {entry.title}
                            </div>
                          ))}
                          {dayEntries.length > 2 && (
                            <span className="pl-1 text-[10px] text-[var(--accent-primary)]">
                              +{dayEntries.length - 2} more
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
      </div>

      {/* Side panel for selected day */}
      {selectedDay !== null && (
        <div className="w-80 border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 overflow-y-auto">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {MONTHS[month]} {selectedDay}, {year}
            </h3>
            <button onClick={() => setSelectedDay(null)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
              <X className="h-4 w-4" />
            </button>
          </div>

          {selectedDayEntries.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)]">No posts for this day.</p>
          ) : (
            <div className="space-y-3">
              {selectedDayEntries.map((entry) => (
                <div
                  key={entry.id}
                  className={cn(
                    "rounded-lg border border-[var(--border-subtle)] p-3 border-l-4",
                    STATUS_COLORS[entry.status] || "border-l-gray-300"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={cn("h-2.5 w-2.5 rounded-full", PLATFORM_DOTS[entry.platform] || "bg-gray-400")} />
                    <span className="text-[10px] font-medium text-[var(--text-secondary)] uppercase">
                      {PLATFORM_LABELS[entry.platform] || entry.platform}
                    </span>
                    <span className={cn(
                      "ml-auto rounded px-1.5 py-0.5 text-[9px] font-medium",
                      entry.status === "PUBLISHED" ? "bg-[rgba(16,185,129,0.15)] text-emerald-700" :
                      entry.status === "SCHEDULED" ? "bg-[rgba(59,130,246,0.15)] text-blue-700" :
                      entry.status === "DRAFT" ? "bg-[var(--bg-elevated)] text-gray-600" :
                      entry.status === "FAILED" ? "bg-[rgba(239,68,68,0.15)] text-red-700" :
                      "bg-[var(--bg-elevated)] text-gray-600"
                    )}>
                      {entry.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{entry.title}</p>
                  <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">{entry.brandName}</p>
                  <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                    {new Date(entry.date).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
