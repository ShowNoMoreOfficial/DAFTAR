"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Radio,
  PenTool,
  CheckSquare,
  FileText,
  IndianRupee,
  Megaphone,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CREATE_OPTIONS = [
  {
    id: "signal",
    label: "Push a new signal",
    description: "Add a topic or event for the content pipeline",
    icon: Radio,
    href: "/m/khabri/signals?action=create",
    color: "text-[#6366f1]",
    bg: "bg-[rgba(99,102,241,0.1)]",
  },
  {
    id: "content",
    label: "Generate content from topic",
    description: "Start the full pipeline: research, strategy, creation",
    icon: PenTool,
    href: "/m/yantri/workspace?action=create",
    color: "text-[var(--accent-primary)]",
    bg: "bg-[rgba(0,212,170,0.1)]",
  },
  {
    id: "task",
    label: "Create a task",
    description: "Add a new task and assign it to a team member",
    icon: CheckSquare,
    href: "/pms?action=create",
    color: "text-[var(--status-success)]",
    bg: "bg-[rgba(16,185,129,0.1)]",
  },
  {
    id: "article",
    label: "Write an article",
    description: "Create a new editorial piece in the CMS",
    icon: FileText,
    href: "/m/vritti/articles?action=create",
    color: "text-[var(--accent-tertiary)]",
    bg: "bg-[rgba(245,158,11,0.1)]",
  },
  {
    id: "invoice",
    label: "Create an invoice",
    description: "Generate a new invoice for a client",
    icon: IndianRupee,
    href: "/finance/invoices?action=create",
    color: "text-[var(--accent-secondary)]",
    bg: "bg-[rgba(162,59,114,0.1)]",
  },
  {
    id: "announcement",
    label: "Post an announcement",
    description: "Share news or updates with the team",
    icon: Megaphone,
    href: "/communication?action=create",
    color: "text-[#f97316]",
    bg: "bg-[rgba(249,115,22,0.1)]",
  },
];

export function QuickCreateModal({ open, onOpenChange }: QuickCreateModalProps) {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onOpenChange(false);
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % CREATE_OPTIONS.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + CREATE_OPTIONS.length) % CREATE_OPTIONS.length);
          break;
        case "Enter":
          e.preventDefault();
          router.push(CREATE_OPTIONS[selectedIndex].href);
          onOpenChange(false);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, selectedIndex, router, onOpenChange]);

  // Reset selection when opening
  useEffect(() => {
    if (open) setSelectedIndex(0);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)] animate-in fade-in slide-in-from-top-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            What do you want to create?
          </h2>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Options */}
        <div className="p-2">
          {CREATE_OPTIONS.map((option, index) => (
            <button
              key={option.id}
              onClick={() => {
                router.push(option.href);
                onOpenChange(false);
              }}
              onMouseEnter={() => setSelectedIndex(index)}
              className={cn(
                "flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left transition-all duration-150",
                index === selectedIndex
                  ? "bg-[var(--bg-elevated)]"
                  : "hover:bg-[var(--bg-elevated)]"
              )}
            >
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", option.bg)}>
                <option.icon className={cn("h-5 w-5", option.color)} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {option.label}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {option.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <div className="border-t border-[var(--border-subtle)] px-5 py-3">
          <p className="text-center text-[10px] text-[var(--text-muted)]">
            Navigate with <kbd className="rounded bg-[var(--bg-elevated)] px-1 py-0.5 font-mono">↑↓</kbd> and select with <kbd className="rounded bg-[var(--bg-elevated)] px-1 py-0.5 font-mono">Enter</kbd>
          </p>
        </div>
      </div>
    </div>
  );
}
