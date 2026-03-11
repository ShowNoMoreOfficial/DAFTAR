import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-8 w-40" />
      <div className="space-y-4">
        <Skeleton className="h-12 w-full max-w-lg rounded-xl" />
        <Skeleton className="h-12 w-full max-w-lg rounded-xl" />
        <Skeleton className="h-12 w-full max-w-lg rounded-xl" />
        <Skeleton className="h-12 w-full max-w-lg rounded-xl" />
      </div>
      <Skeleton className="h-10 w-32 rounded-lg" />
    </div>
  );
}
