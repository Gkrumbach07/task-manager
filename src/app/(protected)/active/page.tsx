export const fetchCache = "default-cache";
export const revalidate = 0;

import { Suspense } from "react";
import { getTasksByStatus } from "@/lib/tasks/services";
import { CreateTaskButton } from "@/components/create-task-button";
import { TaskListSkeleton } from "@/components/skeletons/task-list-skeleton";
import { TaskStatus } from "@/lib/tasks/enums";
import { Skeleton } from "@/components/ui/skeleton";
import { getProfile } from "@/lib/profile/services";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import TaskListByStatus from "@/components/task-list/task-list-by-status";
import TimeInfo from "@/components/time-info";

async function ActiveTasksShell() {
  const qc = new QueryClient();

  await qc.prefetchQuery({
    queryKey: ["tasks", "active"],
    queryFn: () => getTasksByStatus([TaskStatus.ACTIVE]),
  });

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <Suspense fallback={<TaskListSkeleton />}>
        <TaskListByStatus status={TaskStatus.ACTIVE} />
      </Suspense>
    </HydrationBoundary>
  );
}

async function TimeInfoShell() {
  const qc = new QueryClient();

  await qc.prefetchQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  });

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <Suspense fallback={<Skeleton className="h-4 w-32" />}>
        <TimeInfo />
      </Suspense>
    </HydrationBoundary>
  );
}

export default function ActivePage() {
  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Active Tasks</h1>
          <p className="text-muted-foreground">
            <TimeInfoShell />
          </p>
        </div>
        <CreateTaskButton />
      </div>
      <div className="space-y-6">
        <ActiveTasksShell />
      </div>
    </div>
  );
}
