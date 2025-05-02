export const fetchCache = "default-cache";
export const revalidate = 0;

import { Suspense } from "react";
import { getTasksByStatus } from "@/lib/tasks/services";
import { CreateTaskButton } from "@/components/create-task-button";
import { TaskListSkeleton } from "@/components/skeletons/task-list-skeleton";
import { TaskStatus } from "@/lib/tasks/enums";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import TaskListByStatus from "@/components/task-list/task-list-by-status";
import { getProfile } from "@/lib/profile/services";

// Async component shell for backlog tasks using react-query
async function BacklogTasksShell() {
  const qc = new QueryClient();

  await qc.prefetchQuery({
    queryKey: ["tasks", TaskStatus.BACKLOG],
    queryFn: () => getTasksByStatus([TaskStatus.BACKLOG]),
  });

  await qc.prefetchQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  });

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <Suspense fallback={<TaskListSkeleton />}>
        <TaskListByStatus status={TaskStatus.BACKLOG} />
      </Suspense>
    </HydrationBoundary>
  );
}

// Updated BacklogPage to be async and use react-query prefetching
export default function BacklogPage() {
  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Backlog</h1>
        </div>
        <CreateTaskButton />
      </div>
      <div className="space-y-6">
        <BacklogTasksShell />
      </div>
    </div>
  );
}
