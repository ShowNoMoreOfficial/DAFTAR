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

  return (
    <>
      {/* Overlay */}
      {isRightPanelOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={closeRightPanel}
        />
      )}

      {/* Panel */}
      <aside
        className={cn(
          "fixed right-0 top-0 z-50 h-screen w-[360px] border-l border-[#E5E7EB] bg-white shadow-lg transition-transform duration-300",
          isRightPanelOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-[#E5E7EB] p-4">
          <h3 className="text-sm font-medium text-[#1A1A1A]">Details</h3>
          <Button variant="ghost" size="icon" onClick={closeRightPanel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="overflow-y-auto p-4">
          {rightPanelContent || (
            <p className="text-sm text-[#9CA3AF]">
              Select an item to view details.
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
