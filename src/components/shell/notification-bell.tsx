"use client";

import { Bell } from "lucide-react";

export function NotificationBell() {
  return (
    <button className="relative rounded-lg p-2 text-[#6B7280] transition-colors hover:bg-[#F0F2F5]">
      <Bell className="h-[18px] w-[18px]" />
      <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#A23B72] text-[9px] font-bold text-white">
        3
      </span>
    </button>
  );
}
