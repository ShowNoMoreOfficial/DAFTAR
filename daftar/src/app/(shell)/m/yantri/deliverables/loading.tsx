import { Skeleton } from "@/components/ui/skeleton";

export default function DeliverablesLoading() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-full" />
      {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
    </div>
  );
}
