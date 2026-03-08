"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  value: string;
  colorMap: Record<string, string>;
  className?: string;
  icon?: React.ReactNode;
  formatLabel?: (value: string) => string;
}

export function StatusBadge({ value, colorMap, className, icon, formatLabel }: StatusBadgeProps) {
  const label = formatLabel ? formatLabel(value) : value.replace(/_/g, " ");
  return (
    <Badge className={cn(colorMap[value] ?? "bg-gray-100 text-gray-700", "gap-1", className)} variant="secondary">
      {icon}
      {label}
    </Badge>
  );
}
