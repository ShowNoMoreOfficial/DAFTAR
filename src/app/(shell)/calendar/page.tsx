"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Calendar as CalendarIcon,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

// ─── Types ───────────────────────────────────────────────

interface CalendarItem {
  id: string;
  source: "post" | "calendar" | "deliverable";
  title: string;
  platform: string;
  status: string; // draft | review | approved | published | failed | killed
  date: string;
  brandName: string;
  brandId: string;
  pipelineType?: string;
  deliverableType?: string;
}

type ViewMode = "month" | "week";

// ─── Constants ──────────────────────────────────────────

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const PLATFORM_COLOR: Record<string, string> = {
  youtube: "#FF0000",
  x: "#000000",
  instagram: "#E4405F",
  linkedin: "#0A66C2",
  facebook: "#1877F2",
  blog: "#F97316",
};

const PLATFORM_LABEL: Record<string, string> = {
  youtube: "YouTube",
  x: "X",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  blog: "Blog",
};

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  draft:     { bg: "bg-gray-100",           text: "text-gray-600",    label: "Draft" },
  review:    { bg: "bg-amber-50",           text: "text-amber-700",   label: "Review" },
  approved:  { bg: "bg-blue-50",            text: "text-blue-700",    label: "Approved" },
  published: { bg: "bg-emerald-50",         text: "text-emerald-700", label: "Published" },
  failed:    { bg: "bg-red-50",             text: "text-red-700",     label: "Failed" },
  killed:    { bg: "bg-gray-100",           text: "text-gray-400",    label: "Killed" },
};

// ─── Helpers ────────────────────────────────────────────

