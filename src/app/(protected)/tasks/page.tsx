export const fetchCache = "default-cache";
export const revalidate = 0;

import { Suspense } from "react";
import { getTasks } from "@/lib/tasks/services";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { TasksTable } from "@/components/tasks/tasks-table";
import { TasksTableSkeleton } from "@/components/skeletons/tasks-table-skeleton";
import { getProfile } from "@/lib/profile/services";

async function TasksTableShell() {
  const qc = new QueryClient();

  await qc.prefetchQuery({
    queryKey: ["tasks"],
    queryFn: () => getTasks(),
  });

  await qc.prefetchQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  });

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <Suspense fallback={<TasksTableSkeleton />}>
        <TasksTable />
      </Suspense>
    </HydrationBoundary>
  );
}

// Updated ArchivePage to be async and use react-query prefetching
export default function TaskPage() {
  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground">View all tasks</p>
      </div>
      <TasksTableShell />
    </div>
  );
}
