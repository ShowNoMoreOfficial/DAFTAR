"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Flame, Target, Star, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  rank: number;
  user: {
    id: string;
    name: string;
    avatar: string | null;
    role: string;
    department: string | null;
  };
  points: number;
  tasksCompleted: number;
  onTimeTasks: number;
  streak: number;
  credibilityScore: number;
}

const RANK_STYLES: Record<number, { bg: string; text: string; icon: React.ReactNode }> = {
  1: { bg: "bg-yellow-50 border-yellow-300", text: "text-yellow-700", icon: <Trophy className="h-5 w-5 text-yellow-500" /> },
  2: { bg: "bg-gray-50 border-gray-300", text: "text-gray-600", icon: <Medal className="h-5 w-5 text-gray-400" /> },
  3: { bg: "bg-orange-50 border-orange-300", text: "text-orange-700", icon: <Medal className="h-5 w-5 text-orange-400" /> },
};

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?period=${period}`)
      .then((r) => r.json())
      .then((d) => setEntries(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1A1A1A]">Leaderboard</h1>
          <p className="text-sm text-[#9CA3AF]">Team performance rankings by weighted task completion</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-[#E5E7EB] bg-white p-0.5">
          {[
            { label: "7 Days", value: "7" },
            { label: "30 Days", value: "30" },
            { label: "90 Days", value: "90" },
          ].map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                period === p.value ? "bg-[#2E86AB] text-white" : "text-[#6B7280] hover:bg-[#F0F2F5]"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 podium */}
      {entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-4">
          {[entries[1], entries[0], entries[2]].map((entry, i) => {
            const actualRank = [2, 1, 3][i];
            const style = RANK_STYLES[actualRank];
            return (
              <div
                key={entry.user.id}
                className={cn(
                  "flex flex-col items-center rounded-xl border-2 p-6",
                  style.bg,
                  actualRank === 1 && "scale-105 shadow-lg"
                )}
              >
                {style.icon}
                <Avatar className="mt-3 h-14 w-14">
                  <AvatarImage src={entry.user.avatar || undefined} />
                  <AvatarFallback className="bg-[#2E86AB] text-lg text-white">
                    {entry.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <p className={cn("mt-2 text-sm font-semibold", style.text)}>{entry.user.name}</p>
                <p className="text-[10px] text-[#9CA3AF]">{entry.user.department || entry.user.role}</p>
                <p className="mt-2 text-2xl font-bold text-[#1A1A1A]">{entry.points}</p>
                <p className="text-[10px] text-[#9CA3AF]">points</p>
                <div className="mt-2 flex items-center gap-2">
                  {entry.streak > 0 && (
                    <Badge className="bg-orange-100 text-orange-700 text-[10px]">
                      <Flame className="mr-0.5 h-3 w-3" /> {entry.streak}d
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-[10px]">
                    {entry.tasksCompleted} tasks
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full list */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white">
        <div className="border-b border-[#E5E7EB] px-4 py-3">
          <h3 className="text-sm font-semibold text-[#1A1A1A]">Full Rankings</h3>
        </div>

        {loading ? (
          <p className="py-12 text-center text-sm text-[#9CA3AF]">Loading leaderboard...</p>
        ) : entries.length === 0 ? (
          <p className="py-12 text-center text-sm text-[#9CA3AF]">
            No completed tasks in this period. Complete tasks to appear on the leaderboard.
          </p>
        ) : (
          <div className="divide-y divide-[#F0F2F5]">
            {entries.map((entry) => (
              <div key={entry.user.id} className="flex items-center gap-4 px-4 py-3">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                    entry.rank <= 3
                      ? "bg-[#2E86AB] text-white"
                      : "bg-[#F0F2F5] text-[#6B7280]"
                  )}
                >
                  {entry.rank}
                </span>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={entry.user.avatar || undefined} />
                  <AvatarFallback className="bg-[#2E86AB] text-xs text-white">
                    {entry.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#1A1A1A]">{entry.user.name}</p>
                  <p className="text-[10px] text-[#9CA3AF]">{entry.user.department || entry.user.role}</p>
                </div>

                <div className="flex items-center gap-4">
                  {entry.streak > 0 && (
                    <div className="flex items-center gap-1 text-orange-500">
                      <Flame className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">{entry.streak}d</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-[#9CA3AF]">
                    <Target className="h-3.5 w-3.5" />
                    <span className="text-xs">{entry.onTimeTasks}/{entry.tasksCompleted}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-yellow-400" />
                    <span className="text-xs text-[#6B7280]">{entry.credibilityScore}</span>
                  </div>
                  <span className="min-w-[60px] text-right text-sm font-bold text-[#1A1A1A]">
                    {entry.points} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
