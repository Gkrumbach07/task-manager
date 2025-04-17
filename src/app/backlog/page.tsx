"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TaskList } from "@/components/task-list"
import { TaskModal } from "@/components/task-modal"
import { Plus, Calendar, CalendarRange, Edit } from "lucide-react"
import { getCurrentTimeInfo, getTasksByStatus, type Task } from "@/lib/data"
import { updateTaskStatusAction } from "@/lib/actions"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"

export default function BacklogPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [backlogTasks, setBacklogTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeInfo, setTimeInfo] = useState(getCurrentTimeInfo())
  const [isEditingSprint, setIsEditingSprint] = useState(false)
  const [isEditingQuarter, setIsEditingQuarter] = useState(false)
  const [sprintValue, setSprintValue] = useState(timeInfo.sprint.toString())
  const [quarterValue, setQuarterValue] = useState(timeInfo.quarter.toString())
  const router = useRouter()
  const { toast } = useToast()

  const sprintInputRef = useRef<HTMLInputElement>(null)
  const quarterInputRef = useRef<HTMLInputElement>(null)

  // Load tasks
  useEffect(() => {
    const loadTasks = async () => {
      setIsLoading(true)
      try {
        const tasks = await getTasksByStatus("Backlog")
        setBacklogTasks(tasks)
      } catch (error) {
        console.error("Error loading tasks:", error)
        toast({
          title: "Error",
          description: "Failed to load tasks. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadTasks()
  }, [toast])

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingSprint && sprintInputRef.current) {
      sprintInputRef.current.focus()
    }
  }, [isEditingSprint])

  useEffect(() => {
    if (isEditingQuarter && quarterInputRef.current) {
      quarterInputRef.current.focus()
    }
  }, [isEditingQuarter])

  const handleSprintUpdate = () => {
    const newSprint = Number.parseInt(sprintValue)
    if (!isNaN(newSprint) && newSprint > 0) {
      setTimeInfo((prev) => ({ ...prev, sprint: newSprint }))
    }
    setIsEditingSprint(false)
  }

  const handleQuarterUpdate = () => {
    const newQuarter = Number.parseInt(quarterValue)
    if (!isNaN(newQuarter) && newQuarter >= 1 && newQuarter <= 4) {
      setTimeInfo((prev) => ({ ...prev, quarter: newQuarter }))
    }
    setIsEditingQuarter(false)
  }

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const result = await updateTaskStatusAction(taskId, newStatus as Task["status"])

      if (result.success) {
        // Update local state
        if (newStatus !== "Backlog") {
          setBacklogTasks(backlogTasks.filter((task) => task.id !== taskId))
        } else {
          // Refresh the list if status changed to Backlog
          const tasks = await getTasksByStatus("Backlog")
          setBacklogTasks(tasks)
        }

        toast({
          title: "Success",
          description: `Task ${newStatus === "Done" ? "marked as done" : `moved to ${newStatus}`}`,
        })

        // Refresh the page to reflect changes
        router.refresh()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Error updating task status:", error)
      toast({
        title: "Error",
        description: "Failed to update task status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getOverdueTasks = () => {
    const today = new Date()
    return backlogTasks.filter((task) => {
      if (!task.dueDate || task.dueDate.type !== "date") return false
      const dueDate = new Date(task.dueDate.value as string)
      return dueDate < today
    })
  }

  const getNextWeekTasks = () => {
    const today = new Date()
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)

    return backlogTasks.filter((task) => {
      if (!task.dueDate) return false

      if (task.dueDate.type === "date") {
        const dueDate = new Date(task.dueDate.value as string)
        return dueDate >= today && dueDate <= nextWeek
      }
      return false
    })
  }

  const getNextSprintTasks = () => {
    const nextSprint = timeInfo.sprint + 1
    return backlogTasks.filter((task) => {
      if (!task.dueDate || task.dueDate.type !== "sprint") return false
      return task.dueDate.value === nextSprint
    })
  }

  const getNextQuarterTasks = () => {
    let nextQuarter = timeInfo.quarter + 1
    let year = new Date().getFullYear()

    if (nextQuarter > 4) {
      nextQuarter = 1
      year += 1
    }

    return backlogTasks.filter((task) => {
      if (!task.dueDate) return false

      if (task.dueDate.type === "quarter") {
        return task.dueDate.value === nextQuarter
      }
      return false
    })
  }

  const getNextYearTasks = () => {
    const nextYear = new Date().getFullYear() + 1
    return backlogTasks.filter((task) => {
      if (!task.dueDate || task.dueDate.type !== "year") return false
      return task.dueDate.value === nextYear
    })
  }

  const handleTaskCreated = async (newTask: Task) => {
    if (newTask.status === "Backlog") {
      // Refresh the backlog tasks
      const tasks = await getTasksByStatus("Backlog")
      setBacklogTasks(tasks)
    }
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Backlog</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            {timeInfo.date} •{/* Editable Sprint */}
            <span className="inline-flex items-center">
              Sprint{" "}
              {isEditingSprint ? (
                <span className="inline-flex items-center">
                  <Input
                    ref={sprintInputRef}
                    type="number"
                    value={sprintValue}
                    onChange={(e) => setSprintValue(e.target.value)}
                    onBlur={handleSprintUpdate}
                    onKeyDown={(e) => e.key === "Enter" && handleSprintUpdate()}
                    className="w-16 h-6 px-1 py-0 text-sm ml-1"
                    min="1"
                  />
                </span>
              ) : (
                <span
                  className="group relative cursor-pointer ml-1"
                  onClick={() => {
                    setIsEditingSprint(true)
                    setSprintValue(timeInfo.sprint.toString())
                  }}
                >
                  <span className="border-b border-dashed border-muted-foreground px-1">{timeInfo.sprint}</span>
                  <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100 absolute -right-4 top-1/2 -translate-y-1/2" />
                </span>
              )}
            </span>
            {" • "}
            {/* Editable Quarter */}
            <span className="inline-flex items-center">
              Quarter{" "}
              {isEditingQuarter ? (
                <span className="inline-flex items-center">
                  <Input
                    ref={quarterInputRef}
                    type="number"
                    value={quarterValue}
                    onChange={(e) => setQuarterValue(e.target.value)}
                    onBlur={handleQuarterUpdate}
                    onKeyDown={(e) => e.key === "Enter" && handleQuarterUpdate()}
                    className="w-16 h-6 px-1 py-0 text-sm ml-1"
                    min="1"
                    max="4"
                  />
                </span>
              ) : (
                <span
                  className="group relative cursor-pointer ml-1"
                  onClick={() => {
                    setIsEditingQuarter(true)
                    setQuarterValue(timeInfo.quarter.toString())
                  }}
                >
                  <span className="border-b border-dashed border-muted-foreground px-1">{timeInfo.quarter}</span>
                  <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100 absolute -right-4 top-1/2 -translate-y-1/2" />
                </span>
              )}
            </span>
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All ({backlogTasks.length})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({getOverdueTasks().length})</TabsTrigger>
          <TabsTrigger value="next-week">Next Week ({getNextWeekTasks().length})</TabsTrigger>
          <TabsTrigger value="next-sprint">Next Sprint ({getNextSprintTasks().length})</TabsTrigger>
          <TabsTrigger value="next-quarter">Next Quarter ({getNextQuarterTasks().length})</TabsTrigger>
          <TabsTrigger value="next-year">Next Year ({getNextYearTasks().length})</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <TabsContent value="all">
              <TaskList tasks={backlogTasks} onStatusChange={handleStatusChange} />
            </TabsContent>

            <TabsContent value="overdue">
              <TaskList tasks={getOverdueTasks()} onStatusChange={handleStatusChange} />
            </TabsContent>

            <TabsContent value="next-week">
              <TaskList tasks={getNextWeekTasks()} onStatusChange={handleStatusChange} />
            </TabsContent>

            <TabsContent value="next-sprint">
              <TaskList tasks={getNextSprintTasks()} onStatusChange={handleStatusChange} />
            </TabsContent>

            <TabsContent value="next-quarter">
              <TaskList tasks={getNextQuarterTasks()} onStatusChange={handleStatusChange} />
            </TabsContent>

            <TabsContent value="next-year">
              <TaskList tasks={getNextYearTasks()} onStatusChange={handleStatusChange} />
            </TabsContent>

            <TabsContent value="custom">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <h3 className="text-lg font-medium mb-2">Custom Filter</h3>
                <p className="text-muted-foreground mb-6">Create a custom filter for your backlog tasks.</p>
                <div className="flex gap-4 mb-6">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex gap-2">
                        <Calendar className="h-4 w-4" />
                        Date Range
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-4" align="start">
                      <div className="space-y-2">
                        <h4 className="font-medium">Select date range</h4>
                        <p className="text-sm text-muted-foreground">
                          Date picker would go here in a real implementation
                        </p>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Button variant="outline" className="flex gap-2">
                    <CalendarRange className="h-4 w-4" />
                    Sprint Range
                  </Button>
                </div>

                <Button variant="default">Apply Custom Filter</Button>
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>

      <TaskModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} onSubmit={handleTaskCreated} />
    </div>
  )
}
