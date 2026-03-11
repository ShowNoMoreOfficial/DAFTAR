"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Link2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────

interface PlatformConnectionData {
  id: string;
  brandId: string;
  platform: string;
  accountId: string | null;
  accountName: string | null;
  isActive: boolean;
  connectedAt: string;
  brand: { id: string; name: string };
}

// ─── Constants ──────────────────────────────────────────

const PLATFORM_CONFIG: Record<string, { label: string; color: string; bgColor: string; description: string }> = {
  youtube: {
    label: "YouTube",
    color: "#FF0000",
    bgColor: "bg-[rgba(239,68,68,0.1)]",
    description: "Upload videos, shorts, and manage your channel",
  },
  x: {
    label: "X (Twitter)",
    color: "#000000",
    bgColor: "bg-[var(--bg-elevated)]",
    description: "Post tweets, threads, and engage with followers",
  },
  instagram: {
    label: "Instagram",
    color: "#E4405F",
    bgColor: "bg-[rgba(236,72,153,0.1)]",
    description: "Share photos, reels, stories, and carousels",
  },
  linkedin: {
    label: "LinkedIn",
    color: "#0A66C2",
    bgColor: "bg-[rgba(59,130,246,0.1)]",
    description: "Publish professional content and articles",
  },
  facebook: {
    label: "Facebook",
    color: "#1877F2",
    bgColor: "bg-[rgba(59,130,246,0.1)]",
    description: "Manage page posts, stories, and engagement",
  },
};

const PLATFORMS = ["youtube", "x", "instagram", "linkedin", "facebook"];

// ─── Component ──────────────────────────────────────────

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<PlatformConnectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogPlatform, setDialogPlatform] = useState("");

  const fetchConnections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/relay/connections");
      if (res.ok) {
        const data = await res.json();
        setConnections(Array.isArray(data) ? data : data.data || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const getConnectionsForPlatform = (platform: string) => {
    return connections.filter((c) => c.platform === platform && c.isActive);
  };

  const openConnectDialog = (platform: string) => {
    setDialogPlatform(platform);
    setDialogOpen(true);
  };

  const handleDisconnect = async (connectionId: string) => {
    try {
      const res = await fetch(`/api/relay/connections?id=${connectionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setConnections((prev) => prev.filter((c) => c.id !== connectionId));
      }
    } catch {
      // silently fail — user can retry
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-primary)]" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Platform Connections</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Connect your social media accounts to enable content distribution
        </p>
      </div>

      {/* Platform cards grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {PLATFORMS.map((platform) => {
          const config = PLATFORM_CONFIG[platform];
          const platformConnections = getConnectionsForPlatform(platform);
          const isConnected = platformConnections.length > 0;

          return (
            <div
              key={platform}
              className={cn(
                "rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 transition-shadow hover:shadow-sm"
              )}
            >
              {/* Platform header */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn("flex h-10 w-10 items-center justify-center rounded-lg", config.bgColor)}
                  >
                    <div
                      className="h-5 w-5 rounded"
                      style={{ backgroundColor: config.color }}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">{config.label}</h3>
                    <p className="text-[10px] text-[var(--text-muted)]">{config.description}</p>
                  </div>
                </div>
                {isConnected ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-[var(--text-muted)]" />
                )}
              </div>

              {/* Connected accounts */}
              {isConnected ? (
                <div className="mb-3 space-y-2">
                  {platformConnections.map((conn) => (
                    <div
                      key={conn.id}
                      className="flex items-center justify-between rounded-lg bg-[#F8FBF9] px-3 py-2"
                    >
                      <div>
                        <p className="text-xs font-medium text-[var(--text-primary)]">
                          {conn.accountName || conn.accountId || "Connected"}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)]">
                          {conn.brand.name} &middot; Connected {new Date(conn.connectedAt).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-[rgba(16,185,129,0.15)] px-2 py-0.5 text-[9px] font-medium text-emerald-700">
                          Connected
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px] text-red-500 hover:bg-[rgba(239,68,68,0.1)] hover:text-red-600"
                          onClick={() => handleDisconnect(conn.id)}
                        >
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mb-3 rounded-lg border border-dashed border-[var(--border-subtle)] p-3 text-center">
                  <Link2 className="mx-auto h-5 w-5 text-[var(--text-muted)]" />
                  <p className="mt-1 text-[10px] text-[var(--text-muted)]">No accounts connected</p>
                </div>
              )}

              {/* Action */}
              <Button
                size="sm"
                variant={isConnected ? "outline" : "default"}
                className="w-full text-xs"
                onClick={() => openConnectDialog(platform)}
              >
                {isConnected ? "Manage Connection" : "Connect Account"}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Connect dialog (placeholder) */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl bg-[var(--bg-surface)] p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Connect {PLATFORM_CONFIG[dialogPlatform]?.label}
              </h3>
              <button onClick={() => setDialogOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="rounded-lg bg-[#F0F8FF] p-4 text-center">
              <Link2 className="mx-auto h-8 w-8 text-[var(--accent-primary)]" />
              <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">
                API Integration Coming Soon
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                OAuth connection to {PLATFORM_CONFIG[dialogPlatform]?.label} will be available in a future update.
                For now, connections can be configured by an administrator through the API.
              </p>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
