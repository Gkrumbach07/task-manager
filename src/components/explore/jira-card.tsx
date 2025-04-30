"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Plus, Loader2, ChevronDown } from "lucide-react";
import { TaskModal } from "@/components/task-modal";
import { useToast } from "@/hooks/use-toast";
import { createTask } from "@/lib/tasks/services/mutations";
import type { JiraDto } from "@/lib/jira/schemas";
import { JiraPriority } from "@/lib/jira/enums";
import type { CreateTaskDto, TaskDto } from "@/lib/tasks/schemas";
import { TaskPriority, TaskStatus } from "@/lib/tasks/enums";
import { formatDistanceToNow } from "date-fns";
import { JiraJqlQueryDto } from "@/lib/jira-jql-queries/schemas";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "../ui/tooltip";
import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import Link from "next/link";

// Helper to map Jira priorities to Task priorities
const mapJiraPriorityToTaskPriority = (
  jiraPriority: JiraPriority
): TaskPriority => {
  switch (jiraPriority) {
    case JiraPriority.BLOCKER:
    case JiraPriority.CRITICAL:
      return TaskPriority.CRITICAL;
    case JiraPriority.MAJOR:
      return TaskPriority.MAJOR;
    case JiraPriority.MINOR:
      return TaskPriority.MINOR;
    case JiraPriority.NORMAL:
    default:
      return TaskPriority.NORMAL;
  }
};

// Translates JiraDto to CreateTaskDto for quick create
const jiraToCreateTaskDto = (issue: JiraDto): CreateTaskDto => ({
  title: issue.title,
  body: issue.description || null,
  dueDate: null,
  status: TaskStatus.BACKLOG,
  source: issue.key,
  priority: mapJiraPriorityToTaskPriority(issue.priority),
});

// Translates JiraDto to partial TaskDto for modal defaults
const jiraToTaskModalDefaults = (issue: JiraDto): Partial<TaskDto> => {
  const title = `${issue.key}: ${
    issue.description?.substring(0, 80) || "No description"
  }${issue.description && issue.description.length > 80 ? "..." : ""}`;

  return {
    title: title,
    body: issue.description || "",
    dueDate: null,
    status: TaskStatus.BACKLOG,
    source: issue.key,
    priority: mapJiraPriorityToTaskPriority(issue.priority),
  };
};

type JiraFieldFilter = {
  field: keyof JiraDto;
  value: unknown;
};

type JiraCardProps = {
  issue: JiraDto;
  fromJqlQueries?: JiraJqlQueryDto[];
  existingTask?: TaskDto;
  onTaskCreated?: (newTask: TaskDto) => void;
  onFilterSelected?: (filter: JiraFieldFilter) => void;
  onIssueIgnored: (issueKey: string) => Promise<void>;
} & React.ComponentProps<typeof Card>;

