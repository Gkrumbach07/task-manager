"use client";

import { useQuery } from "@tanstack/react-query";
import { TaskList } from "./task-list";
import { TaskStatus } from "@/lib/tasks/enums";
import { getTasksByStatus } from "@/lib/tasks/services";
import { getProfile } from "@/lib/profile/services";

export default function TaskListByStatus({ status }: { status: TaskStatus }) {
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", status],
    queryFn: () => getTasksByStatus([status]),
    staleTime: Infinity,
  });
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    staleTime: Infinity,
  });

  return (
    <TaskList
      tasks={tasks}
      jiraBaseUrl={profile?.jiraConfig.baseUrl ?? undefined}
    />
  );
}
