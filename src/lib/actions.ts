"use server"

import { createServerSupabaseClient } from "./supabase/server"
import { type TaskStatus, type Task, dbTaskToClientTask } from "./data"
import { v4 as uuidv4 } from "uuid"

// Create a new task
export async function createTaskAction(formData: FormData) {
  try {
    const supabase = createServerSupabaseClient()

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    const title = formData.get("title") as string
    const body = formData.get("body") as string
    const parentId = (formData.get("parentId") as string) || null
    const status = formData.get("status") as TaskStatus
    const priority = formData.get("priority") as Task["priority"]
    const source = (formData.get("source") as Task["source"]) || null

    // Handle due date
    const dueDateType = (formData.get("dueDateType") as string) || null
    const dueDateValue = (formData.get("dueDateValue") as string) || null

    const newTask = {
      id: uuidv4(),
      title,
      body,
      parent_id: parentId,
      status,
      priority,
      source,
      due_date_type: dueDateType,
      due_date_value: dueDateValue,
      user_id: user.id,
    }

    const { data, error } = await supabase.from("tasks").insert(newTask).select().single()

    if (error) throw error

    return { success: true, task: dbTaskToClientTask(data) }
  } catch (error) {
    console.error("Error creating task:", error)
    return { success: false, error: "Failed to create task" }
  }
}

// Update a task
export async function updateTaskAction(id: string, formData: FormData) {
  try {
    const supabase = createServerSupabaseClient()

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Verify the task belongs to the user
    const { data: existingTask, error: fetchError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !existingTask) {
      return { success: false, error: "Task not found or you don't have permission to update it" }
    }

    const title = formData.get("title") as string
    const body = formData.get("body") as string
    const parentId = (formData.get("parentId") as string) || null
    const status = formData.get("status") as TaskStatus
    const priority = formData.get("priority") as Task["priority"]
    const source = (formData.get("source") as Task["source"]) || null

    // Handle due date
    const dueDateType = (formData.get("dueDateType") as string) || null
    const dueDateValue = (formData.get("dueDateValue") as string) || null

    const updatedTask = {
      title,
      body,
      parent_id: parentId,
      status,
      priority,
      source,
      due_date_type: dueDateType,
      due_date_value: dueDateValue,
    }

    const { data, error } = await supabase.from("tasks").update(updatedTask).eq("id", id).select().single()

    if (error) throw error

    return { success: true, task: dbTaskToClientTask(data) }
  } catch (error) {
    console.error("Error updating task:", error)
    return { success: false, error: "Failed to update task" }
  }
}

// Update task status
export async function updateTaskStatusAction(id: string, status: TaskStatus) {
  try {
    const supabase = createServerSupabaseClient()

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Verify the task belongs to the user
    const { data: existingTask, error: fetchError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !existingTask) {
      return { success: false, error: "Task not found or you don't have permission to update it" }
    }

    const { data, error } = await supabase.from("tasks").update({ status }).eq("id", id).select().single()

    if (error) throw error

    return { success: true, task: dbTaskToClientTask(data) }
  } catch (error) {
    console.error("Error updating task status:", error)
    return { success: false, error: "Failed to update task status" }
  }
}

// Delete a task
export async function deleteTaskAction(id: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Verify the task belongs to the user
    const { data: existingTask, error: fetchError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !existingTask) {
      return { success: false, error: "Task not found or you don't have permission to delete it" }
    }

    const { error } = await supabase.from("tasks").delete().eq("id", id)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("Error deleting task:", error)
    return { success: false, error: "Failed to delete task" }
  }
}
