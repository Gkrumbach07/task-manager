export const fetchCache = "default-cache";
export const revalidate = 30;

import { Suspense } from "react";
import { TaskList } from "@/components/task-list";
import { getTasksByStatus } from "@/lib/tasks/services/queries";
import { CreateTaskButton } from "@/components/create-task-button";
import { TaskListSkeleton } from "@/components/skeletons/task-list-skeleton";
import { TaskStatus } from "@/lib/tasks/enums";
// Async component to fetch and render backlog tasks
async function BacklogTasksList() {
  const backlogTasks = await getTasksByStatus([TaskStatus.BACKLOG]);
  return <TaskList tasks={backlogTasks} />;
}

export default function BacklogPage() {
  // Note: No async here
  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Backlog</h1>
        </div>
        <CreateTaskButton />
      </div>

      {/* Wrap the async component in Suspense */}
      <div className="space-y-6">
        {" "}
        {/* Added wrapper div like in active page */}
        <Suspense fallback={<TaskListSkeleton />}>
          <BacklogTasksList />
        </Suspense>
      </div>
    </div>
  );
}
