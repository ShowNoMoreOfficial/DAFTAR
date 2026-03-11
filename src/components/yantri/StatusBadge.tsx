import { Badge } from "@/components/ui/badge";

const statusColors: Record<string, string> = {
  pending: "bg-[rgba(245,158,11,0.1)]0/10 text-amber-400 border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.15)]",
  selected: "bg-[rgba(16,185,129,0.1)]0/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]",
  skipped: "bg-zinc-800 text-zinc-500 border-zinc-700",
  monitoring: "bg-[rgba(99,102,241,0.1)]0/10 text-indigo-400 border-indigo-500/20",
  planned: "bg-[rgba(99,102,241,0.1)]0/10 text-indigo-400 border-indigo-500/20",
  researching: "bg-[rgba(99,102,241,0.1)]0/15 text-indigo-300 border-indigo-500/20 animate-pulse",
  producing: "bg-[rgba(249,115,22,0.1)]0/10 text-orange-400 border-orange-500/20 shadow-[0_0_8px_rgba(249,115,22,0.15)]",
  published: "bg-[rgba(59,130,246,0.1)]0/10 text-blue-400 border-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.15)]",
  killed: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

export default function StatusBadge({ status }: { status: string }) {
  const color = statusColors[status] || "bg-zinc-800 text-zinc-500 border-zinc-700";
  return (
    <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-widest ${color}`}>
      {status}
    </Badge>
  );
}
