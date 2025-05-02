'use server'

import { prisma } from "@/lib/prisma/server";
import { TaskStatus } from "../enums";
import { fromPrisma, toPrismaCreateInput, toPrismaUpdateInput } from "../mappers";
import { CreateTaskDto, TaskDto, UpdateTaskDto } from "../schemas";
import { getUserStrict } from "@/lib/auth/actions";
import { revalidateTag } from "next/cache";

// Create a new task
export const createTask = async (taskInput: CreateTaskDto): Promise<TaskDto | null> => {
  const user = await getUserStrict()

  try {
    const data = await prisma.tasks.create({
      data: toPrismaCreateInput(taskInput, user.id),
    })
    revalidateTag(`tasks`)
    return fromPrisma(data);
  } catch (error) {
    console.error("Error creating task:", error);
    return null;
  }
};

// Update a task
export const updateTask = async (task: UpdateTaskDto): Promise<TaskDto | null> => {
  const user = await getUserStrict()

  try {
    const data = await prisma.tasks.update({
      where: { id: task.id, user_id: user.id },
      data: toPrismaUpdateInput(task),
    });
    revalidateTag(`tasks`)
    return fromPrisma(data);
  } catch (error) {
    console.error("Error updating task:", error);
    return null;
  }
};

// Delete a task
export const deleteTask = async (id: string): Promise<boolean> => {

  const user = await getUserStrict()

  try {
    await prisma.tasks.delete({
      where: { id, user_id: user.id },
    });
    revalidateTag(`tasks`)
    return true;
  } catch (error) {
    console.error("Error deleting task:", error);
    return false;
  }
};

// Update task status
export const updateTaskStatus = async (id: string, status: TaskStatus): Promise<TaskDto | null> => {
  const task = await updateTask({ id, status });
  revalidateTag(`tasks`)
  return task;
};
