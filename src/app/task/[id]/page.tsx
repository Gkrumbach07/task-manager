"use client";

import { useParams } from "next/navigation";
import { TaskDetail } from "@/components/task-detail";
import { getChildTasks, getTaskById } from "@/lib/data";

export default function TaskPage() {
  const { id } = useParams<{ id: string }>();
  const task = getTaskById(id);
  const parentTask = task?.parentId ? getTaskById(task.parentId) : null;
  const childTasks = getChildTasks(id);

  if (!task) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Task Not Found</h1>
        <p className="text-muted-foreground">
          The task you are looking for does not exist or has been deleted.
        </p>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <TaskDetail task={task} parentTask={parentTask} childTasks={childTasks} />
    </div>
  );
}
