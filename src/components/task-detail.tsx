"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskModal } from "@/components/task-modal";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit,
  ExternalLink,
  Folder,
  Github,
} from "lucide-react";
import {
  type Task,
  formatDueDate,
  getPriorityColor,
  getStatusColor,
  updateTask,
} from "@/lib/queries/tasks";
import { Markdown } from "@/components/markdown";
import { useToast } from "@/hooks/use-toast";

type TaskDetailProps = {
  task: Task;
  parentTask?: Task | null;
  childTasks?: Task[];
};

export function TaskDetail({
  task,
  parentTask,
  childTasks = [],
}: TaskDetailProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(task);
  const { toast } = useToast();

  const renderSourceIcon = (source: Task["source"]) => {
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
      const updatedTask = await updateTask(task.id, { body: newContent });
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
          <Link
            href={currentTask.status === "Active" ? "/active" : "/backlog"}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
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
                Created: {currentTask.createdDate.toLocaleDateString()}
              </Badge>
              {currentTask.source && (
                <Badge variant="outline" className="flex items-center gap-1">
                  {renderSourceIcon(currentTask.source)}
                  {currentTask.source}
                </Badge>
              )}
              {parentTask && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Folder className="h-3 w-3" />
                  Parent: {parentTask.title}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="description" className="w-full">
            <TabsList>
              <TabsTrigger value="description">Description</TabsTrigger>
              {childTasks.length > 0 && (
                <TabsTrigger value="subtasks">
                  Sub-tasks ({childTasks.length})
                </TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="description" className="pt-4">
              <div className="prose dark:prose-invert max-w-none">
                <Markdown
                  content={currentTask.body || ""}
                  onSave={handleDescriptionSave}
                />
              </div>
            </TabsContent>
            {childTasks.length > 0 && (
              <TabsContent value="subtasks" className="pt-4">
                <div className="space-y-4">
                  {childTasks.map((childTask) => (
                    <Card key={childTask.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Link
                              href={`/task/${childTask.id}`}
                              className="font-medium hover:underline"
                            >
                              {childTask.title}
                            </Link>
                            <div className="mt-1 flex flex-wrap gap-2">
                              <Badge
                                className={getPriorityColor(childTask.priority)}
                              >
                                {childTask.priority}
                              </Badge>
                              <Badge
                                className={getStatusColor(childTask.status)}
                              >
                                {childTask.status}
                              </Badge>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/task/${childTask.id}`}>View</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Task ID: {currentTask.id}
          </div>
          <div className="flex gap-2">
            {currentTask.status === "Backlog" && (
              <Button variant="default">Move to Active</Button>
            )}
            {currentTask.status === "Active" && (
              <Button variant="default">Mark as Done</Button>
            )}
            {(currentTask.status === "Backlog" ||
              currentTask.status === "Active") && (
              <Button variant="outline">Cancel Task</Button>
            )}
          </div>
        </CardFooter>
      </Card>

      <TaskModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSubmit={(data) => {
          console.log("Update task:", data);
          // In a real app, this would update the task
        }}
        defaultValues={currentTask}
      />
    </div>
  );
}
