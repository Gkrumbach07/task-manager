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
}

// Mock data for development
export const tasks: Task[] = [
  {
    id: "task-1",
    title: "Design task manager UI",
    body: "# Design Task Manager UI\n\nCreate wireframes and mockups for the task manager application. Focus on the list view and make sure it's responsive.\n\n## Requirements\n- Clean, minimal design\n- Mobile-friendly\n- Dark mode support",
    parentId: null,
    dueDate: { type: "date", value: "2025-04-20" },
    createdDate: new Date("2025-04-10"),
    status: "Active",
    source: "Jira Issue",
    priority: "Major",
    hasChildren: true,
  },
  {
    id: "task-2",
    title: "Create header component",
    body: "Create a responsive header component with navigation and user profile dropdown.",
    parentId: "task-1",
    dueDate: { type: "date", value: "2025-04-18" },
    createdDate: new Date("2025-04-11"),
    status: "Active",
    source: "GitHub PR",
    priority: "Normal",
  },
  {
    id: "task-3",
    title: "Implement task list component",
    body: "Create a component to display tasks in a list format with sorting and filtering options.",
    parentId: "task-1",
    dueDate: { type: "date", value: "2025-04-19" },
    createdDate: new Date("2025-04-12"),
    status: "Backlog",
    source: "Manual",
    priority: "Major",
  },
  {
    id: "task-4",
    title: "Backend API development",
    body: "# Backend API Development\n\nDevelop RESTful API endpoints for task management.\n\n## Endpoints needed:\n- GET /tasks\n- POST /tasks\n- PUT /tasks/:id\n- DELETE /tasks/:id\n\n## Authentication\nImplement JWT authentication for API security.",
    parentId: null,
    dueDate: { type: "quarter", value: 2 },
    createdDate: new Date("2025-04-05"),
    status: "Backlog",
    source: "Jira Issue",
    priority: "Critical",
    hasChildren: true,
  },
  {
    id: "task-5",
    title: "Database schema design",
    body: "Design the database schema for tasks, users, and relationships.",
    parentId: "task-4",
    dueDate: { type: "sprint", value: 3 },
    createdDate: new Date("2025-04-06"),
    status: "Backlog",
    source: null,
    priority: "Major",
  },
  {
    id: "task-6",
    title: "Implement authentication",
    body: "Set up JWT authentication for the API.",
    parentId: "task-4",
    dueDate: { type: "sprint", value: 3 },
    createdDate: new Date("2025-04-07"),
    status: "Backlog",
    source: null,
    priority: "Critical",
  },
  {
    id: "task-7",
    title: "Write documentation",
    body: "Create comprehensive documentation for the API.",
    parentId: "task-4",
    dueDate: { type: "sprint", value: 4 },
    createdDate: new Date("2025-04-08"),
    status: "Backlog",
    source: null,
    priority: "Normal",
  },
  {
    id: "task-8",
    title: "Deploy to production",
    body: "Deploy the application to production environment.",
    parentId: null,
    dueDate: { type: "year", value: 2025 },
    createdDate: new Date("2025-04-01"),
    status: "Backlog",
    source: "Manual",
    priority: "Major",
  },
  {
    id: "task-9",
    title: "User testing",
    body: "Conduct user testing sessions and gather feedback.",
    parentId: null,
    dueDate: { type: "quarter", value: 3 },
    createdDate: new Date("2025-04-02"),
    status: "Backlog",
    source: "Jira Issue",
    priority: "Normal",
  },
  {
    id: "task-10",
    title: "Fix navigation bug",
    body: "Fix the navigation bug that occurs on mobile devices.",
    parentId: null,
    dueDate: { type: "date", value: "2025-04-15" },
    createdDate: new Date("2025-04-09"),
    status: "Done",
    source: "GitHub PR",
    priority: "Major",
  },
  {
    id: "task-11",
    title: "Update dependencies",
    body: "Update all npm dependencies to their latest versions.",
    parentId: null,
    dueDate: { type: "date", value: "2025-04-05" },
    createdDate: new Date("2025-04-03"),
    status: "Canceled",
    source: null,
    priority: "Minor",
  },
]

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

export const getTasksByStatus = (status: TaskStatus | TaskStatus[]) => {
  const statusArray = Array.isArray(status) ? status : [status]
  return tasks.filter((task) => statusArray.includes(task.status))
}

export const getChildTasks = (parentId: string) => {
  return tasks.filter((task) => task.parentId === parentId)
}

export const getTaskById = (id: string) => {
  return tasks.find((task) => task.id === id)
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
