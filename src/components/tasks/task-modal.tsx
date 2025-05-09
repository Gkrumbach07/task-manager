"use client";

import { useState, useCallback } from "react";
import { z } from "zod";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { createTask, updateTask } from "@/lib/tasks/services/mutations";

import { useToast } from "@/hooks/use-toast";
import { DueDateType, TaskPriority, TaskStatus } from "@/lib/tasks/enums";
import type {
  CreateTaskDto,
  TaskDto,
  UpdateTaskDto,
} from "@/lib/tasks/schemas";

// Define the schema for the form input
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().nullable(),
  dueDate: z
    .object({
      type: z.nativeEnum(DueDateType),
      value: z.union([z.date(), z.number().min(1), z.string()]).nullable(), // Allow string for initial empty state from inputs maybe? Or handle better?
    })
    .nullable()
    .refine(
      (data) => {
        if (!data) return true; // Allow null
        if (data.type === DueDateType.DATE && data.value instanceof Date)
          return true;
        if (
          data.type === DueDateType.QUARTER &&
          typeof data.value === "number" &&
          data.value >= 1 &&
          data.value <= 4
        )
          return true;
        if (
          data.type === DueDateType.SPRINT &&
          typeof data.value === "number" &&
          data.value >= 1
        )
          return true;
        if (
          data.type === DueDateType.YEAR &&
          typeof data.value === "number" &&
          data.value >= new Date().getFullYear() - 10
        )
          return true; // Allow some past years too
        return false;
      },
      { message: "Invalid due date value for the selected type." }
    ),
  status: z.nativeEnum(TaskStatus),
  source: z.string().nullable(),
  priority: z.nativeEnum(TaskPriority),
});

// Infer the type from the schema
type TaskFormInput = z.infer<typeof formSchema>;

// Define props for the modal, including open state and handler
type TaskModalProps = {
  onSubmit?: (task: TaskDto) => void;
  onClose?: () => void;
  defaultValues?: Partial<TaskDto>;
};

