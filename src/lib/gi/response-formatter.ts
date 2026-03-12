// Conversational response formatters for GI data queries

function daysAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "today";
  if (diff === 1) return "yesterday";
  return `${diff} days ago`;
}

// ─── Overdue Tasks ──────────────────────────────────────

export function formatOverdueTasks(data: {
  tasks: { title: string; dueDate: Date | null; priority: string; assignee: { name: string | null } | null }[];
  total: number;
}): { message: string; suggestions: string[] } {
  if (data.total === 0) {
    return {
      message: "No overdue tasks — the team is on track!",
      suggestions: ["How's the team doing?", "Show pending reviews", "Content pipeline"],
    };
  }

  const lines = data.tasks.slice(0, 5).map((t) => {
    const due = t.dueDate ? `due ${daysAgo(new Date(t.dueDate))}` : "no due date";
    const assignee = t.assignee?.name || "Unassigned";
    return `• **${t.title}** (${t.priority}) — ${due}, assigned to ${assignee}`;
  });

  let msg = `There ${data.total === 1 ? "is" : "are"} **${data.total} overdue task${data.total !== 1 ? "s" : ""}**.`;
  if (data.total > 5) msg += ` Here are the most urgent:`;
  msg += `\n\n${lines.join("\n")}`;
  msg += `\n\nWant me to reassign any of these or extend deadlines?`;

  return {
    message: msg,
    suggestions: ["Reassign overdue tasks", "Extend deadlines", "Who's overloaded?"],
  };
}

// ─── Overloaded Users ───────────────────────────────────

export function formatOverloadedUsers(data: {
  users: { name: string; activeTasks: number }[];
  allCounts?: { name: string; activeTasks: number }[];
  threshold: number;
}): { message: string; suggestions: string[] } {
  if (data.users.length === 0) {
    let msg = `No one is overloaded right now (threshold: ${data.threshold}+ active tasks).`;
    if (data.allCounts && data.allCounts.length > 0) {
      msg += "\n\nCurrent workload:\n";
      msg += data.allCounts.slice(0, 5).map((u) => `• ${u.name}: ${u.activeTasks} active tasks`).join("\n");
    }
    return { message: msg, suggestions: ["Show overdue tasks", "Team weekly stats"] };
  }

  const lines = data.users.map((u) => `• **${u.name}** — ${u.activeTasks} active tasks`);
  return {
    message: `**${data.users.length} team member${data.users.length !== 1 ? "s are" : " is"} overloaded** (>${data.threshold} active tasks):\n\n${lines.join("\n")}\n\nConsider reassigning some tasks to balance the workload.`,
    suggestions: ["Reassign tasks", "Show overdue tasks", "Team health"],
  };
}

// ─── Pending Reviews ────────────────────────────────────

export function formatPendingReviews(data: {
  deliverables: { platform: string; pipelineType: string; brand: { name: string } | null; tree: { title: string } | null }[];
  total: number;
}): { message: string; suggestions: string[] } {
  if (data.total === 0) {
    return {
      message: "No deliverables pending review. The queue is clear!",
      suggestions: ["Show content pipeline", "Overdue tasks", "Team stats"],
    };
  }

  const lines = data.deliverables.slice(0, 5).map((d) => {
    const brand = d.brand?.name || "Unknown brand";
    const topic = d.tree?.title || "Untitled";
    return `• **${topic}** — ${d.platform} (${d.pipelineType}) for ${brand}`;
  });

  return {
    message: `**${data.total} deliverable${data.total !== 1 ? "s" : ""} awaiting review:**\n\n${lines.join("\n")}${data.total > 5 ? `\n\n...and ${data.total - 5} more.` : ""}`,
    suggestions: ["Review now", "Show content pipeline", "What should we cover?"],
  };
}

// ─── Team Weekly Stats ──────────────────────────────────

