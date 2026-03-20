"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Shield,
  Bell,
  Layout,
  Save,
  Check,
  Users,
  Building,
  Link as LinkIcon,
  Sparkles,
  FileText,
  Settings2,
  BookOpen,
  GitBranch,
  ArrowRight,
  MessageSquarePlus,
  CalendarClock,
  ShieldCheck,
  Plus,
  Trash2,
} from "lucide-react";

type Tab = "profile" | "notifications" | "appearance" | "schedule" | "team" | "brands" | "platforms" | "ai" | "prompts" | "skills" | "feedback" | "admin";

const ADMIN_TABS: { id: Tab; label: string; icon: React.ReactNode; href?: string; desc: string }[] = [
  { id: "team", label: "Team", icon: <Users className="h-4 w-4" />, href: "/admin/users", desc: "Users, roles, departments, invitations" },
  { id: "brands", label: "Brands", icon: <Building className="h-4 w-4" />, href: "/admin/clients", desc: "Client and brand management" },
  { id: "platforms", label: "Platforms", icon: <LinkIcon className="h-4 w-4" />, href: "/relay/connections", desc: "Platform connections and publishing rules" },
  { id: "schedule", label: "Content Schedule", icon: <CalendarClock className="h-4 w-4" />, desc: "Posting frequency per brand per platform" },
  { id: "ai", label: "AI Config", icon: <Sparkles className="h-4 w-4" />, href: "/admin/gi", desc: "GI configuration, tier assignments, autonomy" },
  { id: "prompts", label: "Prompts", icon: <FileText className="h-4 w-4" />, href: "/m/yantri/prompt-library", desc: "Prompt templates for content generation" },
  { id: "skills", label: "Skills", icon: <BookOpen className="h-4 w-4" />, href: "/admin/skills", desc: "Skill file management and performance" },
  { id: "feedback", label: "Feedback", icon: <MessageSquarePlus className="h-4 w-4" />, href: "/settings/feedback", desc: "Team bug reports, suggestions, content ratings" },
  { id: "admin", label: "Admin", icon: <ShieldCheck className="h-4 w-4" />, href: "/admin/users", desc: "Users, security, cron status" },
];

// --- Content Schedule types & defaults ---
type FrequencyOption = "hourly" | "every_3h" | "daily" | "2_per_week" | "3_per_week" | "1_per_week" | "when_newsworthy" | "match_shorts" | "match_twitter";

interface SlotConfig {
  frequency: FrequencyOption;
  days?: string[];
  times?: string[];
  auto?: boolean;
}

type BrandSchedule = Record<string, SlotConfig>;

const FREQUENCY_LABELS: Record<FrequencyOption, string> = {
  hourly: "Hourly",
  every_3h: "Every 3 hours",
  daily: "Daily",
  "2_per_week": "2× per week",
  "3_per_week": "3× per week",
  "1_per_week": "1× per week",
  when_newsworthy: "When newsworthy",
  match_shorts: "Match Shorts cadence",
  match_twitter: "Match Twitter cadence",
};

const CONTENT_TYPES = [
  { key: "x_thread", label: "X Thread" },
  { key: "x_single", label: "X Post" },
  { key: "youtube_explainer", label: "YouTube Explainer" },
  { key: "youtube_short", label: "YouTube Short" },
  { key: "instagram_carousel", label: "Instagram Carousel" },
  { key: "instagram_reel", label: "Instagram Reel" },
  { key: "blog_post", label: "Blog Post" },
  { key: "linkedin_post", label: "LinkedIn Post" },
];

const DEFAULT_SCHEDULES: Record<string, BrandSchedule> = {
  "the-squirrels": {
    x_thread: { frequency: "every_3h", times: ["08:00", "11:00", "14:00", "17:00", "20:00"] },
    x_single: { frequency: "hourly", auto: true },
    youtube_explainer: { frequency: "2_per_week", days: ["tuesday", "friday"] },
    youtube_short: { frequency: "when_newsworthy", auto: true },
    instagram_carousel: { frequency: "3_per_week", days: ["monday", "wednesday", "friday"] },
    instagram_reel: { frequency: "match_shorts", auto: true },
    blog_post: { frequency: "match_twitter", auto: true },
    linkedin_post: { frequency: "3_per_week" },
  },
  "breaking-tube": {
    youtube_short: { frequency: "daily" },
    youtube_explainer: { frequency: "1_per_week", days: ["thursday"] },
  },
};

