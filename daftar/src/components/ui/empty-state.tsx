"use client";

import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center ${className ?? ""}`}>
      <Icon className="h-10 w-10 text-[#D1D5DB]" />
      <h3 className="mt-3 text-sm font-medium text-[#6B7280]">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-[#9CA3AF]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
