import { Skeleton } from "@/components/ui/skeleton";

// Skeleton component for fallback UI
export function TaskListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="flex items-center space-x-4 p-4 border rounded-lg"
        >
          <div className="space-y-2 flex-grow">
            <Skeleton className="h-4 w-1/5" />
            <Skeleton className="h-4 w-1/4" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}
