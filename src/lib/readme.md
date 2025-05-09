# `src/lib` Directory Structure and Conventions

This document outlines the structure and conventions used within the `src/lib` directory, which houses core business logic, data access patterns, and utility functions for the application.

## Overview

The `src/lib` directory is organized by feature or domain. Each feature typically follows a consistent pattern for handling data validation, transformation, fetching, and modification. This promotes code organization, reusability, and maintainability.

## Core Concepts & File Types

Each feature folder (e.g., `tasks`, `profile`, `jira-jql-queries`) generally contains the following components:

1.  **`schemas.ts`**:
    *   **Purpose**: Defines Zod schemas for data validation and type inference. These schemas are used for:
        *   Validating input/output of API routes or server actions.
        *   Validating data fetched from external sources or databases.
        *   Deriving TypeScript types (DTOs - Data Transfer Objects).
    *   **Example**: Defining a `TaskSchema` and deriving `type TaskDto = z.infer<typeof TaskSchema>;`.

2.  **`mappers.ts`**:
    *   **Purpose**: Contains functions responsible for transforming data between different representations. This is often used to map Prisma model types to our defined DTOs (`TaskDto`).
    *   **Benefit**: Decouples the database representation from the application's data structure, allowing for easier modifications and preventing accidental exposure of sensitive fields.
    *   **Example**: A function `mapPrismaTaskToDto(prismaTask: PrismaTask): TaskDto`.

3.  **`services/`**: This subdirectory contains the core logic for interacting with data sources.
    *   **`queries.ts`**:
        *   **Purpose**: Houses functions primarily responsible for fetching data. These functions often interact with Prisma (or other data sources like external APIs) and utilize mappers to return data in the expected DTO format.
        *   **Example**: `getTasks(): Promise<TaskDto[]>`, `getTaskById(id: string): Promise<TaskDto | null>`.
    *   **`mutations.ts`**:
        *   **Purpose**: Contains functions for creating, updating, or deleting data. Similar to queries, they interact with data sources and often take DTOs or specific parameters as input.
        *   **Example**: `createTask(data: CreateTaskDto): Promise<TaskDto>`, `updateTaskStatus(id: string, status: TaskStatus): Promise<void>`.
    *   **`cached.ts` (Optional)**:
        *   **Purpose**: Wraps query functions with caching mechanisms, typically using Next.js `unstable_cache` or similar libraries. This is used for data that doesn't change frequently and can be cached for performance.
        *   **Note**: Not all features require or benefit from caching (e.g., `jira-jql-queries` might interact directly with an API or have different caching needs).
        *   **Example**: `getCachedPublicTasks()` wrapping `getPublicTasks()` from `queries.ts`.
    *   **`index.ts`**:
        *   **Purpose**: Acts as the public interface for the feature module. It exports the necessary functions (queries, mutations, cached functions) that other parts of the application (like API routes, server components, or client components) should consume.
        *   **Benefit**: Encapsulates the internal implementation details of the feature.

4.  **`utils.ts` (Root Level)**:
    *   **Purpose**: Contains general utility functions that might be shared across multiple features within `lib` or other parts of the application.
    *   **Example**: Formatting dates (`formatDueDate`), determining badge colors (`getPriorityColor`, `getStatusColor`).

5.  **`enums.ts` or `constants.ts` (Optional)**:
    *   **Purpose**: Defines feature-specific enums or constants.
    *   **Example**: `TaskStatus` enum in `src/lib/tasks/enums.ts`.

## Adding a New Feature (e.g., a new Prisma Table)

Follow these steps to integrate a new feature, assuming you've already added the corresponding model to `prisma/schema.prisma` and run `prisma generate`:

1.  **Create Feature Folder**: Create a new directory in `src/lib` (e.g., `src/lib/new-feature`).
2.  **Define Schemas (`schemas.ts`)**:
    *   Create Zod schemas for your new model, including variations for creation, updates, and the primary DTO.
    *   Infer TypeScript types from these schemas.
3.  **Create Mappers (`mappers.ts`)**:
    *   Write functions to map the Prisma-generated type for your model to your primary DTO defined in `schemas.ts`.
4.  **Implement Queries (`services/queries.ts`)**:
    *   Write functions to fetch data using Prisma Client (`import prisma from '@/lib/prisma';`).
    *   Use the mappers to transform the fetched Prisma data into DTOs before returning.
5.  **Implement Mutations (`services/mutations.ts`)**:
    *   Write functions for CUD (Create, Update, Delete) operations using Prisma Client.
    *   Ensure input data is validated (potentially using schemas) and return appropriate DTOs or void.
