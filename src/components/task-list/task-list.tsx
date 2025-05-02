"use client";

import type React from "react";
import Link from "next/link";
import {
  Clock,
  ExternalLink,
  MoreHorizontal,
  ArrowRight,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getPriorityColor, formatDueDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { TaskStatus } from "@/lib/tasks/enums";
import { TaskDto } from "@/lib/tasks/schemas";
import { TaskModal } from "../task-modal";
import { useState } from "react";
import { updateTaskStatus } from "@/lib/tasks/services/mutations";
import { useQueryClient } from "@tanstack/react-query";

interface TaskListProps {
  tasks: TaskDto[];
  jiraBaseUrl?: string;
  showActions?: boolean;
}

export function TaskList({
  tasks,
  jiraBaseUrl,
  showActions = true,
}: TaskListProps) {
  const { toast } = useToast();
  const [editTask, setEditTask] = useState<TaskDto | null>(null);
  const queryClient = useQueryClient();
  const handleStatusUpdate = async (
    taskId: string,
    newStatus: TaskDto["status"]
  ) => {
    try {
      await updateTaskStatus(taskId, newStatus);

      toast({
        title: "Success",
        description: `Task ${
          newStatus === "Done" ? "marked as done" : `moved to ${newStatus}`
        }`,
      });

      queryClient.invalidateQueries({
        queryKey: ["tasks"],
      });
    } catch (error) {
      console.error("Error updating task status:", error);
      toast({
        title: "Error",
        description: "Failed to update task status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleQuickAction = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (task.status === TaskStatus.BACKLOG) {
      handleStatusUpdate(taskId, TaskStatus.ACTIVE);
    } else if (task.status === TaskStatus.ACTIVE) {
      handleStatusUpdate(taskId, TaskStatus.DONE);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {tasks.map((task) => (
          <div key={task.id} className="space-y-2">
            <div className="space-y-2">
              <Card key={task.id} className="overflow-hidden py-0">
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/task/${task.id}`}
                              className="font-medium hover:underline"
                            >
                              {task.title}
                            </Link>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <Badge className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                            {task.dueDate && (
                              <Badge
                                variant="outline"
                                className="flex items-center gap-1"
                              >
                                <Clock className="h-3 w-3" />
                                {formatDueDate(task.dueDate)}
                              </Badge>
                            )}
                            {task.source && (
                              <Badge
                                variant="outline"
                                className="flex items-center gap-1"
                              >
                                {jiraBaseUrl ? (
                                  <>
                                    <a
                                      href={`${jiraBaseUrl}/browse/${task.source}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      {task.source}
                                    </a>
                                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                  </>
                                ) : (
                                  task.source
                                )}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Quick action button - only for Backlog tasks */}
                        {task.status === "Backlog" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                            onClick={(e) => handleQuickAction(task.id, e)}
                            title="Move to Active"
                          >
                            <ArrowRight className="mr-1 h-4 w-4" />
                            <span className="text-xs">Move to Active</span>
                          </Button>
                        )}

                        {/* Quick action button - only for Active tasks */}
                        {task.status === "Active" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                            onClick={(e) => handleQuickAction(task.id, e)}
                            title="Mark as Done"
                          >
                            <Check className="mr-1 h-4 w-4" />
                            <span className="text-xs">Mark Done</span>
                          </Button>
                        )}

                        {showActions && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Link
                                  href={`/task/${task.id}`}
                                  className="flex w-full"
                                >
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setEditTask(task)}
                              >
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {task.status === TaskStatus.BACKLOG && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusUpdate(
                                      task.id,
                                      TaskStatus.ACTIVE
                                    )
                                  }
                                >
                                  Move to Active
                                </DropdownMenuItem>
                              )}
                              {task.status === "Active" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusUpdate(task.id, TaskStatus.DONE)
                                  }
                                >
                                  Mark as Done
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusUpdate(
                                    task.id,
                                    TaskStatus.CANCELED
                                  )
                                }
                              >
                                Cancel Task
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ))}
      </div>
      {editTask && (
        <TaskModal defaultValues={editTask} onClose={() => setEditTask(null)} />
      )}
    </>
  );
}
