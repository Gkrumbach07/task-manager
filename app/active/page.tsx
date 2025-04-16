"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { TaskList } from "@/components/task-list"
import { TaskModal } from "@/components/task-modal"
import { Plus } from "lucide-react"
import { getCurrentTimeInfo, getTasksByStatus, tasks } from "@/lib/data"

export default function ActivePage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const activeTasks = getTasksByStatus("Active")
  const timeInfo = getCurrentTimeInfo()

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

      <div className="space-y-6">
        <TaskList
          tasks={activeTasks}
          onStatusChange={(taskId, newStatus) => {
            console.log(`Change task ${taskId} to ${newStatus}`)
            // In a real app, this would update the task status
          }}
        />
      </div>

      <TaskModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSubmit={(data) => {
          console.log("Create task:", data)
          // In a real app, this would create a new task
        }}
        parentTasks={tasks.filter((task) => !task.parentId)}
      />
    </div>
  )
}
