"use client";

import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarTask {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  priority: string;
}

const PRIORITY_DOT: Record<string, string> = {
  URGENT: "bg-[rgba(239,68,68,0.1)]0",
  HIGH: "bg-[rgba(249,115,22,0.1)]0",
  MEDIUM: "bg-[rgba(59,130,246,0.1)]0",
  LOW: "bg-gray-300",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<CalendarTask[]>([]);

  useEffect(() => {
    fetch("/api/tasks?limit=100")
      .then((r) => r.json())
      .then((json) => {
        const data = json.data ?? json;
        if (Array.isArray(data)) {
          setTasks(data.filter((t: CalendarTask) => t.dueDate));
        }
      });
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return days;
  }, [year, month]);

  const getTasksForDay = (day: number) => {
    return tasks.filter((t) => {
      const d = new Date(t.dueDate);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Calendar</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[160px] text-center text-sm font-medium text-[var(--text-primary)]">
            {MONTHS[month]} {year}
          </span>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        {/* Header */}
        <div className="grid grid-cols-7 border-b border-[var(--border-subtle)]">
          {DAYS.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-[var(--text-muted)]">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            const dayTasks = day ? getTasksForDay(day) : [];
            return (
              <div
                key={i}
                className={cn(
                  "min-h-[100px] border-b border-r border-[#F0F2F5] p-1.5",
                  !day && "bg-[#FAFAFA]"
                )}
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
                    <div className="mt-1 space-y-0.5">
                      {dayTasks.slice(0, 3).map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center gap-1 rounded px-1 py-0.5 text-[10px] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full", PRIORITY_DOT[t.priority])} />
                          <span className="truncate">{t.title}</span>
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <span className="pl-1 text-[10px] text-[var(--accent-primary)]">+{dayTasks.length - 3} more</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
