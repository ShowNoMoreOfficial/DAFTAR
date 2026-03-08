"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface TierAssignment {
  id: string;
  actionType: string;
  tier: number;
}

const TIER_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Inform", color: "bg-blue-100 text-blue-700" },
  2: { label: "Suggest", color: "bg-amber-100 text-amber-700" },
  3: { label: "Act & Notify", color: "bg-green-100 text-green-700" },
  4: { label: "Act Silently", color: "bg-purple-100 text-purple-700" },
};

export default function GIConfigPage() {
  const [tiers, setTiers] = useState<TierAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gi/tiers")
      .then((r) => r.json())
      .then(setTiers)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#1A1A1A]">GI Configuration</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Configure the GI copilot&apos;s autonomy levels for different action types.
        </p>
      </div>

      <div className="rounded-xl border border-[#E5E7EB] bg-white">
        <div className="border-b border-[#E5E7EB] p-4">
          <h2 className="text-sm font-medium text-[#1A1A1A]">Tier Assignments</h2>
          <p className="mt-1 text-xs text-[#6B7280]">
            Tier 1: Inform only | Tier 2: Suggest with approval | Tier 3: Act & notify | Tier 4: Act silently
          </p>
        </div>

        {loading ? (
          <p className="p-6 text-sm text-[#9CA3AF]">Loading...</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-left text-xs font-medium uppercase tracking-wider text-[#6B7280]">
                <th className="px-6 py-3">Action Type</th>
                <th className="px-6 py-3">Tier</th>
                <th className="px-6 py-3">Behavior</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {tiers.map((t) => {
                const tierInfo = TIER_LABELS[t.tier] || TIER_LABELS[1];
                return (
                  <tr key={t.id} className="hover:bg-[#F8F9FA]">
                    <td className="px-6 py-4 text-sm font-medium text-[#1A1A1A]">
                      {t.actionType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={tierInfo.color} variant="secondary">
                        Tier {t.tier}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6B7280]">
                      {tierInfo.label}
                    </td>
                  </tr>
                );
              })}
              {tiers.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-sm text-[#9CA3AF]">
                    No tier assignments configured. Run the seed script to populate defaults.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
