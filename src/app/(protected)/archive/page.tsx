export const fetchCache = "default-cache";
export const revalidate = 30;

import { Suspense } from "react";
import { ArchivedTasksTable } from "@/components/archived-tasks-table";
import { getTasksByStatus } from "@/lib/tasks/services/queries";
import { ArchivedTasksTableSkeleton } from "@/components/skeletons/archived-tasks-table-skeleton";
import { TaskStatus } from "@/lib/tasks/enums";

// Async component to fetch and render archived tasks
async function ArchivedTasksList() {
  const archivedTasks = await getTasksByStatus([
    TaskStatus.DONE,
    TaskStatus.CANCELED,
  ]);
  return <ArchivedTasksTable data={archivedTasks} />;
}

export default function ArchivePage() {
  // Note: No async here
  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Archive</h1>
        <p className="text-muted-foreground">
          View completed and canceled tasks
        </p>
      </div>

      {/* Wrap the async component in Suspense */}
      <Suspense fallback={<ArchivedTasksTableSkeleton />}>
        <ArchivedTasksList />
      </Suspense>
    </div>
  );
}
