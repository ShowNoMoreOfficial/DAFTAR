"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Link2,
  X,
  ExternalLink,
  RefreshCw,
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
  tokenExpiresAt: string | null;
  connectedAt: string;
  brand: { id: string; name: string };
}

interface BrandData {
  id: string;
  name: string;
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
  const [brands, setBrands] = useState<BrandData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogPlatform, setDialogPlatform] = useState("");
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchConnections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/relay/connections");
      if (res.ok) {
        const data = await res.json();
        setConnections(Array.isArray(data) ? data : data.data || []);
      }
    } catch {
      // fail gracefully
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBrands = useCallback(async () => {
    try {
      const res = await fetch("/api/brands");
      if (res.ok) {
        const data = await res.json();
        setBrands(Array.isArray(data) ? data : data.data || []);
      }
    } catch {
      // fail gracefully
    }
  }, []);

  useEffect(() => {
    fetchConnections();
    fetchBrands();
  }, [fetchConnections, fetchBrands]);

  // Handle OAuth redirect results
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const error = params.get("error");

    if (connected) {
      const label = PLATFORM_CONFIG[connected]?.label || connected;
      setToast({ type: "success", message: `${label} connected successfully!` });
      fetchConnections();
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    } else if (error) {
      setToast({ type: "error", message: error });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [fetchConnections]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const getConnectionsForPlatform = (platform: string) => {
    return connections.filter((c) => c.platform === platform && c.isActive);
  };

  const openConnectDialog = (platform: string) => {
    setDialogPlatform(platform);
    setSelectedBrandId(brands.length === 1 ? brands[0].id : "");
    setDialogOpen(true);
  };

  const handleConnect = () => {
    if (!selectedBrandId || !dialogPlatform) return;
    setConnecting(true);
    // Redirect to OAuth initiation endpoint
    window.location.href = `/api/relay/oauth/${dialogPlatform}?brandId=${selectedBrandId}`;
  };

  const handleDisconnect = async (connectionId: string) => {
    try {
      const res = await fetch(`/api/relay/connections?id=${connectionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setConnections((prev) => prev.filter((c) => c.id !== connectionId));
        setToast({ type: "success", message: "Platform disconnected" });
      }
    } catch {
      setToast({ type: "error", message: "Failed to disconnect" });
    }
  };

  const isTokenExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
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
      {/* Toast notification */}
      {toast && (
        <div
          className={cn(
            "fixed right-6 top-20 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all",
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          )}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 opacity-50 hover:opacity-100">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

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
                  {platformConnections.map((conn) => {
                    const expired = isTokenExpired(conn.tokenExpiresAt);
                    return (
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
                          {expired ? (
                            <span className="rounded-full bg-[rgba(239,68,68,0.15)] px-2 py-0.5 text-[9px] font-medium text-red-700">
                              Expired
                            </span>
                          ) : (
                            <span className="rounded-full bg-[rgba(16,185,129,0.15)] px-2 py-0.5 text-[9px] font-medium text-emerald-700">
                              Connected
                            </span>
                          )}
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
                    );
                  })}
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
                {isConnected ? (
                  <>
                    <RefreshCw className="mr-1.5 h-3 w-3" />
                    Reconnect
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-1.5 h-3 w-3" />
                    Connect Account
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Connect dialog */}
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

            <p className="mb-4 text-xs text-[var(--text-muted)]">
              Select the brand to connect to {PLATFORM_CONFIG[dialogPlatform]?.label}.
              You&apos;ll be redirected to authorize access.
            </p>

            {/* Brand selector */}
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              Brand
            </label>
            <select
              value={selectedBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="mb-4 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
            >
              <option value="">Select a brand...</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1"
                disabled={!selectedBrandId || connecting}
                onClick={handleConnect}
              >
                {connecting ? (
                  <>
                    <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-1.5 h-3 w-3" />
                    Connect
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