6.  **(Optional) Implement Caching (`services/cached.ts`)**:
    *   If needed, wrap query functions from `queries.ts` using `unstable_cache` or other caching strategies. Define appropriate tags for revalidation.
7.  **Expose Public API (`services/index.ts`)**:
    *   Export the relevant query, mutation, and cached functions that should be accessible outside the feature module.
8.  **Update Prisma Client**: Ensure your Prisma client is generated (`npx prisma generate`) after schema changes.

## Frontend Integration with React Query & Next.js

This library integrates smoothly with `@tanstack/react-query` for state management and data fetching in the frontend, especially within a Next.js App Router context.

**Pattern: Server-Side Prefetching + Client-Side Hydration**

This pattern leverages Next.js Server Components and React Query's hydration mechanism for optimal performance and reduced client-side loading states.

1.  **Server Component (`page.tsx` or layout)**:
    *   Make the page component `async`.
    *   Import necessary query functions from the feature's `services/index.ts` (or `services/cached.ts`).
    *   Import `QueryClient`, `HydrationBoundary`, and `dehydrate` from `@tanstack/react-query`.
    *   Create a `QueryClient` instance.
    *   Use `qc.prefetchQuery` to fetch initial data on the server. Use the **same query key** that you will use on the client.
    *   Wrap the client component(s) that will use this data with `<HydrationBoundary state={dehydrate(qc)}>`.

    ```typescript
    // Example: src/app/(protected)/tasks/page.tsx
    import { Suspense } from "react";
    import { getTasks } from "@/lib/tasks/services"; // Import query
    import {
      dehydrate,
      HydrationBoundary,
      QueryClient,
    } from "@tanstack/react-query";
    import { TasksTable } from "@/components/tasks/tasks-table";
    import { TasksTableSkeleton } from "@/components/skeletons/tasks-table-skeleton";
    import { getProfile } from "@/lib/profile/services";

    async function TasksTableShell() {
      const qc = new QueryClient();

      // Prefetch data on the server
      await qc.prefetchQuery({
        queryKey: ["tasks"], // Use the same key as in the client component
        queryFn: () => getTasks(),
      });
       await qc.prefetchQuery({
         queryKey: ["profile"],
         queryFn: getProfile,
       });

      // Pass dehydrated state to the boundary
      return (
        <HydrationBoundary state={dehydrate(qc)}>
          <Suspense fallback={<TasksTableSkeleton />}>
            <TasksTable />
          </Suspense>
        </HydrationBoundary>
      );
    }

    export default function TasksPage() {
      // ... page structure ...
      return (
         <TasksTableShell />
      )
    }
    ```

2.  **Client Component (`"use client"`)**:
    *   Import `useQuery` from `@tanstack/react-query`.
    *   Import the *same* query function used for prefetching.
    *   Call `useQuery` with the **exact same query key** used in the server component's `prefetchQuery`.
    *   React Query will automatically hydrate the query state with the prefetched data, avoiding an initial fetch on the client.
    *   Set `staleTime: Infinity` if the prefetched data should be considered fresh indefinitely until invalidated, or use other appropriate caching strategies.

    ```typescript
    // Example: src/components/tasks/tasks-table.tsx
    "use client";

    import { useQuery } from "@tanstack/react-query";
    import { getTasks } from "@/lib/tasks/services"; // Import the same query function
    import { getProfile } from "@/lib/profile/services";
    // ... other imports
****
    export function TasksTable() {
      // Use the same query key as used in prefetchQuery
      const { data: tasks = [] } = useQuery({
        queryKey: ["tasks"],
        queryFn: () => getTasks(), // The actual fetch function
        staleTime: Infinity, // Consider prefetched data fresh
      });
       const { data: profile } = useQuery({
        queryKey: ["profile"],
        queryFn: getProfile,
        staleTime: Infinity,
      });

      // ... rest of the component logic using 'tasks' and 'profile' data ...
    }
    ```

3.  **Mutations and Invalidations**:
    *   Import mutation functions from the feature's `services/index.ts`.
    *   Use `useMutation` from `@tanstack/react-query`.
    *   In the `onSuccess` or `onSettled` callback of `useMutation`, use `queryClient.invalidateQueries({ queryKey: ["yourQueryKey"] })` to refetch data after a successful mutation, ensuring the UI updates.

This combination provides a robust way to fetch, cache, and manage server state within the Next.js application.
