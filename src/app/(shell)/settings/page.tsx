"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
} from "lucide-react";

type Tab = "profile" | "notifications" | "appearance";

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

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Profile", icon: <User className="h-4 w-4" /> },
    {
      id: "notifications",
      label: "Notifications",
      icon: <Bell className="h-4 w-4" />,
    },
    {
      id: "appearance",
      label: "Appearance",
      icon: <Layout className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#1A1A1A]">Settings</h1>
        <p className="text-sm text-[#6B7280]">
          Manage your profile and preferences
        </p>
      </div>

      <div className="flex gap-6">
        {/* Tabs sidebar */}
        <nav className="w-48 shrink-0 space-y-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                activeTab === tab.id
                  ? "bg-[#F0F2F5] font-medium text-[#1A1A1A]"
                  : "text-[#6B7280] hover:bg-[#F8F9FA]"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 rounded-xl border border-[#E5E7EB] bg-white p-6">
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-[#1A1A1A]">
                  Profile
                </h2>
                <p className="text-xs text-[#9CA3AF]">
                  Your account information
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.image || undefined} />
                  <AvatarFallback className="bg-[#2E86AB] text-lg text-white">
                    {user.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-[#1A1A1A]">{user.name}</p>
                  <p className="text-sm text-[#6B7280]">{user.email}</p>
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
                  <label className="mb-1 block text-xs font-medium text-[#6B7280]">
                    Display Name
                  </label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#6B7280]">
                    Email
                  </label>
                  <Input value={user.email || ""} disabled />
                  <p className="mt-1 text-[10px] text-[#9CA3AF]">
                    Email is managed by your OAuth provider
                  </p>
                </div>
                <Button
                  onClick={handleSaveProfile}
                  className="bg-[#2E86AB] hover:bg-[#2E86AB]/90"
                >
                  {saved ? (
                    <>
                      <Check className="mr-2 h-4 w-4" /> Saved
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-[#1A1A1A]">
                  Notification Preferences
                </h2>
                <p className="text-xs text-[#9CA3AF]">
                  Choose what notifications you receive
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    key: "taskAssigned" as const,
                    label: "Task Assignments",
                    desc: "When a task is assigned to you",
                  },
                  {
                    key: "taskComments" as const,
                    label: "Task Comments",
                    desc: "When someone comments on your tasks",
                  },
                  {
                    key: "approvals" as const,
                    label: "Approvals",
                    desc: "When items need your approval",
                  },
                  {
                    key: "giSuggestions" as const,
                    label: "GI Suggestions",
                    desc: "Contextual suggestions from the GI",
                  },
                  {
                    key: "systemUpdates" as const,
                    label: "System Updates",
                    desc: "Platform announcements and updates",
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between rounded-lg border border-[#E5E7EB] p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">
                        {item.label}
                      </p>
                      <p className="text-xs text-[#9CA3AF]">{item.desc}</p>
                    </div>
                    <button
                      onClick={() =>
                        setNotifPrefs((p) => ({
                          ...p,
                          [item.key]: !p[item.key],
                        }))
                      }
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        notifPrefs[item.key] ? "bg-[#2E86AB]" : "bg-[#D1D5DB]"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                          notifPrefs[item.key]
                            ? "translate-x-[22px]"
                            : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-[#1A1A1A]">
                  Appearance
                </h2>
                <p className="text-xs text-[#9CA3AF]">
                  Customize how Daftar looks for you
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-medium text-[#6B7280]">
                    Sidebar
                  </label>
                  <div className="flex gap-3">
                    <button className="rounded-lg border-2 border-[#2E86AB] bg-[#F8F9FA] px-4 py-3 text-sm font-medium text-[#1A1A1A]">
                      Expanded
                    </button>
                    <button className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#6B7280] hover:border-[#2E86AB]">
                      Collapsed
                    </button>
                  </div>
                </div>

                <Separator />

                <div>
                  <label className="mb-2 block text-xs font-medium text-[#6B7280]">
                    Density
                  </label>
                  <div className="flex gap-3">
                    <button className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#6B7280] hover:border-[#2E86AB]">
                      Comfortable
                    </button>
                    <button className="rounded-lg border-2 border-[#2E86AB] bg-[#F8F9FA] px-4 py-3 text-sm font-medium text-[#1A1A1A]">
                      Compact
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