export function TaskModal({
  onSubmit,
  onClose,
  defaultValues,
}: TaskModalProps) {
  const [dueDateType, setDueDateType] = useState<DueDateType>(
    defaultValues?.dueDate?.type || DueDateType.DATE
  );
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<TaskFormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // Set default values directly in useForm
      title: defaultValues?.title || "",
      body: defaultValues?.body || "",
      // Ensure dueDate structure matches TaskFormInput expectation
      dueDate: defaultValues?.dueDate
        ? {
            type: defaultValues.dueDate.type,
            // Convert value based on type if necessary, especially for Date
            value:
              defaultValues.dueDate.type === DueDateType.DATE &&
              typeof defaultValues.dueDate.value === "string"
                ? new Date(defaultValues.dueDate.value)
                : defaultValues.dueDate.value,
          }
        : null,
      status: defaultValues?.status || TaskStatus.BACKLOG,
      source: defaultValues?.source || null,
      priority: defaultValues?.priority || TaskPriority.NORMAL,
    },
  });

  // Function to transform form data into DTO for API calls
  const transformFormDataToDto = (data: TaskFormInput) => {
    const dueDate = data.dueDate?.value
      ? {
          type: data.dueDate.type,
          value: data.dueDate.value.toString(),
        }
      : null;

    return {
      title: data.title,
      body: data.body || null,
      dueDate,
      status: data.status,
      source: data.source || null,
      priority: data.priority,
    };
  };

  const handleSubmit = useCallback(
    async (values: TaskFormInput) => {
      setIsLoading(true);
      let success = false;
      let resultingTask: TaskDto | null = null;

      const transformedData = transformFormDataToDto(values);

      try {
        if (defaultValues?.id) {
          const updatePayload: UpdateTaskDto = {
            id: defaultValues.id,
            ...transformedData,
          };
          resultingTask = await updateTask(updatePayload);
          if (resultingTask) {
            toast({
              title: "Task updated",
              description: "Your task has been updated successfully.",
            });
            success = true;
          }
        } else {
          // Create task
          const createPayload: CreateTaskDto = transformedData;
          resultingTask = await createTask(createPayload);
          if (resultingTask) {
            toast({
              title: "Task created",
              description: "Your new task has been created successfully.",
            });
            success = true;
          }
        }

        if (success && resultingTask) {
          onClose?.();
          if (onSubmit) {
            onSubmit(resultingTask);
          }
        } else if (!resultingTask) {
          throw new Error(
            `Failed to ${
              defaultValues?.id ? "update" : "create"
            } task. API might have returned no data.`
          );
        }
      } catch (error) {
        console.error(
          `Error ${defaultValues?.id ? "updating" : "creating"} task:`,
          error
        );
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "An unknown error occurred while saving the task.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [defaultValues?.id, toast, onClose, onSubmit]
  );

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) {
          onClose?.();
        }
      }}
    >
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
                    <Input placeholder="Task title" {...field} />
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
                      className="max-h-[100px] resize-none"
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
                      {Object.values(TaskPriority).map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {/* Optionally map to more readable names if needed */}
                          {priority.charAt(0).toUpperCase() +
                            priority.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
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
                      {Object.values(TaskStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {/* Optionally map to more readable names if needed */}
                          {status.charAt(0).toUpperCase() +
                            status.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://github.com/org/repo/pull/123"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Link or reference to the source of this task (e.g. GitHub
                    PR, Jira issue key)
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
                    value={dueDateType}
                    onValueChange={(value) =>
                      setDueDateType(value as DueDateType)
                    }
                    className="w-full"
                  >
                    <TabsList className="grid grid-cols-4">
                      <TabsTrigger value={DueDateType.DATE}>Date</TabsTrigger>
                      <TabsTrigger value={DueDateType.QUARTER}>
                        Quarter
                      </TabsTrigger>
                      <TabsTrigger value={DueDateType.SPRINT}>
                        Sprint
                      </TabsTrigger>
                      <TabsTrigger value={DueDateType.YEAR}>Year</TabsTrigger>
                    </TabsList>

                    <TabsContent value={DueDateType.DATE} className="pt-4">
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
                              {field.value?.type === DueDateType.DATE &&
                              field.value.value instanceof Date ? (
                                format(field.value.value, "PPP")
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
                              field.value?.type === DueDateType.DATE &&
                              field.value.value instanceof Date
                                ? field.value.value
                                : undefined
                            }
                            onSelect={(date) => {
                              // Trigger revalidation on select
                              form.setValue(
                                "dueDate",
                                date
                                  ? { type: DueDateType.DATE, value: date }
                                  : null,
                                { shouldValidate: true }
                              );
                              // Manually set the tab state if needed, though it should be controlled by the outer Tabs state
                              if (date) setDueDateType(DueDateType.DATE);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </TabsContent>

                    <TabsContent value={DueDateType.QUARTER} className="pt-4">
                      <Select
                        onValueChange={(value) => {
                          const numValue = value
                            ? Number.parseInt(value)
                            : null;
                          field.onChange({
                            type: DueDateType.QUARTER,
                            value: numValue,
                          });
                          // Manually set the tab state
                          if (value) setDueDateType(DueDateType.QUARTER);
                        }}
                        value={
                          field.value?.type === DueDateType.QUARTER
                            ? String(field.value.value)
                            : ""
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

                    <TabsContent value={DueDateType.SPRINT} className="pt-4">
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Sprint number"
                          min={1}
                          value={
                            field.value?.type === DueDateType.SPRINT &&
                            typeof field.value.value === "number"
                              ? field.value.value
                              : ""
                          }
                          onChange={(e) => {
                            const numValue = e.target.value
                              ? Number.parseInt(e.target.value)
                              : null;
                            field.onChange({
                              type: DueDateType.SPRINT,
                              value: numValue,
                            });
                            // Manually set the tab state
                            if (e.target.value)
                              setDueDateType(DueDateType.SPRINT);
                          }}
                        />
                      </FormControl>
                    </TabsContent>

                    <TabsContent value={DueDateType.YEAR} className="pt-4">
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Year"
                          min={new Date().getFullYear() - 5}
                          value={
                            field.value?.type === DueDateType.YEAR &&
                            typeof field.value.value === "number"
                              ? field.value.value
                              : ""
                          }
                          onChange={(e) => {
                            const numValue = e.target.value
                              ? Number.parseInt(e.target.value)
                              : null;
                            field.onChange({
                              type: DueDateType.YEAR,
                              value: numValue,
                            });
                            // Manually set the tab state
                            if (e.target.value)
                              setDueDateType(DueDateType.YEAR);
                          }}
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
              <Button
                type="button"
                variant="ghost"
                onClick={() => onClose?.()}
                disabled={isLoading}
              >
                Cancel
              </Button>
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
