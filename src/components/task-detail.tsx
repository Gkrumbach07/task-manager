"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskModal } from "@/components/task-modal";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit,
  ExternalLink,
  Github,
} from "lucide-react";
import { Markdown } from "@/components/markdown";
import { useToast } from "@/hooks/use-toast";
import { getPriorityColor, getStatusColor, formatDueDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { updateTask } from "@/lib/tasks/services/mutations";
import { TaskDto } from "@/lib/tasks/schemas";
import { TaskStatus } from "@/lib/tasks/enums";

type TaskDetailProps = {
  task: TaskDto;
};

export function TaskDetail({ task }: TaskDetailProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(task);
  const { toast } = useToast();
  const router = useRouter();

  const renderSourceIcon = (source: TaskDto["source"]) => {
    if (!source) return null;

    switch (source) {
      case "GitHub PR":
        return <Github className="h-4 w-4" />;
      case "Jira Issue":
        return <ExternalLink className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleDescriptionSave = async (newContent: string) => {
    try {
      const updatedTask = await updateTask({
        id: task.id,
        body: newContent,
      });
      if (updatedTask) {
        setCurrentTask(updatedTask);
        toast({
          title: "Success",
          description: "Task description updated successfully.",
        });
      } else {
        throw new Error("Failed to update task");
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to update task description. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <a
            onClick={() => {
              router.back();
            }}
            className="flex items-center gap-2 cursor-pointer"
            href="#"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </a>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditModalOpen(true)}
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit Task
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-2xl">{currentTask.title}</CardTitle>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge className={getPriorityColor(currentTask.priority)}>
                {currentTask.priority}
              </Badge>
              <Badge className={getStatusColor(currentTask.status)}>
                {currentTask.status}
              </Badge>
              {currentTask.dueDate && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDueDate(currentTask.dueDate)}
                </Badge>
              )}
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Created: {currentTask.createdAt.toLocaleDateString()}
              </Badge>
              {currentTask.source && (
                <Badge variant="outline" className="flex items-center gap-1">
                  {renderSourceIcon(currentTask.source)}
                  {currentTask.source}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Markdown
            content={currentTask.body || ""}
            onSave={handleDescriptionSave}
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Task ID: {currentTask.id}
          </div>
          <div className="flex gap-2">
            {currentTask.status === TaskStatus.BACKLOG && (
              <Button variant="default">Move to Active</Button>
            )}
            {currentTask.status === TaskStatus.ACTIVE && (
              <Button variant="default">Mark as Done</Button>
            )}
            {(currentTask.status === TaskStatus.BACKLOG ||
              currentTask.status === TaskStatus.ACTIVE) && (
              <Button variant="outline">Cancel Task</Button>
            )}
          </div>
        </CardFooter>
      </Card>

      {isEditModalOpen && (
        <TaskModal
          onSubmit={(data) => {
            console.log("Update task:", data);
          }}
          onClose={() => setIsEditModalOpen(false)}
          defaultValues={currentTask}
        />
      )}
    </div>
  );
}
