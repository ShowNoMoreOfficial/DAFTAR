import { Skeleton } from "@/components/ui/skeleton";

export default function ContentTypesLoading() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(9)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
      </div>
    </div>
  );
}
