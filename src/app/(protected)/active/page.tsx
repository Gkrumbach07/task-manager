export const fetchCache = "default-cache";
export const revalidate = 0;

import { Suspense } from "react";
import { TaskList } from "@/components/task-list";
import { getTasksByStatus } from "@/lib/tasks/services/queries";
import { CreateTaskButton } from "@/components/create-task-button";
import { TaskListSkeleton } from "@/components/skeletons/task-list-skeleton";
import { TaskStatus } from "@/lib/tasks/enums";
import { Skeleton } from "@/components/ui/skeleton";
import { getProfile } from "@/lib/profile/services/queries";
import { QueryClient } from "@tanstack/react-query";

async function ActiveTasksList() {
  const activeTasks = await getTasksByStatus([TaskStatus.ACTIVE]);
  return <TaskList tasks={activeTasks} />;
}

async function getTimeInfo() {
  const profile = await getProfile();
  const dateString = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  if (profile) {
    return `${dateString} • Sprint ${profile.timeConfig.currentSprint} • Quarter ${profile.timeConfig.currentQuarter}`;
  }
  return dateString;
}

export default async function ActivePage() {
  // prefetch
  const qc = new QueryClient();
  await qc.prefetchQuery({
    queryKey: ["tasks", "active"],
    queryFn: () => getTasksByStatus([TaskStatus.ACTIVE]),
  });

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Active Tasks</h1>
          <Suspense fallback={<Skeleton className="h-4 w-32" />}>
            <p className="text-muted-foreground">{getTimeInfo()}</p>
          </Suspense>
        </div>
        <CreateTaskButton />
      </div>
      <div className="space-y-6">
        <Suspense fallback={<TaskListSkeleton />}>
          <ActiveTasksList />
        </Suspense>
      </div>
    </div>
  );
}
