"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import type { Task } from "@/lib/data"

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Description is required"),
  parentId: z.string().nullable(),
  dueDate: z
    .object({
      type: z.enum(["date", "quarter", "sprint", "year"]),
      value: z.union([z.string(), z.number()]),
    })
    .nullable(),
  status: z.enum(["Backlog", "Active", "Done", "Canceled"]),
  source: z.enum(["GitHub PR", "Jira Issue", "Manual", ""]).transform((val) => (val === "" ? null : val)),
  priority: z.enum(["Minor", "Normal", "Major", "Critical"]),
})

type FormValues = z.infer<typeof formSchema>

interface TaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: FormValues) => void
  defaultValues?: Partial<Task>
  parentTasks?: Task[]
}

export function TaskModal({ open, onOpenChange, onSubmit, defaultValues, parentTasks = [] }: TaskModalProps) {
  const [dueDateType, setDueDateType] = useState<"date" | "quarter" | "sprint" | "year">(
    defaultValues?.dueDate?.type || "date",
  )

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
  })

  const handleSubmit = (values: FormValues) => {
    onSubmit(values)
    onOpenChange(false)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{defaultValues ? "Edit Task" : "Create New Task"}</DialogTitle>
          <DialogDescription>
            {defaultValues ? "Update the details of your task." : "Add a new task to your workflow."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                  <FormLabel>Description (Markdown)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Task description in markdown format" className="min-h-[100px]" {...field} />
                  </FormControl>
                  <FormDescription>You can use Markdown to format your description.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Backlog">Backlog</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Done">Done</SelectItem>
                        <SelectItem value="Canceled">Canceled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Task (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select parent task" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {parentTasks.map((task) => (
                          <SelectItem key={task.id} value={task.id}>
                            {task.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Optionally assign this task to a parent task/project.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        <SelectItem value="GitHub PR">GitHub PR</SelectItem>
                        <SelectItem value="Jira Issue">Jira Issue</SelectItem>
                        <SelectItem value="Manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date (Optional)</FormLabel>
                  <Tabs
                    defaultValue={dueDateType}
                    onValueChange={(value) => setDueDateType(value as any)}
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
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value && field.value.type === "date" ? (
                                format(new Date(field.value.value as string), "PPP")
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
                            selected={field.value?.type === "date" ? new Date(field.value.value as string) : undefined}
                            onSelect={(date) =>
                              field.onChange(date ? { type: "date", value: date.toISOString().split("T")[0] } : null)
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </TabsContent>
                    <TabsContent value="quarter" className="pt-4">
                      <Select
                        onValueChange={(value) => field.onChange({ type: "quarter", value: Number.parseInt(value) })}
                        defaultValue={field.value?.type === "quarter" ? String(field.value.value) : undefined}
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
                          defaultValue={field.value?.type === "sprint" ? field.value.value : ""}
                          onChange={(e) => field.onChange({ type: "sprint", value: Number.parseInt(e.target.value) })}
                        />
                      </FormControl>
                    </TabsContent>
                    <TabsContent value="year" className="pt-4">
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Year"
                          min={2023}
                          defaultValue={field.value?.type === "year" ? field.value.value : new Date().getFullYear()}
                          onChange={(e) => field.onChange({ type: "year", value: Number.parseInt(e.target.value) })}
                        />
                      </FormControl>
                    </TabsContent>
                  </Tabs>
                  <FormDescription>Set a due date for your task.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit">{defaultValues ? "Update Task" : "Create Task"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
