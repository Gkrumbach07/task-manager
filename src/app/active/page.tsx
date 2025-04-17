"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { TaskList } from "@/components/task-list"
import { TaskModal } from "@/components/task-modal"
import { Plus } from "lucide-react"
import { getCurrentTimeInfo, getTasksByStatus, type Task } from "@/lib/data"
import { updateTaskStatusAction } from "@/lib/actions"
import { useToast } from "@/hooks/use-toast"

export default function ActivePage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [activeTasks, setActiveTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const timeInfo = getCurrentTimeInfo()
  const router = useRouter()
  const { toast } = useToast()

  // Load tasks
  useEffect(() => {
    const loadTasks = async () => {
      setIsLoading(true)
      try {
        const tasks = await getTasksByStatus("Active")
        setActiveTasks(tasks)
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

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const result = await updateTaskStatusAction(taskId, newStatus as Task["status"])

      if (result.success) {
        // Update local state
        if (newStatus !== "Active") {
          setActiveTasks(activeTasks.filter((task) => task.id !== taskId))
        } else {
          // Refresh the list if status changed to Active
          const tasks = await getTasksByStatus("Active")
          setActiveTasks(tasks)
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

  const handleTaskCreated = async (newTask: Task) => {
    if (newTask.status === "Active") {
      // Refresh the active tasks
      const tasks = await getTasksByStatus("Active")
      setActiveTasks(tasks)
    }
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Active Tasks</h1>
          <p className="text-muted-foreground">
            {timeInfo.date} • Sprint {timeInfo.sprint} • Quarter {timeInfo.quarter}
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-6">
          <TaskList tasks={activeTasks} onStatusChange={handleStatusChange} />
        </div>
      )}

      <TaskModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} onSubmit={handleTaskCreated} />
    </div>
  )
}
