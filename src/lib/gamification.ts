import { prisma } from "@/lib/prisma";

// Escalating XP thresholds per level using a power curve:
// Level 1: 0–100, Level 2: 100–250, Level 3: 250–475, Level 4: 475–800, ...
// Formula: XP needed for level N = floor(100 * N^1.5)
function xpRequiredForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

// Cumulative XP needed to reach a given level
function cumulativeXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += xpRequiredForLevel(i);
  }
  return total;
}

export function levelFromXp(xp: number): number {
  let level = 1;
  let remaining = xp;
  while (remaining >= xpRequiredForLevel(level)) {
    remaining -= xpRequiredForLevel(level);
    level++;
  }
  return level;
}

export function xpForNextLevel(level: number): number {
  return xpRequiredForLevel(level);
}

export function xpInCurrentLevel(totalXp: number): number {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpRequiredForLevel(level)) {
    remaining -= xpRequiredForLevel(level);
    level++;
  }
  return remaining;
}

export interface LevelInfo {
  level: number;
  totalXp: number;
  xpInLevel: number;
  nextLevelXp: number;
  percentComplete: number;
}

/**
 * Calculate full level info from a total XP value.
 * Returns current level, XP progress within level, XP target, and percentage.
 */
export function calculateLevel(xp: number): LevelInfo {
  const level = levelFromXp(xp);
  const xpInLevel = xpInCurrentLevel(xp);
  const nextLevelXp = xpForNextLevel(level);
  const percentComplete = nextLevelXp > 0 ? Math.round((xpInLevel / nextLevelXp) * 100) : 100;

  return { level, totalXp: xp, xpInLevel, nextLevelXp, percentComplete };
}

/**
 * Record daily activity and update streak for a user.
 * Call this when a user completes a task.
 */
export async function recordActivity(userId: string, xpEarned: number = 10) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const streak = await prisma.userStreak.upsert({
    where: { userId },
    create: { userId, currentStreak: 1, longestStreak: 1, lastActivityAt: now, totalXp: xpEarned, level: 1 },
    update: {},
  });

  const lastDate = streak.lastActivityAt.toISOString().slice(0, 10);

  if (lastDate === today) {
    const newXp = streak.totalXp + xpEarned;
    await prisma.userStreak.update({
      where: { userId },
      data: { totalXp: newXp, level: levelFromXp(newXp) },
    });
    return streak;
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const isConsecutive = lastDate === yesterdayStr;
  const newStreak = isConsecutive ? streak.currentStreak + 1 : 1;
  const newLongest = Math.max(streak.longestStreak, newStreak);
  const newXp = streak.totalXp + xpEarned;

  const updated = await prisma.userStreak.update({
    where: { userId },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastActivityAt: now,
      totalXp: newXp,
      level: levelFromXp(newXp),
    },
  });

  await checkStreakAchievements(userId, newStreak);
  return updated;
}

/**
 * Check and unlock achievements for a user based on task completion stats.
 */
export async function checkTaskAchievements(userId: string) {
  const completedCount = await prisma.task.count({
    where: { assigneeId: userId, status: "DONE" },
  });

  const keys: string[] = [];
  if (completedCount >= 1) keys.push("first_task");
  if (completedCount >= 10) keys.push("ten_tasks");
  if (completedCount >= 50) keys.push("fifty_tasks");
  if (completedCount >= 100) keys.push("centurion");

  for (const key of keys) {
    await unlockAchievement(userId, key);
  }
}

async function checkStreakAchievements(userId: string, streak: number) {
  if (streak >= 3) await unlockAchievement(userId, "streak_3");
  if (streak >= 7) await unlockAchievement(userId, "streak_7");
  if (streak >= 30) await unlockAchievement(userId, "streak_30");
}

/**
 * Check speed-based achievements when a task is completed.
 * "speed_demon": completed within 1 hour of starting
 * "rapid_fire": 3+ tasks completed in a single day
 */
export async function checkSpeedAchievements(userId: string, startedAt: Date | null, completedAt: Date | null) {
  // speed_demon: task completed within 1 hour of starting
  if (startedAt && completedAt) {
    const durationMs = completedAt.getTime() - startedAt.getTime();
    const oneHourMs = 60 * 60 * 1000;
    if (durationMs <= oneHourMs && durationMs > 0) {
      await unlockAchievement(userId, "speed_demon");
    }
  }

  // rapid_fire: 3+ tasks completed today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const todayCount = await prisma.task.count({
    where: {
      assigneeId: userId,
      status: "DONE",
      completedAt: { gte: todayStart, lte: todayEnd },
    },
  });
  if (todayCount >= 3) {
    await unlockAchievement(userId, "rapid_fire");
  }
}

