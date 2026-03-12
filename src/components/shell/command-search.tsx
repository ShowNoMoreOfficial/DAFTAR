"use client";

import { useState, useEffect, useRef } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
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
  CheckSquare,
  Tag,
  Box,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CommandSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QUICK_LINKS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Content Studio", href: "/m/yantri", icon: Brain },
  { label: "Intelligence", href: "/m/khabri", icon: Newspaper },
  { label: "Intelligence Trends", href: "/m/khabri/trends", icon: Newspaper },
  { label: "Intelligence Signals", href: "/m/khabri/signals", icon: Newspaper },
  { label: "Intelligence Narratives", href: "/m/khabri/narratives", icon: Newspaper },
  { label: "Intelligence Geo Intel", href: "/m/khabri/geo", icon: Newspaper },
  { label: "Production Board", href: "/pms/board", icon: Kanban },
  { label: "Team & HR", href: "/hoccr", icon: Users },
  { label: "Leaderboard", href: "/leaderboard", icon: Tag },
  { label: "Editorial", href: "/m/vritti", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
];

interface SearchResults {
  users: { id: string; name: string; email: string; role: string }[];
  brands: { id: string; name: string; slug: string }[];
  modules: { id: string; name: string; displayName: string; icon: string | null }[];
  tasks: { id: string; title: string; status: string; priority: string; assignee: { name: string } | null }[];
}

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "text-[var(--status-error)]",
  HIGH: "text-[var(--accent-tertiary)]",
  MEDIUM: "text-[var(--status-info)]",
  LOW: "text-[var(--text-muted)]",
};

export function CommandSearch({ open, onOpenChange }: CommandSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults(null);
    }
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setResults(null);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const navigate = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const hasResults =
    results &&
    (results.tasks.length > 0 ||
      results.users.length > 0 ||
      results.brands.length > 0 ||
      results.modules.length > 0);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search tasks, people, brands, modules..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {query.length < 2 ? (
          <CommandGroup heading="Quick Navigation">
            {QUICK_LINKS.map((link) => (
              <CommandItem
                key={link.href}
                onSelect={() => navigate(link.href)}
                className="gap-2"
              >
                <link.icon className="h-4 w-4 text-[var(--text-muted)]" />
                {link.label}
              </CommandItem>
            ))}
          </CommandGroup>
        ) : loading ? (
          <div className="py-6 text-center text-sm text-[var(--text-muted)]">
            Searching...
          </div>
        ) : !hasResults ? (
          <CommandEmpty>No results for &ldquo;{query}&rdquo;</CommandEmpty>
        ) : (
          <>
            {results!.tasks.length > 0 && (
              <CommandGroup heading="Tasks">
                {results!.tasks.map((task) => (
                  <CommandItem
                    key={task.id}
                    onSelect={() => navigate("/tasks")}
                    className="gap-2"
                  >
                    <CheckSquare className="h-4 w-4 text-[var(--text-muted)]" />
                    <span className="flex-1 truncate">{task.title}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${PRIORITY_COLORS[task.priority] || ""}`}
                    >
                      {task.priority}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {task.status.replace("_", " ")}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results!.users.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="People">
                  {results!.users.map((u) => (
                    <CommandItem
                      key={u.id}
                      onSelect={() => navigate("/admin/users")}
                      className="gap-2"
                    >
                      <User className="h-4 w-4 text-[var(--text-muted)]" />
                      <span>{u.name}</span>
                      <span className="text-xs text-[var(--text-muted)]">{u.email}</span>
                      <Badge variant="outline" className="ml-auto text-[10px]">
                        {u.role}
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {results!.brands.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Brands">
                  {results!.brands.map((b) => (
                    <CommandItem
                      key={b.id}
                      onSelect={() => navigate("/brands")}
                      className="gap-2"
                    >
                      <Tag className="h-4 w-4 text-[var(--text-muted)]" />
                      <span>{b.name}</span>
                      <span className="text-xs text-[var(--text-muted)]">/{b.slug}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {results!.modules.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Modules">
                  {results!.modules.map((m) => (
                    <CommandItem
                      key={m.id}
                      onSelect={() => navigate(`/m/${m.name}`)}
                      className="gap-2"
                    >
                      <Box className="h-4 w-4 text-[var(--text-muted)]" />
                      <span>{m.displayName}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
