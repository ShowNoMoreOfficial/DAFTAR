"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/sidebar-store";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function RightPanel() {
  const { isRightPanelOpen, rightPanelContent, closeRightPanel } =
    useSidebarStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isRightPanelOpen) {
        closeRightPanel();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isRightPanelOpen, closeRightPanel]);

  if (!isRightPanelOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={closeRightPanel}
      />

      {/* Panel */}
      <aside className="fixed right-0 top-0 z-50 h-screen w-[380px] border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)]">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] p-4">
          <h3 className="text-sm font-medium text-[var(--text-primary)]">Details</h3>
          <Button variant="ghost" size="icon" onClick={closeRightPanel} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="overflow-y-auto p-6">
          {rightPanelContent || (
            <p className="text-sm text-[var(--text-muted)]">
              Select an item to view details.
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
