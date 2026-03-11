import { Skeleton } from "@/components/ui/skeleton";

export default function DossiersLoading() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-full max-w-sm" />
      {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
    </div>
  );
}