/**
 * Check collaboration achievements (based on recognitions given).
 * "team_player": given 5+ recognitions
 */
export async function checkCollaborationAchievements(userId: string) {
  const givenCount = await prisma.recognition.count({
    where: { fromUserId: userId },
  });
  if (givenCount >= 5) {
    await unlockAchievement(userId, "team_player");
  }
}

/**
 * Check quality achievements (tasks approved without revision).
 * "quality_king": 10+ tasks approved directly (REVIEW→APPROVED without going back to IN_PROGRESS)
 */
export async function checkQualityAchievements(userId: string) {
  // Count direct approvals: REVIEW→APPROVED transitions for tasks assigned to this user
  const directApprovals = await prisma.taskActivity.count({
    where: {
      task: { assigneeId: userId },
      action: "status_changed",
      field: "status",
      oldValue: "REVIEW",
      newValue: "APPROVED",
    },
  });
  if (directApprovals >= 10) {
    await unlockAchievement(userId, "quality_king");
  }
}

async function unlockAchievement(userId: string, achievementKey: string) {
  const achievement = await prisma.achievement.findUnique({ where: { key: achievementKey } });
  if (!achievement || !achievement.isActive) return null;

  const existing = await prisma.userAchievement.findUnique({
    where: { userId_achievementId: { userId, achievementId: achievement.id } },
  });
  if (existing) return null;

  const ua = await prisma.userAchievement.create({
    data: { userId, achievementId: achievement.id },
  });

  // Award XP for achievement
  await prisma.userStreak.upsert({
    where: { userId },
    create: { userId, totalXp: achievement.points, level: 1 },
    update: { totalXp: { increment: achievement.points } },
  });

  return ua;
}

/**
 * Get leaderboard data for the org.
 */
export async function getLeaderboard(limit: number = 10) {
  const streaks = await prisma.userStreak.findMany({
    orderBy: { totalXp: "desc" },
    take: limit,
    include: {
      user: { select: { id: true, name: true, avatar: true, role: true } },
    },
  });

  return streaks.map((s, i) => ({
    rank: i + 1,
    user: s.user,
    totalXp: s.totalXp,
    level: s.level,
    currentStreak: s.currentStreak,
    longestStreak: s.longestStreak,
  }));
}

/**
 * Seed default achievements if they don't exist.
 */
export async function seedAchievements() {
  const defaults = [
    { key: "first_task", name: "First Step", description: "Complete your first task", icon: "rocket", category: "milestone", threshold: 1, points: 10 },
    { key: "ten_tasks", name: "Getting Started", description: "Complete 10 tasks", icon: "zap", category: "milestone", threshold: 10, points: 50 },
    { key: "fifty_tasks", name: "Workhorse", description: "Complete 50 tasks", icon: "flame", category: "milestone", threshold: 50, points: 150 },
    { key: "centurion", name: "Centurion", description: "Complete 100 tasks", icon: "crown", category: "milestone", threshold: 100, points: 300 },
    { key: "streak_3", name: "Hat Trick", description: "3-day activity streak", icon: "calendar-check", category: "streak", threshold: 3, points: 15 },
    { key: "streak_7", name: "Weekly Warrior", description: "7-day activity streak", icon: "flame", category: "streak", threshold: 7, points: 50 },
    { key: "streak_30", name: "Unstoppable", description: "30-day activity streak", icon: "trophy", category: "streak", threshold: 30, points: 200 },
    { key: "speed_demon", name: "Speed Demon", description: "Complete a task within 1 hour", icon: "timer", category: "speed", threshold: 1, points: 25 },
    { key: "rapid_fire", name: "Rapid Fire", description: "Complete 3 tasks in a single day", icon: "zap", category: "speed", threshold: 3, points: 40 },
    { key: "team_player", name: "Team Player", description: "Give 5 recognitions", icon: "heart-handshake", category: "collaboration", threshold: 5, points: 30 },
    { key: "quality_king", name: "Quality King", description: "10 tasks approved without revision", icon: "shield-check", category: "quality", threshold: 10, points: 75 },
  ];

  for (const a of defaults) {
    await prisma.achievement.upsert({
      where: { key: a.key },
      create: a,
      update: { name: a.name, description: a.description, icon: a.icon, points: a.points },
    });
  }
}
