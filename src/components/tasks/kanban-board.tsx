"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskDrawer } from "@/components/tasks/task-drawer";
import { updateTaskStatus, reorderTasks } from "@/lib/actions/tasks";
import { KANBAN_STATUSES, TASK_STATUS_LABELS } from "@/types/task";
import type { Task, TaskCardData, TaskStatus } from "@/types/task";
import { Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ─── Status dot colours ───────────────────────────────────────────── */
const STATUS_DOT: Record<string, string> = {
  created: "bg-[#505555]",
  assigned: "bg-[#7AA6B3]",
  in_progress: "bg-[#EE6C29]",
  in_review: "bg-[#9EC6D1]",
  completed: "bg-[#3D4141]",
};

// ─── Sortable Task Card (draggable) ────────────────────────────────
function SortableTaskCard({
  task,
  onClick,
  index = 0,
}: {
  task: TaskCardData;
  onClick: () => void;
  index?: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    animationDelay: `${index * 30}ms`,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="transition-transform duration-200 animate-fade-in-up press-scale"
    >
      <TaskCard task={task} onClick={onClick} isDragging={isDragging} />
    </div>
  );
}

// ─── Kanban Column ─────────────────────────────────────────────────
function KanbanColumn({
  status,
  tasks,
  onTaskClick,
  onAddTask,
}: {
  status: TaskStatus;
  tasks: TaskCardData[];
  onTaskClick: (taskId: string) => void;
  onAddTask: (status: TaskStatus) => void;
}) {
  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

  return (
    <div className="flex w-[300px] shrink-0 flex-col rounded-xl border border-border/50 bg-[#1E2020]/40 .light:bg-muted/20">
      {/* Column header */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "size-2.5 rounded-full shrink-0",
              STATUS_DOT[status] ?? "bg-muted"
            )}
          />
          <h3 className="text-sm font-semibold text-foreground">
            {TASK_STATUS_LABELS[status]}
          </h3>
          <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[0.65rem] font-bold text-muted-foreground tabular-nums">
            {tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onAddTask(status)}
            aria-label={`Add task to ${TASK_STATUS_LABELS[status]}`}
            className="rounded-full"
          >
            <Plus className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`${TASK_STATUS_LABELS[status]} options`}
            className="rounded-full"
          >
            <MoreHorizontal className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Add card (top of column) */}
      <div className="px-2 pt-2">
        <button
          type="button"
          onClick={() => onAddTask(status)}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/60 bg-transparent px-3 py-2.5 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:border-primary/40 hover:text-primary hover:bg-primary/5 min-h-[40px]"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          <span>Add task</span>
        </button>
      </div>

      {/* Cards */}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 py-2 scrollbar-thin min-h-[120px]">
          {tasks.map((task, i) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task.id)}
              index={i}
            />
          ))}

          {/* Empty state */}
          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted mb-2">
                <Plus className="size-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                No tasks yet
              </p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ─── Kanban Board ──────────────────────────────────────────────────────────

type KanbanBoardProps = {
  tasks: Task[];
  onRefresh: () => void;
  onAddTask?: (status: TaskStatus) => void;
};

export function KanbanBoard({ tasks, onRefresh, onAddTask }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  // Group tasks by status
  const columns = useMemo(() => {
    const grouped: Record<TaskStatus, TaskCardData[]> = {} as Record<
      TaskStatus,
      TaskCardData[]
    >;
    for (const status of KANBAN_STATUSES) {
      grouped[status] = [];
    }
    for (const task of tasks) {
      if (!task.is_active) continue;
      const status = task.status as TaskStatus;
      if (grouped[status]) {
        grouped[status].push({
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          due_date: task.due_date,
          checklist: task.checklist,
          sort_order: task.sort_order,
          assignee_id: task.assignee_id,
          assignee: null, // Would be populated from a join
        });
      }
    }
    // Sort each column by sort_order
    for (const status of KANBAN_STATUSES) {
      grouped[status].sort((a, b) => a.sort_order - b.sort_order);
    }
    return grouped;
  }, [tasks]);

  const activeTask = useMemo(
    () => tasks.find((t) => t.id === activeId) ?? null,
    [tasks, activeId]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over) return;

      const draggedTaskId = active.id as string;
      const draggedTask = tasks.find((t) => t.id === draggedTaskId);
      if (!draggedTask) return;

      // Determine target column/status
      // The "over" could be another task or a column droppable
      let targetStatus: TaskStatus | null = null;
      const overTask = tasks.find((t) => t.id === (over.id as string));

      if (overTask) {
        targetStatus = overTask.status as TaskStatus;
      } else {
        // over.id might be a status string (column droppable)
        targetStatus = over.id as TaskStatus;
      }

      if (!targetStatus || !KANBAN_STATUSES.includes(targetStatus)) return;

      // If status changed, update it
      if (draggedTask.status !== targetStatus) {
        await updateTaskStatus(draggedTaskId, targetStatus);
      }

      // Reorder within the target column
      const targetTasks = columns[targetStatus].filter(
        (t) => t.id !== draggedTaskId
      );
      // Find insertion index
      let insertIndex = targetTasks.length;
      if (overTask && overTask.id !== draggedTaskId) {
        const overIndex = targetTasks.findIndex((t) => t.id === overTask.id);
        if (overIndex >= 0) insertIndex = overIndex;
      }

      const reorderUpdates = targetTasks.map((t, idx) => ({
        id: t.id,
        sort_order: idx >= insertIndex ? idx + 1 : idx,
      }));
      reorderUpdates.splice(insertIndex, 0, {
        id: draggedTaskId,
        sort_order: insertIndex,
      });

      await reorderTasks(
        reorderUpdates.map((u) => ({
          ...u,
          status: targetStatus as string,
        }))
      );

      onRefresh();
    },
    [tasks, columns, onRefresh]
  );

  const handleTaskClick = useCallback(
    (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        setSelectedTask(task);
        setDrawerOpen(true);
      }
    },
    [tasks]
  );

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_STATUSES.map((status, i) => (
            <div
              key={status}
              className="animate-fade-in-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <KanbanColumn
                status={status}
                tasks={columns[status]}
                onTaskClick={handleTaskClick}
                onAddTask={onAddTask ?? (() => {})}
              />
            </div>
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <div className="w-[280px] rotate-[2deg] scale-105">
              <TaskCard
                task={{
                  id: activeTask.id,
                  title: activeTask.title,
                  status: activeTask.status,
                  priority: activeTask.priority,
                  due_date: activeTask.due_date,
                  checklist: activeTask.checklist,
                  sort_order: activeTask.sort_order,
                  assignee_id: activeTask.assignee_id,
                  assignee: null,
                }}
                isDragging
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskDrawer
        task={selectedTask}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onUpdated={onRefresh}
      />
    </>
  );
}
