"use client";

import { useState } from "react";
import Link from "next/link";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  ExternalLink,
  Trash2,
  Edit,
  Check,
  ArrowRight,
  Plus,
  Undo,
} from "lucide-react";
import { format } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getPriorityColor, getStatusColor, formatDueDate } from "@/lib/utils";
import { TaskDto } from "@/lib/tasks/schemas";
import { TaskStatus } from "@/lib/tasks/enums";
import { updateTaskStatus, deleteTask } from "@/lib/tasks/services/mutations";
import { useToast } from "@/hooks/use-toast";
import { TaskModal } from "./task-modal";
import TimeInfo from "../time-info"; // Assuming TimeInfo is in ../time-info
import { getProfile } from "@/lib/profile/services";
import { getTasks } from "@/lib/tasks/services";

// Regex to roughly identify Jira issue keys
const JIRA_KEY_REGEX = /^[A-Z][A-Z0-9]+-\d+$/;

export function TasksTable() {
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => getTasks(),
    staleTime: Infinity,
  });
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    staleTime: Infinity,
  });

  const jiraBaseUrl = profile?.jiraConfig.baseUrl;

  const [sorting, setSorting] = useState<SortingState>([
    { id: "updatedAt", desc: true }, // Default sort by updated date descending
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [statusFilter, setStatusFilter] = useState<string>("all"); // 'all', 'backlog', 'active', 'done', 'canceled'

  const [editTask, setEditTask] = useState<TaskDto | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- Action Handlers ---
  const handleStatusUpdate = async (
    taskId: string,
    newStatus: TaskDto["status"]
  ) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      toast({
        title: "Success",
        description: `Task status updated to ${newStatus}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["tasks"] }); // Invalidate based on your query key
    } catch (error) {
      console.error("Error updating task status:", error);
      toast({
        title: "Error",
        description: "Failed to update task status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (taskId: string) => {
    // Add confirmation dialog here if desired
    try {
      await deleteTask(taskId);
      toast({
        title: "Task Deleted",
        description: "The task has been permanently deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (task: TaskDto) => {
    setEditTask(task);
  };

  const handleCloseModal = () => {
    setEditTask(null);
    setShowCreateModal(false);
    // Optionally invalidate queries on close if needed, though submit usually does
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  };

  // --- Column Definitions (useMemo recommended if complex/dynamic) ---
  const columns: ColumnDef<TaskDto>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <Link
          href={`/task/${row.original.id}`}
          className="font-medium hover:underline"
          title={row.getValue("title")} // Add title attribute for long text
        >
          <span className="line-clamp-2">{row.getValue("title")}</span>{" "}
          {/* Limit lines */}
        </Link>
      ),
      filterFn: "includesString", // Enable basic filtering
    },
    {
      accessorKey: "priority",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Priority
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const priority = row.original.priority;
        return <Badge className={getPriorityColor(priority)}>{priority}</Badge>;
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const status = row.original.status;
        return <Badge className={getStatusColor(status)}>{status}</Badge>;
      },
      filterFn: (row, id, value) => {
        // Custom filter function for status
        if (value === "all") return true;
        return row.getValue(id) === value;
      },
    },
    {
      accessorKey: "dueDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Due Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const dueDate = row.original.dueDate;
        return <span className="text-sm">{formatDueDate(dueDate)}</span>;
      },
    },
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ row }) => {
        const source = row.original.source;
        const isJira = jiraBaseUrl && source && JIRA_KEY_REGEX.test(source);
        if (!source) {
          return <span className="text-muted-foreground text-sm">None</span>;
        }
        if (isJira) {
          return (
            <a
              href={`${jiraBaseUrl}/browse/${source}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              {source}
              <ExternalLink className="h-3 w-3" />
            </a>
          );
        }
        // Basic check for URL, otherwise just display text
        try {
          new URL(source); // Check if it's a valid URL
          return (
            <a
              href={source}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1 line-clamp-1"
              title={source}
            >
              {source.length > 30 ? source.substring(0, 27) + "..." : source}{" "}
              <ExternalLink className="h-3 w-3" />
            </a>
          );
        } catch {
          return (
            <span className="text-sm line-clamp-1" title={source}>
              {source}
            </span>
          );
        }
      },
    },
    {
      accessorKey: "updatedAt", // Assuming your TaskDto has updatedAt
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Last Updated
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const updatedAt = row.original.updatedAt;
        return (
          <span className="text-sm text-muted-foreground">
            {format(new Date(updatedAt), "PP p")}
          </span>
        ); // Format as 'Sep 10, 2024 1:30 PM'
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const task = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEdit(task)}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link
                  href={`/task/${task.id}`}
                  className="flex w-full items-center"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  <span>View Details</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              {task.status === TaskStatus.BACKLOG && (
                <DropdownMenuItem
                  onClick={() => handleStatusUpdate(task.id, TaskStatus.ACTIVE)}
                >
                  <ArrowRight className="mr-2 h-4 w-4 text-blue-500" />
                  <span>Move to Active</span>
                </DropdownMenuItem>
              )}
              {task.status === TaskStatus.ACTIVE && (
                <DropdownMenuItem
                  onClick={() => handleStatusUpdate(task.id, TaskStatus.DONE)}
                >
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  <span>Mark as Done</span>
                </DropdownMenuItem>
              )}
              {(task.status === TaskStatus.DONE ||
                task.status === TaskStatus.CANCELED) && (
                <DropdownMenuItem
                  onClick={() =>
                    handleStatusUpdate(task.id, TaskStatus.BACKLOG)
                  }
                >
                  <Undo className="mr-2 h-4 w-4" />
                  <span>Restore to Backlog</span>
                </DropdownMenuItem>
              )}
              {task.status !== TaskStatus.CANCELED &&
                task.status !== TaskStatus.DONE && (
                  <DropdownMenuItem
                    onClick={() =>
                      handleStatusUpdate(task.id, TaskStatus.CANCELED)
                    }
                  >
                    <Trash2 className="mr-2 h-4 w-4 text-orange-500" />{" "}
                    {/* Using Trash2 for Cancel */}
                    <span>Cancel Task</span>
                  </DropdownMenuItem>
                )}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDelete(task.id)}
                className="text-red-600 focus:text-red-700 focus:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete permanently</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // --- Table Instance ---
  const table = useReactTable({
    data: tasks,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 15, // Default page size
      },
    },
    // Pass filter value to the table state
    // This ensures the filter function receives the value
    manualFiltering: false, // We use client-side filtering here
  });

  // Apply status filter
  // Apply status filter whenever statusFilter state changes
  // We do this outside useReactTable as setFilterValue triggers a rerender anyway
  // table.getColumn("status")?.setFilterValue(statusFilter);

  return (
    <div className="w-full space-y-4">
      {/* Time Info */}
      <div className="text-sm text-muted-foreground">
        <TimeInfo />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 py-4">
        <Input
          placeholder="Filter tasks by title..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="max-w-sm h-9" // Adjusted height
        />
        {/* Create Task Button */}
        <Button
          size="sm"
          className="h-9"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Create Task
        </Button>

        <div className="ml-auto flex items-center gap-2">
          {/* Status Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                Status:{" "}
                {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  // Directly apply filter here or rely on useEffect/table state update
                  table.getColumn("status")?.setFilterValue(value);
                }}
              >
                <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                {Object.values(TaskStatus).map((status) => (
                  <DropdownMenuRadioItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() +
                      status.slice(1).toLowerCase()}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2 px-4">
                      {" "}
                      {/* Adjusted padding */}
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No tasks found. Try adjusting your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} task(s) found.
          {/* Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()} */}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Modals */}
      {(editTask || showCreateModal) && (
        <TaskModal
          key={editTask?.id || "create"} // Add key for re-mounting on edit change
          defaultValues={editTask || undefined}
          onClose={handleCloseModal}
          // onSubmit might not be needed if onClose invalidates queries
        />
      )}
    </div>
  );
}
