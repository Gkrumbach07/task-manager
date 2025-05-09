import { TaskDetail } from "@/components/task-detail";
import { getTaskById } from "@/lib/tasks/services";
import {
  QueryClient,
  HydrationBoundary,
  dehydrate,
} from "@tanstack/react-query";
import { notFound } from "next/navigation";

export default async function TaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const qc = new QueryClient();
  const { id } = await params;

  const task = await qc.fetchQuery({
    queryKey: ["tasks", id],
    queryFn: () => getTaskById(id),
  });

  if (!task) notFound();

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <TaskDetail taskId={id} />
    </HydrationBoundary>
  );
}
