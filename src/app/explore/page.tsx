"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Github, ExternalLink, RefreshCw, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TaskModal } from "@/components/task-modal";
import { tasks } from "@/lib/data";

// Mock data for external tasks
const externalTasks = [
  {
    id: "gh-123",
    title: "Fix navigation bug on mobile",
    source: "GitHub",
    repo: "frontend-app",
    url: "#",
    createdAt: "2 days ago",
    labels: ["bug", "mobile"],
  },
  {
    id: "gh-124",
    title: "Add dark mode support",
    source: "GitHub",
    repo: "frontend-app",
    url: "#",
    createdAt: "3 days ago",
    labels: ["feature", "ui"],
  },
  {
    id: "jira-456",
    title: "Implement user authentication",
    source: "Jira",
    project: "AUTH",
    url: "#",
    createdAt: "1 day ago",
    priority: "High",
  },
  {
    id: "jira-457",
    title: "Database migration for user profiles",
    source: "Jira",
    project: "DB",
    url: "#",
    createdAt: "5 days ago",
    priority: "Medium",
  },
  {
    id: "req-789",
    title: "Quarterly report generation",
    source: "Request",
    requester: "Manager",
    url: "#",
    createdAt: "4 hours ago",
    priority: "High",
  },
];

export default function ExplorePage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  const handleImport = (task: any) => {
    setSelectedTask(task);
    setIsCreateModalOpen(true);
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Explore</h1>
          <p className="text-muted-foreground">
            Discover and import tasks from external sources
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" disabled={isLoading}>
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">
            All Sources ({externalTasks.length})
          </TabsTrigger>
          <TabsTrigger value="github">
            GitHub ({externalTasks.filter((t) => t.source === "GitHub").length})
          </TabsTrigger>
          <TabsTrigger value="jira">
            Jira ({externalTasks.filter((t) => t.source === "Jira").length})
          </TabsTrigger>
          <TabsTrigger value="requests">
            Requests (
            {externalTasks.filter((t) => t.source === "Request").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {externalTasks.map((task) => (
              <Card key={task.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    {task.source === "GitHub" && (
                      <Github className="h-5 w-5 text-muted-foreground" />
                    )}
                    {task.source === "Jira" && (
                      <ExternalLink className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <CardDescription>
                    {task.source === "GitHub" &&
                      `${task.repo} • ${task.createdAt}`}
                    {task.source === "Jira" &&
                      `${task.project} • ${task.createdAt}`}
                    {task.source === "Request" &&
                      `From: ${task.requester} • ${task.createdAt}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {task.labels &&
                      task.labels.map((label: string) => (
                        <Badge key={label} variant="secondary">
                          {label}
                        </Badge>
                      ))}
                    {task.priority && (
                      <Badge variant="outline">{task.priority}</Badge>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full"
                    onClick={() => handleImport(task)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Import to Backlog
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="github" className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {externalTasks
              .filter((task) => task.source === "GitHub")
              .map((task) => (
                <Card key={task.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{task.title}</CardTitle>
                      <Github className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <CardDescription>
                      {task.repo} • {task.createdAt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {task.labels &&
                        task.labels.map((label: string) => (
                          <Badge key={label} variant="secondary">
                            {label}
                          </Badge>
                        ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={() => handleImport(task)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Import to Backlog
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="jira" className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {externalTasks
              .filter((task) => task.source === "Jira")
              .map((task) => (
                <Card key={task.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{task.title}</CardTitle>
                      <ExternalLink className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <CardDescription>
                      {task.project} • {task.createdAt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {task.priority && (
                        <Badge variant="outline">{task.priority}</Badge>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={() => handleImport(task)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Import to Backlog
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {externalTasks
              .filter((task) => task.source === "Request")
              .map((task) => (
                <Card key={task.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    <CardDescription>
                      From: {task.requester} • {task.createdAt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {task.priority && (
                        <Badge variant="outline">{task.priority}</Badge>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={() => handleImport(task)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Import to Backlog
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      <TaskModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSubmit={(data) => {
          console.log("Import task:", data);
          // In a real app, this would create a new task from the external source
        }}
        defaultValues={
          selectedTask
            ? {
                title: selectedTask.title,
                body: `Imported from ${selectedTask.source}`,
                status: "Backlog",
                priority:
                  selectedTask.priority === "High"
                    ? "Major"
                    : selectedTask.priority === "Medium"
                    ? "Normal"
                    : "Minor",
                source:
                  selectedTask.source === "GitHub"
                    ? "GitHub PR"
                    : selectedTask.source === "Jira"
                    ? "Jira Issue"
                    : "Manual",
              }
            : undefined
        }
        parentTasks={tasks.filter((task) => !task.parentId)}
      />
    </div>
  );
}
