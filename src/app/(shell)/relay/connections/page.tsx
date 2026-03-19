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

const PLATFORM_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  youtube: {
    label: "YouTube",
    color: "#FF0000",
    bgColor: "bg-[rgba(239,68,68,0.1)]",
  },
  x: {
    label: "X (Twitter)",
    color: "#000000",
    bgColor: "bg-[var(--bg-elevated)]",
  },
  instagram: {
    label: "Instagram",
    color: "#E4405F",
    bgColor: "bg-[rgba(236,72,153,0.1)]",
  },
  facebook: {
    label: "Facebook",
    color: "#1877F2",
    bgColor: "bg-[rgba(59,130,246,0.1)]",
  },
  linkedin: {
    label: "LinkedIn",
    color: "#0A66C2",
    bgColor: "bg-[rgba(59,130,246,0.1)]",
  },
};

const PLATFORMS = ["youtube", "x", "instagram", "facebook", "linkedin"];

// ─── Component ──────────────────────────────────────────

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<PlatformConnectionData[]>([]);
  const [brands, setBrands] = useState<BrandData[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null); // "brandId-platform"
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

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
      setToast({
        type: "success",
        message: `${label} connected successfully!`,
      });
      fetchConnections();
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

  const getConnection = (brandId: string, platform: string) => {
    return connections.find(
      (c) => c.brandId === brandId && c.platform === platform && c.isActive
    );
  };

  const handleConnect = (brandId: string, platform: string) => {
    setConnecting(`${brandId}-${platform}`);
    window.location.href = `/api/relay/oauth/${platform}?brandId=${brandId}`;
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

  const getBrandConnectionCount = (brandId: string) => {
    return connections.filter((c) => c.brandId === brandId && c.isActive)
      .length;
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
          <button
            onClick={() => setToast(null)}
            className="ml-2 opacity-50 hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Platform Connections
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          Connect social media accounts for each brand to enable content
          distribution
        </p>
      </div>

      {/* Brand sections */}
      <div className="space-y-8">
        {brands.map((brand) => {
          const connectedCount = getBrandConnectionCount(brand.id);
          return (
            <div key={brand.id}>
              {/* Brand header */}
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-primary)] text-xs font-bold text-white">
                  {brand.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    {brand.name}
                  </h3>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {connectedCount}/{PLATFORMS.length} platforms connected
                  </p>
                </div>
              </div>

              {/* Platform rows for this brand */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {PLATFORMS.map((platform) => {
                  const config = PLATFORM_CONFIG[platform];
                  const conn = getConnection(brand.id, platform);
                  const expired = conn
                    ? isTokenExpired(conn.tokenExpiresAt)
                    : false;
                  const isConnecting =
                    connecting === `${brand.id}-${platform}`;

                  return (
                    <div
                      key={platform}
                      className={cn(
                        "rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 transition-shadow hover:shadow-sm",
                        conn && !expired && "border-emerald-200"
                      )}
                    >
                      {/* Platform icon + name */}
                      <div className="mb-3 flex items-center gap-2.5">
                        <div
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg",
                            config.bgColor
                          )}
                        >
                          <div
                            className="h-4 w-4 rounded"
                            style={{ backgroundColor: config.color }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[var(--text-primary)]">
                            {config.label}
                          </p>
                        </div>
                        {conn && !expired && (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                        )}
                        {conn && expired && (
                          <XCircle className="h-4 w-4 shrink-0 text-amber-500" />
                        )}
                      </div>

                      {/* Connection status */}
                      {conn ? (
                        <div className="mb-3">
                          <p className="truncate text-[11px] font-medium text-[var(--text-primary)]">
                            {conn.accountName || conn.accountId || "Connected"}
                          </p>
                          <p className="text-[10px] text-[var(--text-muted)]">
                            {expired ? (
                              <span className="text-amber-600">
                                Token expired
                              </span>
                            ) : (
                              <>
                                Connected{" "}
                                {new Date(conn.connectedAt).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "numeric",
                                    month: "short",
                                  }
                                )}
                              </>
                            )}
                          </p>
                        </div>
                      ) : (
                        <div className="mb-3 flex items-center gap-1.5 py-1">
                          <Link2 className="h-3 w-3 text-[var(--text-muted)]" />
                          <p className="text-[10px] text-[var(--text-muted)]">
                            Not connected
                          </p>
                        </div>
                      )}

                      {/* Action buttons */}
                      {conn ? (
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-[10px] h-7"
                            disabled={isConnecting}
                            onClick={() =>
                              handleConnect(brand.id, platform)
                            }
                          >
                            {isConnecting ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <RefreshCw className="mr-1 h-2.5 w-2.5" />
                                Reconnect
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-[10px] text-red-500 hover:bg-[rgba(239,68,68,0.1)] hover:text-red-600"
                            onClick={() => handleDisconnect(conn.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          className="w-full text-[10px] h-7"
                          disabled={isConnecting}
                          onClick={() =>
                            handleConnect(brand.id, platform)
                          }
                        >
                          {isConnecting ? (
                            <>
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              Redirecting...
                            </>
                          ) : (
                            <>
                              <ExternalLink className="mr-1 h-2.5 w-2.5" />
                              Connect
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {brands.length === 0 && (
          <div className="rounded-xl border border-dashed border-[var(--border-subtle)] p-12 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              No brands found. Create brands in Settings first.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
