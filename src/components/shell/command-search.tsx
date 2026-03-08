"use client";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Kanban,
  Brain,
  Newspaper,
  FileText,
  Settings,
} from "lucide-react";

interface CommandSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QUICK_LINKS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Yantri", href: "/m/yantri", icon: Brain },
  { label: "Khabri", href: "/m/khabri", icon: Newspaper },
  { label: "PMS", href: "/pms", icon: Kanban },
  { label: "HOCCR", href: "/hoccr", icon: Users },
  { label: "Vritti", href: "/m/vritti", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function CommandSearch({ open, onOpenChange }: CommandSearchProps) {
  const router = useRouter();

  const navigate = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search modules, tasks, people..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Quick Navigation">
          {QUICK_LINKS.map((link) => (
            <CommandItem
              key={link.href}
              onSelect={() => navigate(link.href)}
              className="gap-2"
            >
              <link.icon className="h-4 w-4 text-[#9CA3AF]" />
              {link.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
