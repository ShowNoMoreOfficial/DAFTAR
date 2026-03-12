"use client";

import Link from "next/link";
import type { Role } from "@prisma/client";
import { Radar, PenTool, CheckSquare, Send, Users, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickNavProps {
  role: Role;
}

const LINKS = [
  { label: "Intelligence", href: "/intelligence", icon: Radar, color: "text-blue-500", bg: "bg-blue-500/10", roles: ["ADMIN", "DEPT_HEAD", "MEMBER"] },
  { label: "Content Studio", href: "/content-studio", icon: PenTool, color: "text-teal-500", bg: "bg-teal-500/10", roles: ["ADMIN", "DEPT_HEAD", "MEMBER"] },
  { label: "Tasks", href: "/pms/board", icon: CheckSquare, color: "text-emerald-500", bg: "bg-emerald-500/10", roles: ["ADMIN", "HEAD_HR", "DEPT_HEAD", "MEMBER", "CONTRACTOR"] },
  { label: "Publishing", href: "/relay/calendar", icon: Send, color: "text-cyan-500", bg: "bg-cyan-500/10", roles: ["ADMIN", "DEPT_HEAD", "MEMBER"] },
  { label: "Team", href: "/hoccr", icon: Users, color: "text-purple-500", bg: "bg-purple-500/10", roles: ["ADMIN", "HEAD_HR", "DEPT_HEAD"] },
  { label: "Editorial", href: "/m/vritti", icon: FileText, color: "text-orange-500", bg: "bg-orange-500/10", roles: ["ADMIN", "DEPT_HEAD", "MEMBER"] },
];

export function QuickNav({ role }: QuickNavProps) {
  const visible = LINKS.filter((l) => l.roles.includes(role));
  if (visible.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {visible.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="group flex flex-col items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-4 transition-all hover:border-[#2E86AB]/30 hover:shadow-sm"
        >
          <div className={cn("rounded-lg p-2", link.bg)}>
            <link.icon className={cn("h-5 w-5", link.color)} />
          </div>
          <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
            {link.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