function getWeekDates(date: Date): Date[] {
  const day = date.getDay();
  const start = new Date(date);
  start.setDate(start.getDate() - day);
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// ─── Component ──────────────────────────────────────────

export default function UnifiedCalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewMode>("month");
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/calendar?month=${month + 1}&year=${year}`);
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data.items) ? data.items : []);
      }
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Month grid
  const monthDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  }, [year, month]);

  // Week dates
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  const getItemsForDay = useCallback(
    (date: Date) => items.filter((item) => sameDay(new Date(item.date), date)),
    [items],
  );

  const today = new Date();

  const navigatePrev = () => {
    if (view === "month") {
      setCurrentDate(new Date(year, month - 1, 1));
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    }
  };

  const navigateNext = () => {
    if (view === "month") {
      setCurrentDate(new Date(year, month + 1, 1));
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    }
  };

  const handleItemClick = (item: CalendarItem) => {
    if (item.source === "deliverable") {
      router.push(`/pipeline?id=${item.id}`);
    } else if (item.source === "post") {
      router.push(`/relay/posts?id=${item.id}`);
    }
  };

  const selectedDayItems = selectedDay ? getItemsForDay(selectedDay) : [];

  // ─── Item Row ──────────────────────────────────────────
  const ItemRow = ({ item, compact = false }: { item: CalendarItem; compact?: boolean }) => {
    const platformColor = PLATFORM_COLOR[item.platform] || "#9CA3AF";
    const badge = STATUS_BADGE[item.status] || STATUS_BADGE.draft;

    if (compact) {
      return (
        <button
          onClick={(e) => { e.stopPropagation(); handleItemClick(item); }}
          className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-[10px] hover:bg-[var(--bg-elevated)] transition-colors"
        >
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: platformColor }} />
          <span className="truncate text-[var(--text-secondary)]">{item.title}</span>
        </button>
      );
    }

    return (
      <button
        onClick={() => handleItemClick(item)}
        className="flex w-full items-start gap-2 rounded-lg border border-[var(--border-subtle)] p-2.5 text-left hover:border-[var(--accent-primary)]/30 transition-colors"
      >
        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: platformColor }} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[var(--text-primary)]">{item.title}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[10px] text-[var(--text-muted)]">
              {PLATFORM_LABEL[item.platform] || item.platform}
            </span>
            {item.brandName && (
              <span className="text-[10px] text-[var(--text-muted)]">{item.brandName}</span>
            )}
            <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-medium", badge.bg, badge.text)}>
              {badge.label}
            </span>
          </div>
          <span className="text-[10px] text-[var(--text-muted)]">
            {new Date(item.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </button>
    );
  };

  // ─── Day Cell (Month View) ────────────────────────────
  const DayCell = ({ date }: { date: Date | null }) => {
    if (!date) return <div className="min-h-[100px] border-b border-r border-[#F0F2F5] bg-[#FAFAFA]" />;

    const dayItems = getItemsForDay(date);
    const isSelected = selectedDay && sameDay(selectedDay, date);
    const isTodayCell = sameDay(date, today);

    return (
      <div
        className={cn(
          "min-h-[100px] border-b border-r border-[#F0F2F5] p-1.5 cursor-pointer hover:bg-[#F8FBFD] transition-colors",
          isSelected && "bg-[#F0F8FF] ring-1 ring-inset ring-[#2E86AB]/30",
        )}
        onClick={() => setSelectedDay(isSelected ? null : date)}
      >
        <span
          className={cn(
            "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
            isTodayCell ? "bg-[var(--accent-primary)] font-bold text-white" : "text-[var(--text-secondary)]",
          )}
        >
          {date.getDate()}
        </span>
        {dayItems.length > 0 && (
          <div className="mt-1 space-y-0.5">
            {dayItems.slice(0, 3).map((item) => (
              <ItemRow key={item.id + item.source} item={item} compact />
            ))}
            {dayItems.length > 3 && (
              <span className="pl-1 text-[10px] text-[var(--accent-primary)]">+{dayItems.length - 3} more</span>
            )}
          </div>
        )}
      </div>
    );
  };

  // ─── Week Column ──────────────────────────────────────
  const WeekColumn = ({ date }: { date: Date }) => {
    const dayItems = getItemsForDay(date);
    const isTodayCell = sameDay(date, today);

    return (
      <div className="flex-1 border-r border-[#F0F2F5] last:border-r-0">
        <div className={cn("border-b border-[#F0F2F5] p-2 text-center", isTodayCell && "bg-[#F0F8FF]")}>
          <div className="text-[10px] font-medium text-[var(--text-muted)] uppercase">{DAYS[date.getDay()]}</div>
          <div
            className={cn(
              "mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm",
              isTodayCell ? "bg-[var(--accent-primary)] font-bold text-white" : "text-[var(--text-primary)]",
            )}
          >
            {date.getDate()}
          </div>
        </div>
        <div className="space-y-1.5 p-2" style={{ minHeight: 300 }}>
          {dayItems.map((item) => (
            <ItemRow key={item.id + item.source} item={item} />
          ))}
          {dayItems.length === 0 && (
            <p className="pt-8 text-center text-[10px] text-[var(--text-muted)]">No content</p>
          )}
        </div>
      </div>
    );
  };

  // ─── Header ───────────────────────────────────────────
  const headerLabel = view === "month"
    ? `${MONTHS[month]} ${year}`
    : `${weekDates[0].toLocaleDateString("en-IN", { month: "short", day: "numeric" })} – ${weekDates[6].toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <div className="flex h-full">
      {/* Main area */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={navigatePrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[200px] text-center text-sm font-semibold text-[var(--text-primary)]">
              {headerLabel}
            </span>
            <Button variant="outline" size="sm" onClick={navigateNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
          </div>

          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            <button
              className={cn(
                "flex items-center gap-1.5 rounded-l-lg px-3 py-1.5 text-xs font-medium transition-colors",
                view === "month" ? "bg-[var(--accent-primary)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]",
              )}
              onClick={() => setView("month")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Month
            </button>
            <button
              className={cn(
                "flex items-center gap-1.5 rounded-r-lg px-3 py-1.5 text-xs font-medium transition-colors",
                view === "week" ? "bg-[var(--accent-primary)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]",
              )}
              onClick={() => setView("week")}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              Week
            </button>
          </div>
        </div>

        {/* Platform legend */}
        <div className="mb-3 flex flex-wrap items-center gap-4">
          {Object.entries(PLATFORM_COLOR).map(([platform, color]) => (
            <div key={platform} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-[var(--text-secondary)]">{PLATFORM_LABEL[platform] || platform}</span>
            </div>
          ))}
          <div className="ml-auto flex items-center gap-3">
            {Object.values(STATUS_BADGE).map((b) => (
              <span key={b.label} className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", b.bg, b.text)}>
                {b.label}
              </span>
            ))}
          </div>
        </div>

        {/* Calendar body */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-primary)]" />
          </div>
        ) : view === "month" ? (
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            <div className="grid grid-cols-7 border-b border-[var(--border-subtle)]">
              {DAYS.map((d) => (
                <div key={d} className="py-2 text-center text-xs font-medium text-[var(--text-muted)]">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {monthDays.map((date, i) => (
                <DayCell key={i} date={date} />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            {weekDates.map((date) => (
              <WeekColumn key={date.toISOString()} date={date} />
            ))}
          </div>
        )}

        {/* Content Schedule summary */}
        <div className="mt-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Content Schedule</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Total this month", value: items.length },
              { label: "Published", value: items.filter((i) => i.status === "published").length },
              { label: "In Review", value: items.filter((i) => i.status === "review").length },
              { label: "Drafts", value: items.filter((i) => i.status === "draft").length },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg bg-[var(--bg-elevated)] p-3 text-center">
                <div className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</div>
                <div className="mt-0.5 text-[10px] text-[var(--text-muted)]">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Per-platform breakdown */}
          <div className="mt-3 flex flex-wrap gap-3">
            {Object.entries(PLATFORM_COLOR).map(([platform, color]) => {
              const count = items.filter((i) => i.platform === platform).length;
              if (count === 0) return null;
              return (
                <div key={platform} className="flex items-center gap-1.5 rounded-full bg-[var(--bg-elevated)] px-2.5 py-1">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-xs text-[var(--text-secondary)]">{PLATFORM_LABEL[platform]}</span>
                  <span className="text-xs font-semibold text-[var(--text-primary)]">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Side panel for selected day (month view) */}
      {view === "month" && selectedDay && (
        <div className="w-80 shrink-0 border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 overflow-y-auto">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {selectedDay.toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}
            </h3>
            <button onClick={() => setSelectedDay(null)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
              <X className="h-4 w-4" />
            </button>
          </div>

          {selectedDayItems.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)]">No content for this day.</p>
          ) : (
            <div className="space-y-2">
              {selectedDayItems.map((item) => (
                <ItemRow key={item.id + item.source} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
