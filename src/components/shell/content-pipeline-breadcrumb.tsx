"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Radio,
  Search,
  Brain,
  PenTool,
  Eye,
  Clapperboard,
  Send,
} from "lucide-react";

const PIPELINE_STEPS = [
  { id: "signals", label: "Signals", icon: Radio, href: "/m/khabri", paths: ["/m/khabri"] },
  { id: "research", label: "Research", icon: Search, href: "/m/yantri/narrative-trees", paths: ["/m/yantri/narrative-trees"] },
  { id: "strategy", label: "Strategy", icon: Brain, href: "/m/yantri", paths: ["/m/yantri/trends"] },
  { id: "content", label: "Content", icon: PenTool, href: "/m/yantri/workspace", paths: ["/m/yantri/workspace", "/m/yantri/prompt-library", "/m/yantri/platform-rules"] },
  { id: "review", label: "Review", icon: Eye, href: "/m/yantri/workspace?status=pending_review", paths: ["/m/yantri/history"] },
  { id: "production", label: "Production", icon: Clapperboard, href: "/pms", paths: ["/pms"] },
  { id: "published", label: "Published", icon: Send, href: "/relay", paths: ["/relay"] },
];

// Pages where the pipeline breadcrumb should appear
const PIPELINE_PAGES = [
  "/m/khabri",
  "/m/yantri",
  "/pms",
  "/relay",
];

export function ContentPipelineBreadcrumb() {
  const pathname = usePathname();

  // Only show on pipeline-related pages
  const isOnPipelinePage = PIPELINE_PAGES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (!isOnPipelinePage) return null;

  // Find the active step
  const activeStepIndex = PIPELINE_STEPS.findIndex((step) =>
    step.paths.some((p) => pathname === p || pathname.startsWith(p + "/"))
  );

  return (
    <div className="mb-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3">
      <div className="flex items-center justify-between gap-1 overflow-x-auto">
        {PIPELINE_STEPS.map((step, index) => {
          const isActive = index === activeStepIndex;
          const isPast = index < activeStepIndex;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex items-center">
              <Link
                href={step.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap",
                  isActive
                    ? "bg-[rgba(0,212,170,0.12)] text-[var(--accent-primary)]"
                    : isPast
                      ? "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                      : "text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)]"
                )}
              >
                <Icon
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    isActive ? "text-[var(--accent-primary)]" : isPast ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]"
                  )}
                  strokeWidth={isActive ? 2 : 1.5}
                />
                <span className="hidden sm:inline">{step.label}</span>
              </Link>

              {index < PIPELINE_STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-1 h-px w-4 shrink-0 sm:w-6",
                    index < activeStepIndex
                      ? "bg-[var(--accent-primary)]"
                      : "bg-[var(--border-subtle)]"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