export function JiraCard({
  issue,
  fromJqlQueries,
  existingTask,
  onTaskCreated,
  onFilterSelected,
  onIssueIgnored,
  ...props
}: JiraCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuickCreating, setIsQuickCreating] = useState(false);
  const [isIgnoring, setIsIgnoring] = useState(false);
  const { toast } = useToast();

  const handleQuickCreate = async () => {
    setIsQuickCreating(true);
    try {
      const createTaskPayload = jiraToCreateTaskDto(issue);
      const newTask = await createTask(createTaskPayload);
      if (newTask) {
        toast({
          title: "Task Created",
          description: `Task '${newTask.title}' added to backlog.`,
        });
        onTaskCreated?.(newTask); // Notify parent if needed
      } else {
        throw new Error("Failed to create task. API returned no data.");
      }
    } catch (error) {
      console.error("Error during quick create:", error);
      toast({
        title: "Error Creating Task",
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsQuickCreating(false);
    }
  };

  const handleIgnoreIssue = async () => {
    setIsIgnoring(true);
    await onIssueIgnored(issue.key);
    setIsIgnoring(false);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleModalSubmit = (createdTask: TaskDto) => {
    // Modal handles its own success toast
    setIsModalOpen(false);
    onTaskCreated?.(createdTask);
  };

  const InlineButtonXS = ({
    children,
    onClick,
    ...props
  }: {
    children: React.ReactNode;
    onClick: () => void;
    props?: React.ComponentProps<typeof Button>;
  }) => (
    <Button
      size="sm"
      variant="link"
      className="px-0 h-0 font-medium text-xs"
      onClick={onClick}
      {...props}
    >
      {children}
    </Button>
  );

  return (
    <>
      <Card {...props}>
        <CardHeader>
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-base font-semibold">
              <a
                href={issue.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {issue.key}
                <ExternalLink className="inline-block h-4 w-4 ml-1 align-middle text-muted-foreground" />
              </a>
            </CardTitle>
            {fromJqlQueries &&
              fromJqlQueries.length > 0 &&
              (fromJqlQueries.length === 1 ? (
                <Badge variant="outline" className={"whitespace-nowrap"}>
                  <span
                    className="inline-block h-3 w-3 rounded-sm flex-shrink-0"
                    style={{
                      backgroundColor:
                        fromJqlQueries[0].labelColor ?? undefined,
                    }}
                    aria-hidden="true"
                  />
                  {fromJqlQueries[0].label}
                </Badge>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="default" className="whitespace-nowrap">
                        {fromJqlQueries.length} Queries
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      {fromJqlQueries.map((query) => query.label).join(", ")}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
          </div>
          <CardDescription className="line-clamp-2">
            {issue.title.substring(0, 100) +
              (issue.title.length > 100 ? "..." : "")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grow">
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              Status:{" "}
              <InlineButtonXS
                onClick={() =>
                  onFilterSelected?.({ field: "status", value: issue.status })
                }
              >
                {issue.status}
              </InlineButtonXS>
            </p>
            <p>
              Priority:{" "}
              <InlineButtonXS
                onClick={() =>
                  onFilterSelected?.({
                    field: "priority",
                    value: issue.priority,
                  })
                }
              >
                {issue.priority}
              </InlineButtonXS>
            </p>
            {issue.labels.length > 0 && (
              <p>
                Labels:{" "}
                {issue.labels.map((label, index) => (
                  <React.Fragment key={label}>
                    <InlineButtonXS
                      onClick={() =>
                        onFilterSelected?.({ field: "labels", value: label })
                      }
                    >
                      {label}
                    </InlineButtonXS>
                    {index < issue.labels.length - 1 && ", "}
                  </React.Fragment>
                ))}
              </p>
            )}
            {issue.assignee && (
              <p>
                Assignee:{" "}
                <InlineButtonXS
                  onClick={() =>
                    onFilterSelected?.({
                      field: "assignee",
                      value: issue.assignee,
                    })
                  }
                >
                  {issue.assignee.displayName}
                </InlineButtonXS>
              </p>
            )}
            <p>
              Created:{" "}
              {formatDistanceToNow(new Date(issue.created), {
                addSuffix: true,
              })}
            </p>
            <p>
              Updated:{" "}
              {formatDistanceToNow(new Date(issue.updated), {
                addSuffix: true,
              })}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          {existingTask ? (
            <Button
              variant="link"
              size="sm"
              className="w-full flex items-center"
              asChild
            >
              <Link href={`/task/${existingTask.id}`}>View Existing Task</Link>
            </Button>
          ) : (
            <>
              <DropdownMenu>
                <div className="flex w-full">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 rounded-r-none border-r"
                    onClick={handleQuickCreate}
                    disabled={isQuickCreating}
                  >
                    {isQuickCreating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Quick Import
                  </Button>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="default"
                      size="sm"
                      className="rounded-l-none px-2"
                      disabled={isQuickCreating}
                    >
                      <ChevronDown className="h-4 w-4" />
                      <span className="sr-only">Toggle Import Options</span>
                    </Button>
                  </DropdownMenuTrigger>
                </div>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={handleOpenModal}>
                    Edit and import
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                size="sm"
                disabled={isIgnoring}
                onClick={() => handleIgnoreIssue()}
              >
                {isIgnoring && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Ignore
              </Button>
            </>
          )}
        </CardFooter>
      </Card>

      {isModalOpen && (
        <TaskModal
          defaultValues={jiraToTaskModalDefaults(issue)}
          onClose={handleCloseModal}
          onSubmit={handleModalSubmit}
        />
      )}
    </>
  );
}
