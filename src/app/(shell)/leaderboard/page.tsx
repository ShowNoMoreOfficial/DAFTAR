"use client";

import { useState, useEffect, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trophy, Flame, Target, Star, Medal, Award, Zap, Gift,
  Clock, Lock, CheckCircle, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────

interface LeaderboardEntry {
  rank: number;
  user: { id: string; name: string; avatar: string | null; role: string; department?: string | null };
  totalXp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
}

interface AchievementItem {
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

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: string;
  currentRecord: { userId: string; value: number; recordedAt: string } | null;
  bonusPoints: number;
  endsAt: string;
  entries: { userId: string; value: number }[];
}

interface Reward {
  id: string;
  type: string;
  title: string;
  message: string;
  points: number;
  claimed: boolean;
  expiresAt: string | null;
  createdAt: string;
}

interface GamificationProfile {
  totalXp: number;
  level: number;
  xpInLevel: number;
  xpNeeded: number;
  currentStreak: number;
  longestStreak: number;
  achievements: { key: string; name: string; icon: string; points: number; unlockedAt: string }[];
  newUnlocks: { name: string; icon: string; points: number }[];
}

const RANK_STYLES: Record<number, { bg: string; text: string; icon: React.ReactNode }> = {
  1: { bg: "bg-[rgba(234,179,8,0.1)] border-yellow-300", text: "text-yellow-700", icon: <Trophy className="h-5 w-5 text-yellow-500" /> },
  2: { bg: "bg-[var(--bg-elevated)] border-gray-300", text: "text-gray-600", icon: <Medal className="h-5 w-5 text-gray-400" /> },
  3: { bg: "bg-[rgba(249,115,22,0.1)] border-orange-300", text: "text-orange-700", icon: <Medal className="h-5 w-5 text-orange-400" /> },
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  milestone: <Target className="h-3.5 w-3.5" />,
  streak: <Flame className="h-3.5 w-3.5" />,
  quality: <Star className="h-3.5 w-3.5" />,
  speed: <Zap className="h-3.5 w-3.5" />,
  collaboration: <Award className="h-3.5 w-3.5" />,
  special: <Sparkles className="h-3.5 w-3.5" />,
};

const REWARD_ICONS: Record<string, React.ReactNode> = {
  surprise_bonus: <Gift className="h-5 w-5 text-purple-500" />,
  spotlight: <Star className="h-5 w-5 text-yellow-500" />,
  streak_save: <Flame className="h-5 w-5 text-orange-500" />,
  badge_upgrade: <Award className="h-5 w-5 text-blue-500" />,
};

// ─── Main Page ──────────────────────────────────────────

export default function LeaderboardPage() {
  const [tab, setTab] = useState<"rankings" | "achievements" | "challenges" | "rewards">("rankings");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [achFilter, setAchFilter] = useState("all");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [lbRes, achRes, chRes, rwRes, prRes] = await Promise.all([
        fetch("/api/gamification/leaderboard").catch(() => null),
        fetch("/api/gamification/achievements").catch(() => null),
        fetch("/api/gamification/challenges").catch(() => null),
        fetch("/api/gamification/rewards").catch(() => null),
        fetch("/api/gamification/me").catch(() => null),
      ]);
      if (lbRes?.ok) setEntries(await lbRes.json().catch(() => []));
      if (achRes?.ok) setAchievements(await achRes.json().catch(() => []));
      if (chRes?.ok) setChallenges(await chRes.json().catch(() => []));
      if (rwRes?.ok) setRewards(await rwRes.json().catch(() => []));
      if (prRes?.ok) setProfile(await prRes.json().catch(() => null));
    } catch {
      // Fail gracefully — data stays at defaults
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const claimReward = async (rewardId: string) => {
    try {
      const res = await fetch("/api/gamification/rewards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId }),
      });
      if (res.ok) fetchAll();
    } catch {
      // Fail silently — user can retry
    }
  };

  const filteredAchievements = achFilter === "all"
    ? achievements
    : achievements.filter((a) => a.category === achFilter);

  const unclaimedRewards = rewards.filter((r) => !r.claimed);

  return (
    <div className="space-y-6">
      {/* Header with XP bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Leaderboard & Achievements</h1>
          <p className="text-sm text-[var(--text-muted)]">Track performance, earn achievements, and compete</p>
        </div>
        {profile && (
          <div className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2">
            <div className="text-right">
              <p className="text-xs text-[var(--text-muted)]">Level {profile.level}</p>
              <p className="text-sm font-bold text-[var(--text-primary)]">{profile.totalXp} XP</p>
            </div>
            <div className="h-8 w-20">
              <div className="h-2 w-full rounded-full bg-[var(--bg-elevated)]">
                <div
                  className="h-2 rounded-full bg-[var(--accent-primary)] transition-all"
                  style={{ width: `${Math.min((profile.xpInLevel / profile.xpNeeded) * 100, 100)}%` }}
                />
              </div>
              <p className="mt-0.5 text-[9px] text-[var(--text-muted)]">{profile.xpInLevel}/{profile.xpNeeded} XP</p>
            </div>
            {profile.currentStreak > 0 && (
              <Badge className="bg-[rgba(249,115,22,0.15)] text-orange-700 text-[10px]">
                <Flame className="mr-0.5 h-3 w-3" /> {profile.currentStreak}d streak
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-0.5 w-fit">
        {([
          { label: "Rankings", value: "rankings" as const },
          { label: "Achievements", value: "achievements" as const },
          { label: "Challenges", value: "challenges" as const },
          { label: `Rewards${unclaimedRewards.length > 0 ? ` (${unclaimedRewards.length})` : ""}`, value: "rewards" as const },
        ]).map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "rounded-md px-4 py-1.5 text-xs font-medium transition-colors",
              tab === t.value ? "bg-[var(--accent-primary)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-[var(--text-muted)]">Loading...</div>
      ) : tab === "rankings" ? (
        <>
          {entries.length >= 3 && (
            <div className="grid grid-cols-3 gap-4">
              {[entries[1], entries[0], entries[2]].map((entry, i) => {
                const actualRank = [2, 1, 3][i];
                const style = RANK_STYLES[actualRank];
                return (
                  <div key={entry.user.id} className={cn("flex flex-col items-center rounded-xl border-2 p-6", style.bg, actualRank === 1 && "scale-105 shadow-lg")}>
                    {style.icon}
                    <Avatar className="mt-3 h-14 w-14">
                      <AvatarImage src={entry.user.avatar || undefined} />
                      <AvatarFallback className="bg-[var(--accent-primary)] text-lg text-white">{entry.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <p className={cn("mt-2 text-sm font-semibold", style.text)}>{entry.user.name}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{entry.user.department || entry.user.role}</p>
                    <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{entry.totalXp}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">XP · Level {entry.level}</p>
                    {entry.currentStreak > 0 && (
                      <Badge className="mt-2 bg-[rgba(249,115,22,0.15)] text-orange-700 text-[10px]">
                        <Flame className="mr-0.5 h-3 w-3" /> {entry.currentStreak}d
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            <div className="border-b border-[var(--border-subtle)] px-4 py-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Full Rankings</h3>
            </div>
            {entries.length === 0 ? (
              <p className="py-12 text-center text-sm text-[var(--text-muted)]">No activity recorded yet.</p>
            ) : (
              <div className="divide-y divide-[#F0F2F5]">
                {entries.map((entry) => (
                  <div key={entry.user.id} className="flex items-center gap-4 px-4 py-3">
                    <span className={cn("flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold", entry.rank <= 3 ? "bg-[var(--accent-primary)] text-white" : "bg-[var(--bg-elevated)] text-[var(--text-secondary)]")}>{entry.rank}</span>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={entry.user.avatar || undefined} />
                      <AvatarFallback className="bg-[var(--accent-primary)] text-xs text-white">{entry.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{entry.user.name}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">{entry.user.department || entry.user.role}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {entry.currentStreak > 0 && (
                        <div className="flex items-center gap-1 text-orange-500">
                          <Flame className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">{entry.currentStreak}d</span>
                        </div>
                      )}
                      <Badge variant="secondary" className="text-[10px]">Lv {entry.level}</Badge>
                      <span className="min-w-[60px] text-right text-sm font-bold text-[var(--text-primary)]">{entry.totalXp} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : tab === "achievements" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text-primary)]">{filteredAchievements.filter((a) => a.unlocked).length}</span> / {filteredAchievements.length} unlocked
            </p>
            <div className="flex flex-wrap gap-1">
              {["all", "milestone", "streak", "quality", "speed", "collaboration", "special"].map((c) => (
                <button key={c} onClick={() => setAchFilter(c)} className={cn("rounded-full px-3 py-1 text-[10px] font-medium capitalize transition-colors", achFilter === c ? "bg-[var(--accent-primary)] text-white" : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[#E5E7EB]")}>{c}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAchievements.map((ach) => (
              <div key={ach.id} className={cn("rounded-xl border p-4 transition-all", ach.unlocked ? "border-[#2E86AB]/30 bg-[var(--bg-surface)] shadow-sm" : "border-[var(--border-subtle)] bg-[#FAFAFA] opacity-60")}>
                <div className="flex items-start justify-between">
                  <span className="text-2xl">{ach.icon}</span>
                  {ach.unlocked ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Lock className="h-4 w-4 text-[var(--text-muted)]" />}
                </div>
                <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{ach.name}</p>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">{ach.description}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px] capitalize gap-1">{CATEGORY_ICONS[ach.category]} {ach.category}</Badge>
                  <span className="text-[10px] font-medium text-[var(--accent-primary)]">+{ach.points} XP</span>
                </div>
              </div>
            ))}
          </div>
          {filteredAchievements.length === 0 && (
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center">
              <Award className="mx-auto h-12 w-12 text-[var(--text-muted)]" />
              <p className="mt-4 text-sm text-[var(--text-muted)]">No achievements in this category</p>
            </div>
          )}
        </div>
      ) : tab === "challenges" ? (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Active Challenges</h3>
            {challenges.filter((c) => new Date(c.endsAt) > new Date()).length === 0 ? (
              <div className="mt-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center">
                <Zap className="mx-auto h-12 w-12 text-[var(--text-muted)]" />
                <p className="mt-4 text-sm text-[var(--text-muted)]">No active challenges right now</p>
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {challenges.filter((c) => new Date(c.endsAt) > new Date()).map((ch) => {
                  const remaining = Math.max(0, Math.ceil((new Date(ch.endsAt).getTime() - Date.now()) / (1000 * 60 * 60)));
                  const days = Math.floor(remaining / 24);
                  const hours = remaining % 24;
                  return (
                    <div key={ch.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge className="bg-[rgba(168,85,247,0.15)] text-purple-700 text-[10px] capitalize">{ch.type}</Badge>
                          <h4 className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{ch.title}</h4>
                          <p className="mt-1 text-xs text-[var(--text-muted)]">{ch.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-[var(--accent-secondary)]">+{ch.bonusPoints}</p>
                          <p className="text-[10px] text-[var(--text-muted)]">bonus XP</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                          <Clock className="h-3.5 w-3.5" />
                          {days > 0 ? `${days}d ${hours}h left` : `${hours}h left`}
                        </div>
                        {ch.currentRecord && <p className="text-xs text-[var(--text-muted)]">Record: <span className="font-medium text-[var(--text-primary)]">{ch.currentRecord.value}</span></p>}
                      </div>
                      <p className="mt-2 text-[10px] text-[var(--text-muted)]">{ch.entries.length} participant{ch.entries.length !== 1 ? "s" : ""}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Unclaimed Rewards</h3>
            {unclaimedRewards.length === 0 ? (
              <div className="mt-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center">
                <Gift className="mx-auto h-12 w-12 text-[var(--text-muted)]" />
                <p className="mt-4 text-sm text-[var(--text-muted)]">No unclaimed rewards. Keep completing tasks!</p>
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {unclaimedRewards.map((r) => (
                  <div key={r.id} className="rounded-xl border-2 border-dashed border-[#A23B72]/30 bg-gradient-to-br from-white to-purple-50 p-5">
                    <div className="flex items-start justify-between">
                      {REWARD_ICONS[r.type] || <Gift className="h-5 w-5 text-[var(--accent-secondary)]" />}
                      {r.points > 0 && <span className="text-sm font-bold text-[var(--accent-secondary)]">+{r.points} XP</span>}
                    </div>
                    <h4 className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{r.title}</h4>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{r.message}</p>
                    {r.expiresAt && <p className="mt-1 text-[10px] text-red-400">Expires {new Date(r.expiresAt).toLocaleDateString()}</p>}
                    <Button size="sm" className="mt-3 w-full" onClick={() => claimReward(r.id)}>Claim Reward</Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {rewards.filter((r) => r.claimed).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Claimed History</h3>
              <div className="mt-3 space-y-2">
                {rewards.filter((r) => r.claimed).slice(0, 10).map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[#FAFAFA] px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      {REWARD_ICONS[r.type] || <Gift className="h-4 w-4 text-[var(--text-muted)]" />}
                      <div>
                        <p className="text-sm text-[var(--text-secondary)]">{r.title}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">{new Date(r.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {r.points > 0 && <span className="text-xs font-medium text-[var(--text-muted)]">+{r.points} XP</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
