// src/lib/tasks/mappers.ts
import type { Prisma, tasks as PrismaTask } from "@prisma/client";
import {
  type CreateTaskDto,
  type UpdateTaskDto,
  type TaskDto,
} from "./schemas";
import { DueDateType, TaskPriority, TaskStatus } from "./enums";


export function toPrismaCreateInput(dto: CreateTaskDto, userId: string): Prisma.tasksCreateInput {
  return {
    title:          dto.title,
    body:           dto.body,
    due_date_type:  dto.dueDate?.type  ?? null,
    due_date_value: dto.dueDate?.value ?? null,
    status:         dto.status,
    source:         dto.source,
    priority:       dto.priority,
	  user_id:		userId,
  };
}

export function toPrismaUpdateInput(dto: UpdateTaskDto): Prisma.tasksUpdateInput {
  const data: Prisma.tasksUpdateInput = {};

  if (dto.title     !== undefined) data.title          = dto.title;
  if (dto.body      !== undefined) data.body           = dto.body;
  if (dto.dueDate   !== undefined) {
    data.due_date_type  = dto.dueDate?.type  ?? null;
    data.due_date_value = dto.dueDate?.value ?? null;
  }
  if (dto.status    !== undefined) data.status         = dto.status;
  if (dto.source    !== undefined) data.source         = dto.source;
  if (dto.priority  !== undefined) data.priority       = dto.priority;

  return data;
}

export function fromPrisma(row: PrismaTask): TaskDto {
  return {
    id:        row.id,
    title:     row.title,
    body:      row.body,
    dueDate:   row.due_date_type
      ? { type: row.due_date_type as DueDateType, value: row.due_date_value! }
      : null,
    status:    row.status as TaskStatus,
    source:    row.source,
    priority:  row.priority as TaskPriority,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
