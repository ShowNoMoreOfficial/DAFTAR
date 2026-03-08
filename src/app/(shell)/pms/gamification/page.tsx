"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Trophy, Flame, Zap, Crown, Rocket, Timer, ShieldCheck,
  HeartHandshake, CalendarCheck, Target, Medal, TrendingUp,
} from "lucide-react";

const ICON_MAP: Record<string, React.ReactNode> = {
  trophy: <Trophy className="h-5 w-5" />,
  flame: <Flame className="h-5 w-5" />,
  zap: <Zap className="h-5 w-5" />,
  crown: <Crown className="h-5 w-5" />,
  rocket: <Rocket className="h-5 w-5" />,
  timer: <Timer className="h-5 w-5" />,
  "shield-check": <ShieldCheck className="h-5 w-5" />,
  "heart-handshake": <HeartHandshake className="h-5 w-5" />,
  "calendar-check": <CalendarCheck className="h-5 w-5" />,
  target: <Target className="h-5 w-5" />,
};

interface MyStats {
  totalXp: number;
  level: number;
  xpInLevel: number;
  xpNeeded: number;
  currentStreak: number;
  longestStreak: number;
  achievements: {
    key: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    points: number;
    unlockedAt: string;
  }[];
  newUnlocks: { name: string; icon: string; points: number }[];
}

interface LeaderboardEntry {
  rank: number;
  user: { id: string; name: string; avatar: string | null; role: string };
  totalXp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
}

interface AchievementDef {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  threshold: number;
  points: number;
  unlocked: boolean;
}

type Tab = "overview" | "achievements" | "leaderboard";

