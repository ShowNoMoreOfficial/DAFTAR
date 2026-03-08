"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface TierAssignment {
  id: string;
  actionType: string;
  tier: number;
}

const TIER_OPTIONS = [
  { value: 1, label: "Tier 1 — Inform", description: "Observes and reports" },
  { value: 2, label: "Tier 2 — Suggest", description: "Proposes with one-tap approve" },
  { value: 3, label: "Tier 3 — Act & Notify", description: "Acts automatically, reports after" },
  { value: 4, label: "Tier 4 — Act Silently", description: "Handles without notification" },
];

const TIER_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Inform", color: "bg-blue-100 text-blue-700" },
  2: { label: "Suggest", color: "bg-amber-100 text-amber-700" },
  3: { label: "Act & Notify", color: "bg-green-100 text-green-700" },
  4: { label: "Act Silently", color: "bg-purple-100 text-purple-700" },
};

interface BoundarySettings {
  maxAutoActionsPerHour: number;
  requireApprovalAboveTier: number;
  allowWeekendActions: boolean;
  allowAfterHoursActions: boolean;
  maxTaskReassignmentsPerDay: number;
}

type PriorityKey = "speed" | "quality" | "morale";

export default function GIConfigPage() {
  const [tiers, setTiers] = useState<TierAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const [boundaries, setBoundaries] = useState<BoundarySettings>({
    maxAutoActionsPerHour: 10,
    requireApprovalAboveTier: 2,
    allowWeekendActions: false,
    allowAfterHoursActions: false,
    maxTaskReassignmentsPerDay: 5,
  });

  const [priorities, setPriorities] = useState<Record<PriorityKey, number>>({
    speed: 50,
    quality: 70,
    morale: 60,
  });

  useEffect(() => {
    fetch("/api/gi/tiers")
      .then((r) => r.json())
      .then(setTiers)
      .finally(() => setLoading(false));
  }, []);

  async function handleTierChange(id: string, newTier: number) {
    setSaving(id);
    try {
      const res = await fetch("/api/gi/tiers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, tier: newTier }),
      });
      if (res.ok) {
        setTiers((prev) => prev.map((t) => (t.id === id ? { ...t, tier: newTier } : t)));
      }
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[#1A1A1A]">GI Configuration</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Configure autonomy levels, behavioral boundaries, and priorities for the GI copilot.
        </p>
      </div>

      {/* Autonomy Tier Assignments */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
        <div className="border-b border-[#E5E7EB] p-4">
          <h2 className="text-sm font-medium text-[#1A1A1A]">Autonomy Tier Assignments</h2>
          <p className="mt-1 text-xs text-[#6B7280]">
            Control how much autonomy GI has for each action type.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {TIER_OPTIONS.map((opt) => {
              const info = TIER_LABELS[opt.value];
              return (
                <span key={opt.value} className="inline-flex items-center gap-1 text-xs text-[#9CA3AF]">
                  <span className={`inline-block h-2 w-2 rounded-full ${info.color.split(" ")[0]}`} />
                  {opt.label}
                </span>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-left text-xs font-medium uppercase tracking-wider text-[#6B7280]">
                <th className="px-6 py-3">Action Type</th>
                <th className="px-6 py-3">Current Tier</th>
                <th className="px-6 py-3">Behavior</th>
                <th className="px-6 py-3">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {tiers.map((t) => {
                const tierInfo = TIER_LABELS[t.tier] || TIER_LABELS[1];
                return (
                  <tr key={t.id} className="hover:bg-[#F8F9FA] transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-[#1A1A1A]">
                      {t.actionType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={tierInfo.color} variant="secondary">
                        Tier {t.tier}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6B7280]">{tierInfo.label}</td>
                    <td className="px-6 py-4">
                      <select
                        value={t.tier}
                        onChange={(e) => handleTierChange(t.id, parseInt(e.target.value))}
                        disabled={saving === t.id}
                        className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs text-[#1A1A1A] focus:border-[#2E86AB] focus:outline-none focus:ring-1 focus:ring-[#2E86AB] disabled:opacity-50"
                      >
                        {TIER_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {saving === t.id && (
                        <span className="ml-2 text-xs text-[#9CA3AF]">Saving...</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {tiers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-[#9CA3AF]">
                    No tier assignments configured. Run the seed script to populate defaults.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Behavioral Boundaries */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
        <div className="border-b border-[#E5E7EB] p-4">
          <h2 className="text-sm font-medium text-[#1A1A1A]">Behavioral Boundaries</h2>
          <p className="mt-1 text-xs text-[#6B7280]">
            Set guardrails for GI autonomous behavior.
          </p>
        </div>
        <div className="divide-y divide-[#E5E7EB]">
          {/* Max auto actions per hour */}
          <div className="flex items-center justify-between p-4 hover:bg-[#F8F9FA]">
            <div>
              <p className="text-sm font-medium text-[#1A1A1A]">Max auto-actions per hour</p>
              <p className="text-xs text-[#9CA3AF]">Limit how many autonomous actions GI can execute per hour</p>
            </div>
            <input
              type="number"
              min={1}
              max={100}
              value={boundaries.maxAutoActionsPerHour}
              onChange={(e) =>
                setBoundaries((b) => ({ ...b, maxAutoActionsPerHour: parseInt(e.target.value) || 1 }))
              }
              className="w-20 rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-sm text-center text-[#1A1A1A] focus:border-[#2E86AB] focus:outline-none focus:ring-1 focus:ring-[#2E86AB]"
            />
          </div>

          {/* Require approval above tier */}
          <div className="flex items-center justify-between p-4 hover:bg-[#F8F9FA]">
            <div>
              <p className="text-sm font-medium text-[#1A1A1A]">Require approval above tier</p>
              <p className="text-xs text-[#9CA3AF]">Force manual approval for actions beyond this tier level</p>
            </div>
            <select
              value={boundaries.requireApprovalAboveTier}
              onChange={(e) =>
                setBoundaries((b) => ({ ...b, requireApprovalAboveTier: parseInt(e.target.value) }))
              }
              className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm text-[#1A1A1A] focus:border-[#2E86AB] focus:outline-none focus:ring-1 focus:ring-[#2E86AB]"
            >
              {TIER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Max task reassignments per day */}
          <div className="flex items-center justify-between p-4 hover:bg-[#F8F9FA]">
            <div>
              <p className="text-sm font-medium text-[#1A1A1A]">Max task reassignments per day</p>
              <p className="text-xs text-[#9CA3AF]">Limit daily task reassignment actions</p>
            </div>
            <input
              type="number"
              min={0}
              max={50}
              value={boundaries.maxTaskReassignmentsPerDay}
              onChange={(e) =>
                setBoundaries((b) => ({
                  ...b,
                  maxTaskReassignmentsPerDay: parseInt(e.target.value) || 0,
                }))
              }
              className="w-20 rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-sm text-center text-[#1A1A1A] focus:border-[#2E86AB] focus:outline-none focus:ring-1 focus:ring-[#2E86AB]"
            />
          </div>

          {/* Weekend actions toggle */}
          <div className="flex items-center justify-between p-4 hover:bg-[#F8F9FA]">
            <div>
              <p className="text-sm font-medium text-[#1A1A1A]">Allow weekend actions</p>
              <p className="text-xs text-[#9CA3AF]">Allow GI to take autonomous actions on weekends</p>
            </div>
            <button
              onClick={() => setBoundaries((b) => ({ ...b, allowWeekendActions: !b.allowWeekendActions }))}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:ring-offset-2 ${
                boundaries.allowWeekendActions ? "bg-[#2E86AB]" : "bg-gray-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  boundaries.allowWeekendActions ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* After hours toggle */}
          <div className="flex items-center justify-between p-4 hover:bg-[#F8F9FA]">
            <div>
              <p className="text-sm font-medium text-[#1A1A1A]">Allow after-hours actions</p>
              <p className="text-xs text-[#9CA3AF]">Allow GI to take autonomous actions outside business hours</p>
            </div>
            <button
              onClick={() =>
                setBoundaries((b) => ({ ...b, allowAfterHoursActions: !b.allowAfterHoursActions }))
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:ring-offset-2 ${
                boundaries.allowAfterHoursActions ? "bg-[#2E86AB]" : "bg-gray-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  boundaries.allowAfterHoursActions ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Personality / Priority Sliders */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
        <div className="border-b border-[#E5E7EB] p-4">
          <h2 className="text-sm font-medium text-[#1A1A1A]">Priority Tuning</h2>
          <p className="mt-1 text-xs text-[#6B7280]">
            Adjust how GI weighs competing concerns when making decisions.
          </p>
        </div>
        <div className="divide-y divide-[#E5E7EB]">
          {(Object.keys(priorities) as PriorityKey[]).map((key) => {
            const labels: Record<PriorityKey, { title: string; low: string; high: string; color: string }> = {
              speed: {
                title: "Speed vs Thoroughness",
                low: "Thorough",
                high: "Fast",
                color: "#2E86AB",
              },
              quality: {
                title: "Quality vs Velocity",
                low: "Ship fast",
                high: "High quality",
                color: "#A23B72",
              },
              morale: {
                title: "Morale Sensitivity",
                low: "Task-focused",
                high: "People-first",
                color: "#2E86AB",
              },
            };
            const label = labels[key];
            return (
              <div key={key} className="p-4 hover:bg-[#F8F9FA]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-[#1A1A1A]">{label.title}</p>
                  <span className="text-xs font-medium text-[#6B7280]">{priorities[key]}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#9CA3AF] w-20 text-right shrink-0">{label.low}</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={priorities[key]}
                    onChange={(e) =>
                      setPriorities((p) => ({ ...p, [key]: parseInt(e.target.value) }))
                    }
                    className="flex-1 h-2 rounded-full appearance-none bg-gray-200 accent-[var(--accent)]"
                    style={{ "--accent": label.color } as React.CSSProperties}
                  />
                  <span className="text-xs text-[#9CA3AF] w-20 shrink-0">{label.high}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button className="rounded-lg bg-[#2E86AB] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#2E86AB]/90 transition-colors shadow-sm">
          Save Configuration
        </button>
      </div>
    </div>
  );
}
