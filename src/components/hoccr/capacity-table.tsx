"use client";

import { cn } from "@/lib/utils";
import { Users } from "lucide-react";

export interface CapacityRow {
  id: string;
  name: string;
  department: string;
  capacityPct: number;
  openTasks: number;
}

interface CapacityTableProps {
  rows: CapacityRow[];
  className?: string;
}

function getBarColor(pct: number): string {
  if (pct > 90) return "bg-[rgba(239,68,68,0.1)]0";
  if (pct > 70) return "bg-[rgba(234,179,8,0.1)]0";
  if (pct >= 40) return "bg-[rgba(16,185,129,0.1)]0";
  return "bg-sky-400";
}

function getTextColor(pct: number): string {
  if (pct > 90) return "text-red-600";
  if (pct > 70) return "text-yellow-600";
  return "text-[var(--text-secondary)]";
}

export function CapacityTable({ rows, className }: CapacityTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-8 text-center text-sm text-[var(--text-muted)]">
        No employee capacity data available
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]",
        className
      )}
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            <th className="px-4 py-2.5 text-left font-medium text-[var(--text-secondary)]">
              Employee
            </th>
            <th className="px-4 py-2.5 text-left font-medium text-[var(--text-secondary)]">
              Department
            </th>
            <th className="w-[280px] px-4 py-2.5 text-left font-medium text-[var(--text-secondary)]">
              Capacity %
            </th>
            <th className="px-4 py-2.5 text-center font-medium text-[var(--text-secondary)]">
              Open Tasks
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-surface)] transition-colors"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-primary)]/10 text-xs font-medium text-[var(--accent-primary)]">
                    {row.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <span className="font-medium text-[var(--text-primary)]">
                    {row.name}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-[var(--text-secondary)]">{row.department}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="h-2.5 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          getBarColor(row.capacityPct)
                        )}
                        style={{
                          width: `${Math.min(row.capacityPct, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span
                    className={cn(
                      "w-10 text-right text-xs font-medium",
                      getTextColor(row.capacityPct)
                    )}
                  >
                    {row.capacityPct}%
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-center">
                <span
                  className={cn(
                    "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-medium",
                    row.openTasks > 5
                      ? "bg-[rgba(239,68,68,0.15)] text-red-700"
                      : row.openTasks > 3
                      ? "bg-[rgba(234,179,8,0.15)] text-yellow-700"
                      : "bg-[rgba(16,185,129,0.15)] text-emerald-700"
                  )}
                >
                  {row.openTasks}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2 text-[10px] text-[var(--text-muted)]">
        <Users className="h-3 w-3" />
        <span>{rows.length} employees</span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-[rgba(16,185,129,0.1)]0" />
          40–70%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-[rgba(234,179,8,0.1)]0" />
          71–90%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-[rgba(239,68,68,0.1)]0" />
          &gt;90%
        </span>
      </div>
    </div>
  );
}
