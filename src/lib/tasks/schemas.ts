// src/lib/tasks/schemas.ts
import { z } from "zod";
import { TaskStatus, TaskPriority, DueDateType } from "./enums";

// Full Task shape returned to clients
export const taskDtoSchema = z.object({
  id:        z.string(),
  title:     z.string(),
  body:      z.string().nullable(),
  dueDate:   z
    .object({
      type:  z.nativeEnum(DueDateType),
      value: z.string(),
    })
    .nullable(),
  status:    z.nativeEnum(TaskStatus),
  source:    z.string().nullable(),
  priority:  z.nativeEnum(TaskPriority),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type TaskDto = z.infer<typeof taskDtoSchema>;

// What clients send to CREATE
export const createTaskSchema = taskDtoSchema
  .omit({ id: true, createdAt: true, updatedAt: true });
export type CreateTaskDto = z.infer<typeof createTaskSchema>;

// What clients send to UPDATE
export const updateTaskSchema = taskDtoSchema
  .partial()
  .omit({ createdAt: true, updatedAt: true })
  .required({
    id: true,
  });
export type UpdateTaskDto = z.infer<typeof updateTaskSchema>;