export function formatTeamWeeklyStats(data: {
  completedThisWeek: number;
  totalActive: number;
  totalXpThisWeek: number;
  topStreaks: { name: string; streak: number }[];
}): { message: string; suggestions: string[] } {
  let msg = `**This week's team performance:**\n\n`;
  msg += `• ${data.completedThisWeek} tasks completed\n`;
  msg += `• ${data.totalActive} tasks still active\n`;
  msg += `• ${data.totalXpThisWeek.toLocaleString()} XP earned`;

  if (data.topStreaks.length > 0) {
    msg += `\n\n**Top streaks:**\n`;
    msg += data.topStreaks.map((s, i) => `${["1st", "2nd", "3rd"][i] || `${i + 1}th`}. ${s.name}: ${s.streak}-day streak`).join("\n");
  }

  const health =
    data.completedThisWeek > data.totalActive
      ? "The team is making great progress!"
      : data.totalActive > data.completedThisWeek * 3
        ? "The backlog is growing — might need to reprioritize."
        : "Steady pace. Keep it up!";
  msg += `\n\n${health}`;

  return { message: msg, suggestions: ["Who's overloaded?", "Overdue tasks", "View leaderboard"] };
}

// ─── Recent Signals ─────────────────────────────────────

export function formatRecentSignals(data: {
  signals: { title: string; detectedAt: Date; trend: { name: string; lifecycle: string } | null }[];
  total: number;
}): { message: string; suggestions: string[] } {
  if (data.total === 0) {
    return {
      message: "No signals detected in the past week. Khabri is monitoring.",
      suggestions: ["Show content pipeline", "Overdue tasks"],
    };
  }

  const lines = data.signals.slice(0, 5).map((s) => {
    const trend = s.trend ? ` (${s.trend.name} — ${s.trend.lifecycle})` : "";
    return `• **${s.title}**${trend} — ${daysAgo(new Date(s.detectedAt))}`;
  });

  return {
    message: `**${data.total} signal${data.total !== 1 ? "s" : ""}** detected in the past week:\n\n${lines.join("\n")}${data.total > 5 ? `\n\n...and ${data.total - 5} more on the Khabri dashboard.` : ""}`,
    suggestions: ["Start pipeline for a signal", "What should we cover?"],
  };
}

// ─── Team Members ──────────────────────────────────────

export function formatTeamMembers(data: {
  members: { name: string; role: string; department: string }[];
  total: number;
}): { message: string; suggestions: string[] } {
  if (data.total === 0) {
    return {
      message: "No active team members found.",
      suggestions: ["View users", "Add team member"],
    };
  }

  const roleLabels: Record<string, string> = {
    ADMIN: "Admin",
    HEAD_HR: "HR Head",
    DEPT_HEAD: "Dept Head",
    MEMBER: "Member",
    FINANCE: "Finance",
    CONTRACTOR: "Contractor",
  };

  const lines = data.members.map(
    (m) => `• **${m.name}** — ${roleLabels[m.role] || m.role} (${m.department})`
  );

  return {
    message: `**Your team (${data.total} members):**\n\n${lines.join("\n")}`,
    suggestions: ["Who's overloaded?", "Team weekly stats", "View leaderboard"],
  };
}

// ─── Brand Content Pipeline ─────────────────────────────

export function formatBrandPipeline(data: {
  brand: { name: string } | null;
  trees: { title: string; status: string; urgency: string }[];
  deliverables: { platform: string; status: string; pipelineType: string; tree: { title: string } | null }[];
  stats: Record<string, number> | null;
}): { message: string; suggestions: string[] } {
  if (!data.brand) {
    return {
      message: "I couldn't find that brand. Check the brand name and try again.",
      suggestions: ["Show content pipeline", "What brands do we have?"],
    };
  }

  const statusLabels: Record<string, string> = {
    PLANNED: "Planned", RESEARCHING: "Researching", SCRIPTING: "Scripting",
    DRAFTED: "Drafted", REVIEW: "In Review", APPROVED: "Approved",
    PUBLISHED: "Published", KILLED: "Killed",
  };

  let msg = `**${data.brand.name} Content Pipeline:**\n`;

  if (data.stats && Object.keys(data.stats).length > 0) {
    msg += `\n`;
    for (const [status, count] of Object.entries(data.stats)) {
      msg += `• ${statusLabels[status] || status}: ${count}\n`;
    }
  }

  if (data.trees.length > 0) {
    msg += `\nRecent narratives:\n`;
    msg += data.trees.slice(0, 3).map((t) => `• **${t.title}** — ${t.status}${t.urgency !== "normal" ? ` (${t.urgency})` : ""}`).join("\n");
  }

  if (data.deliverables.length === 0 && data.trees.length === 0) {
    msg += `\nNo active content in the pipeline.`;
  }

  return {
    message: msg,
    suggestions: [`Start pipeline for ${data.brand.name}`, "What should we cover?", "Show pending reviews"],
  };
}