const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [displayName, setDisplayName] = useState("");
  const [saved, setSaved] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({
    taskAssigned: true,
    taskComments: true,
    approvals: true,
    giSuggestions: true,
    systemUpdates: true,
  });

  // Content Schedule state
  const [schedules, setSchedules] = useState<Record<string, BrandSchedule>>(DEFAULT_SCHEDULES);
  const [scheduleSaved, setScheduleSaved] = useState(false);
  const [activeBrand, setActiveBrand] = useState("the-squirrels");

  // Load saved schedule from API
  useEffect(() => {
    fetch("/api/settings/content-schedule")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.schedules) setSchedules(data.schedules); })
      .catch(() => {});
  }, []);

  async function handleSaveSchedule() {
    try {
      await fetch("/api/settings/content-schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedules }),
      });
      setScheduleSaved(true);
      setTimeout(() => setScheduleSaved(false), 2000);
    } catch { /* ignore */ }
  }

  function updateSlot(brand: string, contentType: string, field: string, value: unknown) {
    setSchedules((prev) => ({
      ...prev,
      [brand]: {
        ...prev[brand],
        [contentType]: {
          ...(prev[brand]?.[contentType] || { frequency: "daily" as FrequencyOption }),
          [field]: value,
        },
      },
    }));
  }

  function removeSlot(brand: string, contentType: string) {
    setSchedules((prev) => {
      const copy = { ...prev, [brand]: { ...prev[brand] } };
      delete copy[brand][contentType];
      return copy;
    });
  }

  function addSlot(brand: string, contentType: string) {
    setSchedules((prev) => ({
      ...prev,
      [brand]: {
        ...prev[brand],
        [contentType]: { frequency: "daily" as FrequencyOption },
      },
    }));
  }

  useEffect(() => {
    if (session?.user?.name) setDisplayName(session.user.name);
  }, [session]);

  const handleSaveProfile = async () => {
    try {
      await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // handle error
    }
  };

  if (!session?.user) return null;

  const user = session.user;
  const isAdmin = user.role === "ADMIN" || user.role === "HEAD_HR";

  const USER_TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Account", icon: <User className="h-4 w-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
    { id: "appearance", label: "Appearance", icon: <Layout className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Settings</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Manage your profile, preferences, and configuration
        </p>
      </div>

      <div className="flex gap-6">
        {/* Tabs sidebar */}
        <nav className="w-48 shrink-0 space-y-1">
          {USER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                activeTab === tab.id
                  ? "bg-[var(--bg-elevated)] font-medium text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}

          {isAdmin && (
            <>
              <div className="pt-3 pb-1">
                <span className="px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                  Admin
                </span>
              </div>
              {ADMIN_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    activeTab === tab.id
                      ? "bg-[var(--bg-elevated)] font-medium text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </>
          )}
        </nav>

        {/* Content */}
        <div className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">Profile</h2>
                <p className="text-xs text-[var(--text-muted)]">Your account information</p>
              </div>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.image || undefined} />
                  <AvatarFallback className="bg-[var(--accent-primary)] text-lg text-white">
                    {user.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{user.name}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{user.email}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      <Shield className="mr-1 h-3 w-3" />
                      {user.role}
                    </Badge>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="max-w-md space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Display Name</label>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Email</label>
                  <Input value={user.email || ""} disabled />
                  <p className="mt-1 text-[10px] text-[var(--text-muted)]">Email is managed by your OAuth provider</p>
                </div>
                <Button onClick={handleSaveProfile} className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90">
                  {saved ? (<><Check className="mr-2 h-4 w-4" /> Saved</>) : (<><Save className="mr-2 h-4 w-4" /> Save Changes</>)}
                </Button>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">Notification Preferences</h2>
                <p className="text-xs text-[var(--text-muted)]">Choose what notifications you receive</p>
              </div>
              <div className="space-y-3">
                {[
                  { key: "taskAssigned" as const, label: "Task Assignments", desc: "When a task is assigned to you" },
                  { key: "taskComments" as const, label: "Task Comments", desc: "When someone comments on your tasks" },
                  { key: "approvals" as const, label: "Approvals", desc: "When items need your approval" },
                  { key: "giSuggestions" as const, label: "GI Suggestions", desc: "Contextual suggestions from the GI" },
                  { key: "systemUpdates" as const, label: "System Updates", desc: "Platform announcements and updates" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] p-4">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{item.label}</p>
                      <p className="text-xs text-[var(--text-muted)]">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifPrefs((p) => ({ ...p, [item.key]: !p[item.key] }))}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        notifPrefs[item.key] ? "bg-[var(--accent-primary)]" : "bg-[#D1D5DB]"
                      }`}
                    >
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-[var(--bg-surface)] shadow transition-transform ${
                        notifPrefs[item.key] ? "translate-x-[22px]" : "translate-x-0.5"
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">Appearance</h2>
                <p className="text-xs text-[var(--text-muted)]">Customize how Daftar looks for you</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-medium text-[var(--text-secondary)]">Sidebar</label>
                  <div className="flex gap-3">
                    <button className="rounded-lg border-2 border-[#2E86AB] bg-[var(--bg-surface)] px-4 py-3 text-sm font-medium text-[var(--text-primary)]">Expanded</button>
                    <button className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 text-sm text-[var(--text-secondary)] hover:border-[#2E86AB]">Collapsed</button>
                  </div>
                </div>
                <Separator />
                <div>
                  <label className="mb-2 block text-xs font-medium text-[var(--text-secondary)]">Density</label>
                  <div className="flex gap-3">
                    <button className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 text-sm text-[var(--text-secondary)] hover:border-[#2E86AB]">Comfortable</button>
                    <button className="rounded-lg border-2 border-[#2E86AB] bg-[var(--bg-surface)] px-4 py-3 text-sm font-medium text-[var(--text-primary)]">Compact</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content Schedule tab — inline editor */}
          {activeTab === "schedule" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">Content Schedule</h2>
                <p className="text-xs text-[var(--text-muted)]">Configure posting frequency per brand per platform</p>
              </div>

              {/* Brand tabs */}
              <div className="flex gap-2">
                {Object.keys(schedules).map((brand) => (
                  <button
                    key={brand}
                    onClick={() => setActiveBrand(brand)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      activeBrand === brand
                        ? "bg-[var(--accent-primary)] text-white"
                        : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {brand.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                  </button>
                ))}
              </div>

              {/* Slots for active brand */}
              <div className="space-y-3">
                {Object.entries(schedules[activeBrand] || {}).map(([ctKey, slot]) => {
                  const ct = CONTENT_TYPES.find((c) => c.key === ctKey);
                  return (
                    <div key={ctKey} className="rounded-lg border border-[var(--border-subtle)] p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-[var(--text-primary)]">{ct?.label || ctKey}</p>
                        <div className="flex items-center gap-2">
                          {slot.auto && (
                            <Badge variant="secondary" className="text-[10px]">Auto</Badge>
                          )}
                          <button onClick={() => removeSlot(activeBrand, ctKey)} className="text-[var(--text-muted)] hover:text-red-500">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">Frequency</label>
                          <select
                            value={slot.frequency}
                            onChange={(e) => updateSlot(activeBrand, ctKey, "frequency", e.target.value)}
                            className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-1.5 text-xs text-[var(--text-primary)]"
                          >
                            {Object.entries(FREQUENCY_LABELS).map(([k, v]) => (
                              <option key={k} value={k}>{v}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">Auto-publish</label>
                          <button
                            onClick={() => updateSlot(activeBrand, ctKey, "auto", !slot.auto)}
                            className={`relative h-6 w-11 rounded-full transition-colors ${
                              slot.auto ? "bg-[var(--accent-primary)]" : "bg-[#D1D5DB]"
                            }`}
                          >
                            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                              slot.auto ? "translate-x-[22px]" : "translate-x-0.5"
                            }`} />
                          </button>
                        </div>
                      </div>

                      {/* Day selection for weekly frequencies */}
                      {(slot.frequency === "2_per_week" || slot.frequency === "3_per_week" || slot.frequency === "1_per_week") && (
                        <div className="mt-3">
                          <label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">Days</label>
                          <div className="flex flex-wrap gap-1.5">
                            {DAYS_OF_WEEK.map((day) => (
                              <button
                                key={day}
                                onClick={() => {
                                  const current = slot.days || [];
                                  const next = current.includes(day)
                                    ? current.filter((d) => d !== day)
                                    : [...current, day];
                                  updateSlot(activeBrand, ctKey, "days", next);
                                }}
                                className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${
                                  (slot.days || []).includes(day)
                                    ? "bg-[var(--accent-primary)] text-white"
                                    : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
                                }`}
                              >
                                {day.slice(0, 3).toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add content type */}
                {(() => {
                  const existing = Object.keys(schedules[activeBrand] || {});
                  const available = CONTENT_TYPES.filter((ct) => !existing.includes(ct.key));
                  if (available.length === 0) return null;
                  return (
                    <div className="flex items-center gap-2">
                      <select
                        id="add-content-type"
                        className="rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-1.5 text-xs text-[var(--text-primary)]"
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) {
                            addSlot(activeBrand, e.target.value);
                            e.target.value = "";
                          }
                        }}
                      >
                        <option value="" disabled>Add content type...</option>
                        {available.map((ct) => (
                          <option key={ct.key} value={ct.key}>{ct.label}</option>
                        ))}
                      </select>
                      <Plus className="h-4 w-4 text-[var(--text-muted)]" />
                    </div>
                  );
                })()}
              </div>

              <Button onClick={handleSaveSchedule} className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90">
                {scheduleSaved ? (<><Check className="mr-2 h-4 w-4" /> Saved</>) : (<><Save className="mr-2 h-4 w-4" /> Save Schedule</>)}
              </Button>
            </div>
          )}

          {/* Admin tabs — link to existing admin pages */}
          {ADMIN_TABS.some((t) => t.id === activeTab && t.href && t.id !== "schedule") && (() => {
            const tab = ADMIN_TABS.find((t) => t.id === activeTab)!;
            return (
              <div className="space-y-6">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--text-primary)]">{tab.label}</h2>
                  <p className="text-xs text-[var(--text-muted)]">{tab.desc}</p>
                </div>
                <Link href={tab.href!}>
                  <Button className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90">
                    Open {tab.label} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
