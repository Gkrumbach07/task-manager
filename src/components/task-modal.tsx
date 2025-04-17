"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTask, updateTask, type Task } from "@/lib/queries/tasks";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useCallback } from "react";
import { getTasks } from "@/lib/queries/tasks";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().nullable(),
  parentId: z.string().nullable(),
  dueDate: z
    .object({
      type: z.enum(["date", "quarter", "sprint", "year"]),
      value: z.union([z.string(), z.number()]),
    })
    .nullable(),
  status: z.enum(["Backlog", "Active", "Done", "Canceled"]),
  source: z.string().nullable(),
  priority: z.enum(["Minor", "Normal", "Major", "Critical"]),
});

type FormValues = z.infer<typeof formSchema>;

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (task: Task) => void;
  defaultValues?: Partial<Task>;
  parentTasks?: Task[];
}

export function TaskModal({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  parentTasks: initialParentTasks = [],
}: TaskModalProps) {
  const [dueDateType, setDueDateType] = useState<
    "date" | "quarter" | "sprint" | "year"
  >(defaultValues?.dueDate?.type || "date");
  const [isLoading, setIsLoading] = useState(false);
  const [parentTasks, setParentTasks] = useState<Task[]>(initialParentTasks);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: defaultValues?.title || "",
      body: defaultValues?.body || "",
      parentId: defaultValues?.parentId || null,
      dueDate: defaultValues?.dueDate || null,
      status: defaultValues?.status || "Backlog",
      source: defaultValues?.source || null,
      priority: defaultValues?.priority || "Normal",
    },
  });

  // Load potential parent tasks if not provided
  const loadParentTasks = useCallback(async () => {
    if (initialParentTasks.length === 0) {
      try {
        const allTasks = await getTasks();
        // Filter out tasks that could be parents (no parent themselves)
        const potentialParents = allTasks.filter((task) => !task.parentId);
        setParentTasks(potentialParents);
      } catch (error) {
        console.error("Error loading parent tasks:", error);
      }
    }
  }, [initialParentTasks]);

  useEffect(() => {
    if (open) {
      loadParentTasks();
    }
  }, [open, loadParentTasks]);

  const handleSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      let task: Task | null;

      // Convert empty source string to null
      const processedValues = {
        ...values,
        source: values.source?.trim() || null,
      };

      if (defaultValues?.id) {
        // Update existing task
        task = await updateTask(defaultValues.id, processedValues);
        if (task) {
          toast({
            title: "Task updated",
            description: "Your task has been updated successfully.",
          });
        }
      } else {
        // Create new task
        task = await createTask(
          processedValues as Omit<Task, "id" | "createdDate" | "userId">
        );
        if (task) {
          toast({
            title: "Task created",
            description: "Your new task has been created successfully.",
          });
        }
      }

      if (!task) {
        throw new Error("Failed to save task");
      }

      onOpenChange(false);
      form.reset();

      // Notify parent component
      if (onSubmit) {
        onSubmit(task);
      }
    } catch (error) {
      console.error("Error saving task:", error);
      toast({
        title: "Error",
        description: "There was a problem saving your task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {defaultValues?.id ? "Edit Task" : "Create New Task"}
          </DialogTitle>
          <DialogDescription>
            {defaultValues?.id
              ? "Update the details of your task."
              : "Add a new task to your workflow."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input required placeholder="Task title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Task description in markdown format"
                      className="min-h-[100px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    You can use Markdown to format your description.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Minor">Minor</SelectItem>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Major">Major</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Backlog">Backlog</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Task</FormLabel>
                  <div className="flex items-center gap-2">
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || ""}
                      disabled={parentTasks.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              parentTasks.length === 0
                                ? "No available parent tasks"
                                : "Select parent task"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {parentTasks.map((task) => (
                          <SelectItem key={task.id} value={task.id}>
                            {task.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {field.value && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-muted-foreground hover:text-destructive"
                        onClick={() => field.onChange(null)}
                      >
                        <span className="sr-only">Remove parent task</span>
                        <span className="flex items-center">X</span>
                      </Button>
                    )}
                  </div>

                  <FormDescription>
                    Optionally assign this task to a parent task/project.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://github.com/org/repo/pull/123"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Link to the source of this task (e.g. GitHub PR, Jira issue)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
                  <Tabs
                    defaultValue={dueDateType}
                    onValueChange={(value) =>
                      setDueDateType(
                        value as "date" | "quarter" | "sprint" | "year"
                      )
                    }
                    className="w-full"
                  >
                    <TabsList className="grid grid-cols-4">
                      <TabsTrigger value="date">Date</TabsTrigger>
                      <TabsTrigger value="quarter">Quarter</TabsTrigger>
                      <TabsTrigger value="sprint">Sprint</TabsTrigger>
                      <TabsTrigger value="year">Year</TabsTrigger>
                    </TabsList>
                    <TabsContent value="date" className="pt-4">
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value && field.value.type === "date" ? (
                                format(
                                  new Date(field.value.value as string),
                                  "PPP"
                                )
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              field.value?.type === "date"
                                ? new Date(field.value.value as string)
                                : undefined
                            }
                            onSelect={(date) =>
                              field.onChange(
                                date
                                  ? {
                                      type: "date",
                                      value: date.toISOString().split("T")[0],
                                    }
                                  : null
                              )
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </TabsContent>
                    <TabsContent value="quarter" className="pt-4">
                      <Select
                        onValueChange={(value) =>
                          field.onChange({
                            type: "quarter",
                            value: Number.parseInt(value),
                          })
                        }
                        defaultValue={
                          field.value?.type === "quarter"
                            ? String(field.value.value)
                            : undefined
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select quarter" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">Q1</SelectItem>
                          <SelectItem value="2">Q2</SelectItem>
                          <SelectItem value="3">Q3</SelectItem>
                          <SelectItem value="4">Q4</SelectItem>
                        </SelectContent>
                      </Select>
                    </TabsContent>
                    <TabsContent value="sprint" className="pt-4">
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Sprint number"
                          min={1}
                          defaultValue={
                            field.value?.type === "sprint"
                              ? field.value.value
                              : ""
                          }
                          onChange={(e) =>
                            field.onChange({
                              type: "sprint",
                              value: Number.parseInt(e.target.value),
                            })
                          }
                        />
                      </FormControl>
                    </TabsContent>
                    <TabsContent value="year" className="pt-4">
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Year"
                          min={2023}
                          defaultValue={
                            field.value?.type === "year"
                              ? field.value.value
                              : new Date().getFullYear()
                          }
                          onChange={(e) =>
                            field.onChange({
                              type: "year",
                              value: Number.parseInt(e.target.value),
                            })
                          }
                        />
                      </FormControl>
                    </TabsContent>
                  </Tabs>
                  <FormDescription>
                    Set a due date for your task.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="mr-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    </span>
                    {defaultValues?.id ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>{defaultValues?.id ? "Update Task" : "Create Task"}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
