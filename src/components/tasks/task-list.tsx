"use client";

import { useMemo, useState, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowUpDown,
  Download,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { updateTask, deleteTask } from "@/lib/actions/tasks";
import { TaskDrawer } from "@/components/tasks/task-drawer";
import type { Task, TaskPriority } from "@/types/task";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  TASK_PRIORITIES,
  PRIORITY_LABELS,
  TASK_TYPE_LABELS,
} from "@/types/task";
import { formatDistanceToNow } from "date-fns";

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-[#EE6C29] text-white",
  high: "bg-[#EE6C29] text-white",
  medium: "bg-[#3D4141] text-[#D4DADA]",
  low: "bg-[rgba(122,166,179,0.15)] text-[#9EC6D1]",
};

type TaskListProps = {
  tasks: Task[];
  onRefresh: () => void;
};

export function TaskList({ tasks, onRefresh }: TaskListProps) {
  "use no memo"; // useReactTable returns unstable refs incompatible with React Compiler
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleInlineStatusChange = useCallback(
    async (taskId: string, status: string) => {
      await updateTask({ id: taskId, status });
      onRefresh();
    },
    [onRefresh]
  );

  const handleInlinePriorityChange = useCallback(
    async (taskId: string, priority: string) => {
      await updateTask({ id: taskId, priority });
      onRefresh();
    },
    [onRefresh]
  );

  const columns = useMemo<ColumnDef<Task>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={() =>
              table.toggleAllPageRowsSelected(!table.getIsAllPageRowsSelected())
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
      },
      {
        accessorKey: "title",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="gap-1 -ml-2"
          >
            Title
            <ArrowUpDown className="size-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => {
              setSelectedTask(row.original);
              setDrawerOpen(true);
            }}
            className="text-sm font-medium text-foreground hover:text-primary text-left"
          >
            {row.getValue("title")}
          </button>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Select
            value={row.getValue("status") as string}
            onValueChange={(v) => v && handleInlineStatusChange(row.original.id, v)}
          >
            <SelectTrigger className="h-7 w-[120px] rounded-xl text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {TASK_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      },
      {
        accessorKey: "priority",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="gap-1 -ml-2"
          >
            Priority
            <ArrowUpDown className="size-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const priority = row.getValue("priority") as TaskPriority;
          return (
            <Select
              value={priority}
              onValueChange={(v) =>
                v && handleInlinePriorityChange(row.original.id, v)
              }
            >
              <SelectTrigger className="h-7 w-[100px] rounded-xl text-xs border-none p-0">
                <Badge
                  className={cn(
                    "rounded-full text-xs",
                    PRIORITY_COLORS[priority]
                  )}
                >
                  {PRIORITY_LABELS[priority]}
                </Badge>
              </SelectTrigger>
              <SelectContent>
                {TASK_PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        },
      },
      {
        accessorKey: "task_type",
        header: "Type",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {TASK_TYPE_LABELS[row.getValue("task_type") as keyof typeof TASK_TYPE_LABELS]}
          </span>
        ),
      },
      {
        accessorKey: "due_date",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="gap-1 -ml-2"
          >
            Due Date
            <ArrowUpDown className="size-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const due = row.getValue("due_date") as string | null;
          if (!due) return <span className="text-xs text-muted-foreground">&mdash;</span>;
          return (
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(due), { addSuffix: true })}
            </span>
          );
        },
      },
    ],
    [handleInlineStatusChange, handleInlinePriorityChange]
  );

  const activeTasks = useMemo(
    () => tasks.filter((t) => t.is_active),
    [tasks]
  );

  const table = useReactTable({
    data: activeTasks,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
  });

  const selectedCount = Object.keys(rowSelection).length;

  const handleBulkDelete = useCallback(async () => {
    const ids = table
      .getSelectedRowModel()
      .rows.map((r) => r.original.id);
    for (const id of ids) {
      await deleteTask(id);
    }
    setRowSelection({});
    onRefresh();
  }, [table, onRefresh]);

  const handleExportCsv = useCallback(() => {
    const rows = table.getFilteredRowModel().rows;
    const headers = ["Title", "Status", "Priority", "Type", "Due Date"];
    const csvRows = rows.map((r) => {
      const t = r.original;
      return [
        `"${t.title.replace(/"/g, '""')}"`,
        t.status,
        t.priority,
        t.task_type,
        t.due_date ?? "",
      ].join(",");
    });
    const csv = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tasks.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [table]);

  return (
    <>
      {/* Bulk actions bar */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-2 mb-3">
          <span className="text-sm font-medium">
            {selectedCount} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            className="gap-1 rounded-full"
          >
            <Trash2 className="size-3" />
            Delete
          </Button>
        </div>
      )}

      {/* Export */}
      <div className="flex justify-end mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExportCsv}
          className="gap-1 rounded-full"
        >
          <Download className="size-3.5" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
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
                    <TableCell key={cell.id}>
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
                  className="h-24 text-center text-muted-foreground"
                >
                  No tasks found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <TaskDrawer
        task={selectedTask}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onUpdated={onRefresh}
      />
    </>
  );
}
