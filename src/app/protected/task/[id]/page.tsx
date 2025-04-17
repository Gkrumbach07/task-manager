import { TaskDetail } from "@/components/task-detail";
import { getChildTasks, getTaskById } from "@/lib/queries/tasks";

type Props = {
  params: { id: string };
};

export default async function TaskPage({ params }: Props) {
  const { id } = await params;
  const task = await getTaskById(id);
  const parentTask = task?.parentId ? await getTaskById(task.parentId) : null;
  const childTasks = await getChildTasks(id);

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