export default function GamificationPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<MyStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [allAchievements, setAllAchievements] = useState<AchievementDef[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/gamification/me").then((r) => r.json()),
      fetch("/api/gamification/leaderboard").then((r) => r.json()),
      fetch("/api/gamification/achievements").then((r) => r.json()),
    ]).then(([s, l, a]) => {
      setStats(s);
      setLeaderboard(l);
      setAllAchievements(a);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[#9CA3AF]">
        Loading gamification data...
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[#1A1A1A]">Gamification</h2>
        <p className="text-sm text-[#9CA3AF]">Track achievements, streaks, and climb the leaderboard</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-[#F0F2F5] p-1 w-fit">
        {(["overview", "achievements", "leaderboard"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-md px-4 py-1.5 text-xs font-medium transition-all",
              tab === t ? "bg-white text-[#1A1A1A] shadow-sm" : "text-[#6B7280] hover:text-[#1A1A1A]"
            )}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "overview" && stats && <OverviewTab stats={stats} leaderboard={leaderboard.slice(0, 5)} />}
      {tab === "achievements" && <AchievementsTab achievements={allAchievements} />}
      {tab === "leaderboard" && <LeaderboardTab entries={leaderboard} />}
    </div>
  );
}

function OverviewTab({ stats, leaderboard }: { stats: MyStats; leaderboard: LeaderboardEntry[] }) {
  const xpPct = stats.xpNeeded > 0 ? Math.round((stats.xpInLevel / stats.xpNeeded) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Level & XP card */}
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-2 rounded-lg border border-[#E5E7EB] bg-white p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#2E86AB] to-[#A23B72] text-white">
              <span className="text-xl font-bold">{stats.level}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#1A1A1A]">Level {stats.level}</p>
              <p className="text-xs text-[#9CA3AF]">{stats.totalXp} total XP</p>
              <div className="mt-2 h-2 w-full rounded-full bg-[#F0F2F5]">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-[#2E86AB] to-[#A23B72] transition-all"
                  style={{ width: `${xpPct}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-[#9CA3AF]">
                {stats.xpInLevel} / {stats.xpNeeded} XP to next level
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-[#E5E7EB] bg-white p-5">
          <div className="mb-2 flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="text-xs text-[#9CA3AF]">Current Streak</span>
          </div>
          <p className="text-3xl font-bold text-[#1A1A1A]">{stats.currentStreak}</p>
          <p className="text-[10px] text-[#9CA3AF]">days</p>
        </div>

        <div className="rounded-lg border border-[#E5E7EB] bg-white p-5">
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#2E86AB]" />
            <span className="text-xs text-[#9CA3AF]">Longest Streak</span>
          </div>
          <p className="text-3xl font-bold text-[#1A1A1A]">{stats.longestStreak}</p>
          <p className="text-[10px] text-[#9CA3AF]">days</p>
        </div>
      </div>

      {/* Recent achievements */}
      <div className="rounded-lg border border-[#E5E7EB] bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-[#1A1A1A]">
          Unlocked Achievements ({stats.achievements.length})
        </h3>
        {stats.achievements.length === 0 ? (
          <p className="text-sm text-[#9CA3AF]">Complete tasks to earn achievements!</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {stats.achievements.map((a) => (
              <div key={a.key} className="flex items-center gap-3 rounded-lg bg-[#F8F9FA] p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 text-white">
                  {ICON_MAP[a.icon] || <Medal className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">{a.name}</p>
                  <p className="text-[10px] text-[#9CA3AF]">{a.description}</p>
                  <Badge variant="secondary" className="mt-1 text-[9px]">
                    +{a.points} XP
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mini leaderboard */}
      <div className="rounded-lg border border-[#E5E7EB] bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-[#1A1A1A]">Top 5</h3>
        <div className="space-y-2">
          {leaderboard.map((entry) => (
            <div key={entry.user.id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-[#F8F9FA]">
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                  entry.rank === 1
                    ? "bg-yellow-400 text-yellow-900"
                    : entry.rank === 2
                      ? "bg-gray-300 text-gray-700"
                      : entry.rank === 3
                        ? "bg-orange-300 text-orange-800"
                        : "bg-[#F0F2F5] text-[#6B7280]"
                )}
              >
                {entry.rank}
              </span>
              <Avatar className="h-7 w-7">
                <AvatarImage src={entry.user.avatar || undefined} />
                <AvatarFallback className="bg-[#2E86AB] text-[8px] text-white">
                  {entry.user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-xs font-medium text-[#1A1A1A]">{entry.user.name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-[#1A1A1A]">{entry.totalXp} XP</p>
                <p className="text-[10px] text-[#9CA3AF]">Lv.{entry.level}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AchievementsTab({ achievements }: { achievements: AchievementDef[] }) {
  const categories = [...new Set(achievements.map((a) => a.category))];

  return (
    <div className="space-y-6">
      {categories.map((cat) => (
        <div key={cat}>
          <h3 className="mb-3 text-sm font-semibold capitalize text-[#1A1A1A]">{cat}</h3>
          <div className="grid grid-cols-3 gap-3">
            {achievements
              .filter((a) => a.category === cat)
              .map((a) => (
                <div
                  key={a.id}
                  className={cn(
                    "rounded-lg border p-4 transition-all",
                    a.unlocked
                      ? "border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50"
                      : "border-[#E5E7EB] bg-white opacity-60"
                  )}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg",
                        a.unlocked
                          ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white"
                          : "bg-[#F0F2F5] text-[#9CA3AF]"
                      )}
                    >
                      {ICON_MAP[a.icon] || <Medal className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">{a.name}</p>
                      {a.unlocked && (
                        <Badge className="bg-yellow-100 text-yellow-700 text-[9px]">Unlocked</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-[#6B7280]">{a.description}</p>
                  <p className="mt-2 text-[10px] text-[#9CA3AF]">+{a.points} XP</p>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function LeaderboardTab({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-white">
      <div className="border-b border-[#E5E7EB] px-4 py-3">
        <h3 className="text-sm font-semibold text-[#1A1A1A]">Leaderboard</h3>
      </div>
      <div className="divide-y divide-[#F0F2F5]">
        {entries.length === 0 ? (
          <div className="py-8 text-center text-sm text-[#9CA3AF]">No data yet</div>
        ) : (
          entries.map((entry) => (
            <div key={entry.user.id} className="flex items-center gap-4 px-4 py-3">
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                  entry.rank === 1
                    ? "bg-yellow-400 text-yellow-900"
                    : entry.rank === 2
                      ? "bg-gray-300 text-gray-700"
                      : entry.rank === 3
                        ? "bg-orange-300 text-orange-800"
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
              <div className="flex-1">
                <p className="text-sm font-medium text-[#1A1A1A]">{entry.user.name}</p>
                <p className="text-[10px] text-[#9CA3AF]">{entry.user.role}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-sm font-bold text-[#1A1A1A]">{entry.totalXp}</p>
                  <p className="text-[10px] text-[#9CA3AF]">XP</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-[#2E86AB]">{entry.level}</p>
                  <p className="text-[10px] text-[#9CA3AF]">Level</p>
                </div>
                <div className="flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                  <span className="text-xs font-medium text-[#1A1A1A]">{entry.currentStreak}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
