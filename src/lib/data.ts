import { supabaseClient } from "./supabase/client"
import { v4 as uuidv4 } from "uuid"

export type TaskStatus = "Backlog" | "Active" | "Done" | "Canceled"
export type TaskPriority = "Minor" | "Normal" | "Major" | "Critical"
export type TaskSource = "GitHub PR" | "Jira Issue" | "Manual" | null

export type DueDate = {
  type: "date" | "quarter" | "sprint" | "year"
  value: string | number
}

export interface Task {
  id: string
  title: string
  body: string
  parentId: string | null
  dueDate: DueDate | null
  createdDate: Date
  status: TaskStatus
  source: TaskSource
  priority: TaskPriority
  hasChildren?: boolean
  userId?: string | null
}

// Database to client model conversion
export const dbTaskToClientTask = (dbTask: any): Task => {
  return {
    id: dbTask.id,
    title: dbTask.title,
    body: dbTask.body,
    parentId: dbTask.parent_id,
    dueDate: dbTask.due_date_type
      ? {
          type: dbTask.due_date_type as "date" | "quarter" | "sprint" | "year",
          value: dbTask.due_date_value,
        }
      : null,
    createdDate: new Date(dbTask.created_date),
    status: dbTask.status as TaskStatus,
    source: dbTask.source as TaskSource,
    priority: dbTask.priority as TaskPriority,
    userId: dbTask.user_id,
    hasChildren: false, // Will be updated later if needed
  }
}

// Client to database model conversion
export const clientTaskToDbTask = (task: Partial<Task>) => {
  return {
    id: task.id,
    title: task.title,
    body: task.body,
    parent_id: task.parentId,
    due_date_type: task.dueDate?.type,
    due_date_value: task.dueDate?.value?.toString(),
    status: task.status,
    source: task.source,
    priority: task.priority,
    user_id: task.userId,
  }
}

// Get all tasks for the current user
export const getTasks = async (): Promise<Task[]> => {
  const {
    data: { user },
  } = await supabaseClient.auth.getUser()

  if (!user) return []

  const { data, error } = await supabaseClient.from("tasks").select("*").eq("user_id", user.id)

  if (error) {
    console.error("Error fetching tasks:", error)
    return []
  }

  // Convert to client model
  const tasks = data.map(dbTaskToClientTask)

  // Update hasChildren property
  const tasksWithChildren = new Set(tasks.filter((t) => t.parentId).map((t) => t.parentId))
  return tasks.map((task) => ({
    ...task,
    hasChildren: tasksWithChildren.has(task.id),
  }))
}

// Get tasks by status for the current user
export const getTasksByStatus = async (status: TaskStatus | TaskStatus[]): Promise<Task[]> => {
  const {
    data: { user },
  } = await supabaseClient.auth.getUser()

  if (!user) return []

  const statusArray = Array.isArray(status) ? status : [status]

  const { data, error } = await supabaseClient
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .in("status", statusArray)

  if (error) {
    console.error("Error fetching tasks by status:", error)
    return []
  }

  // Convert to client model
  const tasks = data.map(dbTaskToClientTask)

  // Update hasChildren property
  const tasksWithChildren = new Set(tasks.filter((t) => t.parentId).map((t) => t.parentId))
  return tasks.map((task) => ({
    ...task,
    hasChildren: tasksWithChildren.has(task.id),
  }))
}

// Get child tasks
export const getChildTasks = async (parentId: string): Promise<Task[]> => {
  const {
    data: { user },
  } = await supabaseClient.auth.getUser()

  if (!user) return []

  const { data, error } = await supabaseClient
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("parent_id", parentId)

  if (error) {
    console.error("Error fetching child tasks:", error)
    return []
  }

  return data.map(dbTaskToClientTask)
}

// Get task by ID
export const getTaskById = async (id: string): Promise<Task | null> => {
  const {
    data: { user },
  } = await supabaseClient.auth.getUser()

  if (!user) return null

  const { data, error } = await supabaseClient.from("tasks").select("*").eq("user_id", user.id).eq("id", id).single()

  if (error) {
    console.error("Error fetching task by ID:", error)
    return null
  }

  return dbTaskToClientTask(data)
}

// Create a new task
export const createTask = async (task: Omit<Task, "id" | "createdDate" | "userId">): Promise<Task | null> => {
  const {
    data: { user },
  } = await supabaseClient.auth.getUser()

  if (!user) return null

  const newTask = {
    ...clientTaskToDbTask(task as Partial<Task>),
    id: uuidv4(),
    user_id: user.id,
  }

  const { data, error } = await supabaseClient.from("tasks").insert(newTask).select().single()

  if (error) {
    console.error("Error creating task:", error)
    return null
  }

  return dbTaskToClientTask(data)
}

// Update a task
export const updateTask = async (id: string, task: Partial<Task>): Promise<Task | null> => {
  const {
    data: { user },
  } = await supabaseClient.auth.getUser()

  if (!user) return null

  // Ensure we're only updating the user's own tasks
  const { data: existingTask, error: fetchError } = await supabaseClient
    .from("tasks")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (fetchError || !existingTask) {
    console.error("Error fetching task to update or task not found:", fetchError)
    return null
  }

  const { data, error } = await supabaseClient
    .from("tasks")
    .update(clientTaskToDbTask(task))
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    console.error("Error updating task:", error)
    return null
  }

  return dbTaskToClientTask(data)
}

// Delete a task
export const deleteTask = async (id: string): Promise<boolean> => {
  const {
    data: { user },
  } = await supabaseClient.auth.getUser()

  if (!user) return false

  const { error } = await supabaseClient.from("tasks").delete().eq("id", id).eq("user_id", user.id)

  if (error) {
    console.error("Error deleting task:", error)
    return false
  }

  return true
}

// Update task status
export const updateTaskStatus = async (id: string, status: TaskStatus): Promise<Task | null> => {
  return updateTask(id, { status })
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

export const formatDueDate = (dueDate: DueDate | null) => {
  if (!dueDate) return "No due date"

  switch (dueDate.type) {
    case "date":
      return new Date(dueDate.value as string).toLocaleDateString()
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

export const tasks: Task[] = []
