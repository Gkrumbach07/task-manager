export const fetchCache = "default-cache";
export const revalidate = 0;

import { Suspense } from "react";
import { ArchivedTasksTable } from "@/components/archived-tasks-table";
import { getTasksByStatus } from "@/lib/tasks/services";
import { ArchivedTasksTableSkeleton } from "@/components/skeletons/archived-tasks-table-skeleton";
import { TaskStatus } from "@/lib/tasks/enums";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

// Async component shell for archived tasks using react-query
async function ArchiveTasksShell() {
  const qc = new QueryClient();

  await qc.prefetchQuery({
    queryKey: ["tasks", "archive"],
    queryFn: () => getTasksByStatus([TaskStatus.DONE, TaskStatus.CANCELED]),
  });

  // Fetch data within the shell for Suspense
  const archivedTasks = await getTasksByStatus([
    TaskStatus.DONE,
    TaskStatus.CANCELED,
  ]);

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <Suspense fallback={<ArchivedTasksTableSkeleton />}>
        <ArchivedTasksTable data={archivedTasks} />
      </Suspense>
    </HydrationBoundary>
  );
}

// Updated ArchivePage to be async and use react-query prefetching
export default function ArchivePage() {
  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Archive</h1>
        <p className="text-muted-foreground">
          View completed and canceled tasks
        </p>
      </div>
      <ArchiveTasksShell />
    </div>
  );
}
