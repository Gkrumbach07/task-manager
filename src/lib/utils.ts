import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Task } from "./tasks/schemas"
import { TaskPriority, TaskStatus } from "./tasks/enums"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getCurrentTimeInfo = () => {
  const now = new Date()
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1
  // This would normally come from your project management system
  const currentSprint = 3

  return {
    date: now.toLocaleDateString(),
    sprint: currentSprint,
    quarter: currentQuarter,
  }
}

export const formatDueDate = (dueDate: Task["dueDate"] | null) => {
  if (!dueDate) return "No due date"

  switch (dueDate.type) {
    case "date":
      return new Date(dueDate.value).toLocaleDateString()
    case "quarter":
      return `Q${dueDate.value} ${new Date().getFullYear()}`
    case "sprint":
      return `Sprint ${dueDate.value}`
    case "year":
      return `${dueDate.value}`
    default:
      return "Unknown"
  }
}

export const getPriorityColor = (priority: TaskPriority) => {
  switch (priority) {
    case "Minor":
      return "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300"
    case "Normal":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    case "Major":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
    case "Critical":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    default:
      return "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300"
  }
}

export const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case "Backlog":
      return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
    case "Active":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
    case "Done":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    case "Canceled":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    default:
      return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
  }
}
