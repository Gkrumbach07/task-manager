"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  ExternalLink,
  Folder,
  Github,
  MoreHorizontal,
  ArrowRight,
  Check,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { type Task, formatDueDate, getPriorityColor } from "@/lib/data"

type SortField = "title" | "priority" | "dueDate" | "createdDate"
type SortDirection = "asc" | "desc"
type GroupBy = "none" | "project" | "priority" | "dueDate"

interface TaskListProps {
  tasks: Task[]
  onStatusChange?: (taskId: string, newStatus: string) => void
  showActions?: boolean
}

export function TaskList({ tasks, onStatusChange, showActions = true }: TaskListProps) {
  const [sortField, setSortField] = useState<SortField>("dueDate")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [groupBy, setGroupBy] = useState<GroupBy>("none")
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({})

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }))
  }

  const handleSortChange = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortTasks = (tasksToSort: Task[]) => {
    return [...tasksToSort].sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case "title":
          comparison = a.title.localeCompare(b.title)
          break
        case "priority": {
          const priorityOrder = { Critical: 3, Major: 2, Normal: 1, Minor: 0 }
          comparison = (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0)
          break
        }
        case "dueDate":
          if (!a.dueDate && !b.dueDate) comparison = 0
          else if (!a.dueDate) comparison = 1
          else if (!b.dueDate) comparison = -1
          else {
            // Compare by type first
            const typeOrder = { date: 0, sprint: 1, quarter: 2, year: 3 }
            comparison = (typeOrder[a.dueDate.type] || 0) - (typeOrder[b.dueDate.type] || 0)

            // If same type, compare by value
            if (comparison === 0) {
              if (a.dueDate.type === "date" && b.dueDate.type === "date") {
                comparison =
                  new Date(a.dueDate.value as string).getTime() - new Date(b.dueDate.value as string).getTime()
              } else {
                comparison = Number(a.dueDate.value) - Number(b.dueDate.value)
              }
            }
          }
          break
        case "createdDate":
          comparison = a.createdDate.getTime() - b.createdDate.getTime()
          break
        default:
          comparison = 0
      }

      return sortDirection === "asc" ? comparison : -comparison
    })
  }

  const groupTasks = (tasksToGroup: Task[]) => {
    if (groupBy === "none") {
      return { "All Tasks": sortTasks(tasksToGroup) }
    }

    const grouped: Record<string, Task[]> = {}

    tasksToGroup.forEach((task) => {
      let groupKey = ""

      switch (groupBy) {
        case "project":
          groupKey = task.parentId ? "Sub-tasks" : "Projects"
          break
        case "priority":
          groupKey = task.priority
          break
        case "dueDate":
          if (!task.dueDate) {
            groupKey = "No Due Date"
          } else {
            switch (task.dueDate.type) {
              case "date": {
                const date = new Date(task.dueDate.value as string)
                const today = new Date()
                const tomorrow = new Date(today)
                tomorrow.setDate(tomorrow.getDate() + 1)
                const nextWeek = new Date(today)
                nextWeek.setDate(nextWeek.getDate() + 7)

                if (date < today) {
                  groupKey = "Overdue"
                } else if (
                  date.getDate() === today.getDate() &&
                  date.getMonth() === today.getMonth() &&
                  date.getFullYear() === today.getFullYear()
                ) {
                  groupKey = "Today"
                } else if (
                  date.getDate() === tomorrow.getDate() &&
                  date.getMonth() === tomorrow.getMonth() &&
                  date.getFullYear() === tomorrow.getFullYear()
                ) {
                  groupKey = "Tomorrow"
                } else if (date <= nextWeek) {
                  groupKey = "This Week"
                } else {
                  groupKey = "Later"
                }
                break
              }
              case "sprint":
                groupKey = `Sprint ${task.dueDate.value}`
                break
              case "quarter":
                groupKey = `Q${task.dueDate.value}`
                break
              case "year":
                groupKey = `${task.dueDate.value}`
                break
              default:
                groupKey = "Unknown"
            }
          }
          break
        default:
          groupKey = "All Tasks"
      }

      if (!grouped[groupKey]) {
        grouped[groupKey] = []
      }

      grouped[groupKey].push(task)
    })

    // Sort each group
    Object.keys(grouped).forEach((key) => {
      grouped[key] = sortTasks(grouped[key])
    })

    return grouped
  }

  const groupedTasks = groupTasks(tasks)

  const renderSourceIcon = (source: Task["source"]) => {
    if (!source) return null

    switch (source) {
      case "GitHub PR":
        return <Github className="h-4 w-4 text-muted-foreground" />
      case "Jira Issue":
        return <ExternalLink className="h-4 w-4 text-muted-foreground" />
      default:
        return null
    }
  }

  const handleQuickAction = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    // Find the task to determine its current status
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    // Apply the appropriate status change based on current status
    if (task.status === "Backlog") {
      onStatusChange?.(taskId, "Active")
    } else if (task.status === "Active") {
      onStatusChange?.(taskId, "Done")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSortChange("title")}
            className="flex items-center gap-1"
          >
            Title
            {sortField === "title" &&
              (sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSortChange("priority")}
            className="flex items-center gap-1"
          >
            Priority
            {sortField === "priority" &&
              (sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSortChange("dueDate")}
            className="flex items-center gap-1"
          >
            Due Date
            {sortField === "dueDate" &&
              (sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSortChange("createdDate")}
            className="flex items-center gap-1"
          >
            Created
            {sortField === "createdDate" &&
              (sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
          </Button>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Group By
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setGroupBy("none")}>None</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGroupBy("project")}>Project</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGroupBy("priority")}>Priority</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGroupBy("dueDate")}>Due Date</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {Object.entries(groupedTasks).map(([group, groupTasks]) => (
        <div key={group} className="space-y-2">
          <h3 className="font-medium text-lg">
            {group} ({groupTasks.length})
          </h3>
          <div className="space-y-2">
            {groupTasks.map((task) => (
              <Card key={task.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        {task.hasChildren && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => toggleTaskExpansion(task.id)}
                          >
                            {expandedTasks[task.id] ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Link href={`/task/${task.id}`} className="font-medium hover:underline">
                              {task.title}
                            </Link>
                            {task.hasChildren && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Folder className="h-3 w-3" />
                                Project
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                            {task.dueDate && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDueDate(task.dueDate)}
                              </Badge>
                            )}
                            {task.source && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                {renderSourceIcon(task.source)}
                                {task.source}
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
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Link href={`/task/${task.id}`} className="flex w-full">
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>Edit</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {task.status === "Backlog" && (
                                <DropdownMenuItem onClick={() => onStatusChange?.(task.id, "Active")}>
                                  Move to Active
                                </DropdownMenuItem>
                              )}
                              {task.status === "Active" && (
                                <DropdownMenuItem onClick={() => onStatusChange?.(task.id, "Done")}>
                                  Mark as Done
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => onStatusChange?.(task.id, "Canceled")}>
                                Cancel Task
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </div>
                  {expandedTasks[task.id] && (
                    <div className="border-t bg-muted/50 p-4">
                      <h4 className="mb-2 font-medium">Sub-tasks</h4>
                      <div className="space-y-2">
                        {/* This would be populated with actual sub-tasks */}
                        <p className="text-sm text-muted-foreground">No sub-tasks available in this demo.</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
