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
import { DealCard } from "@/components/crm/deal-card";
import { DealDrawer } from "@/components/crm/deal-drawer";
import { moveDealToStage, reorderDeals } from "@/lib/actions/crm";
import { useRouter } from "next/navigation";
import { Plus, MoreHorizontal, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PipelineStage, DealCardData, Deal } from "@/types/crm";

/* ─── Format currency helper ───────────────────────────────────────── */
const formatCompact = (value: number) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value);

// ─── Sortable deal card ────────────────────────────────────────────
function SortableDealCard({
  deal,
  onClick,
  index = 0,
}: {
  deal: DealCardData;
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
  } = useSortable({ id: deal.id });

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
      <DealCard deal={deal} onClick={onClick} isDragging={isDragging} />
    </div>
  );
}

// ─── Kanban Column ─────────────────────────────────────────────────
function StageColumn({
  stage,
  deals,
  onDealClick,
}: {
  stage: PipelineStage;
  deals: DealCardData[];
  onDealClick: (dealId: string) => void;
}) {
  const dealIds = useMemo(() => deals.map((d) => d.id), [deals]);
  const totalValue = useMemo(
    () => deals.reduce((sum, d) => sum + (d.value ?? 0), 0),
    [deals]
  );

  return (
    <div className="flex w-[300px] shrink-0 flex-col rounded-xl border border-[var(--border-default)]/50 bg-[var(--bg-base)]/40">
      {/* Column header */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-[var(--border-default)]/50">
        <div className="flex items-center gap-2.5">
          <div
            className="size-2.5 rounded-full shrink-0"
            style={{ backgroundColor: stage.colour }}
          />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            {stage.name}
          </h3>
          <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[0.65rem] font-bold text-[var(--text-muted)] tabular-nums">
            {deals.length}
          </span>
        </div>
        <span className="text-[0.65rem] font-medium text-[var(--text-hint)] tabular-nums">
          {totalValue > 0 ? formatCompact(totalValue) : "—"}
        </span>
      </div>

      {/* Cards */}
      <SortableContext items={dealIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 py-2 scrollbar-thin min-h-[120px]">
          {deals.map((deal, i) => (
            <SortableDealCard
              key={deal.id}
              deal={deal}
              onClick={() => onDealClick(deal.id)}
              index={i}
            />
          ))}

          {/* Empty state */}
          {deals.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted mb-2">
                <DollarSign className="size-4 text-[var(--text-muted)]" />
              </div>
              <p className="text-xs text-[var(--text-hint)]">No deals</p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ─── Pipeline Kanban Board ─────────────────────────────────────────
type PipelineKanbanProps = {
  stages: PipelineStage[];
  deals: Record<string, unknown>[];
  pipelineId: string;
};

export function PipelineKanban({
  stages,
  deals: rawDeals,
  pipelineId,
}: PipelineKanbanProps) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const deals = rawDeals as unknown as DealCardData[];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  // Group deals by stage
  const columns = useMemo(() => {
    const grouped: Record<string, DealCardData[]> = {};
    for (const stage of stages) {
      grouped[stage.id] = [];
    }
    for (const deal of deals) {
      const stageId = deal.stage_id ?? "";
      if (grouped[stageId]) {
        grouped[stageId].push(deal);
      }
    }
    // Sort each column by sort_order
    for (const stageId of Object.keys(grouped)) {
      grouped[stageId].sort((a, b) => a.sort_order - b.sort_order);
    }
    return grouped;
  }, [deals, stages]);

  const activeDeal = useMemo(
    () => deals.find((d) => d.id === activeId) ?? null,
    [deals, activeId]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over) return;

      const draggedId = active.id as string;
      const draggedDeal = deals.find((d) => d.id === draggedId);
      if (!draggedDeal) return;

      // Find target stage
      let targetStageId: string | null = null;
      const overDeal = deals.find((d) => d.id === (over.id as string));

      if (overDeal) {
        targetStageId = overDeal.stage_id;
      } else {
        // over.id might be a stage droppable
        const stageMatch = stages.find((s) => s.id === (over.id as string));
        if (stageMatch) targetStageId = stageMatch.id;
      }

      if (!targetStageId) return;

      // If stage changed, move deal
      if (draggedDeal.stage_id !== targetStageId) {
        await moveDealToStage(draggedId, targetStageId);
      }

      // Reorder in target column
      const targetDeals = (columns[targetStageId] ?? []).filter(
        (d) => d.id !== draggedId
      );
      let insertIndex = targetDeals.length;
      if (overDeal && overDeal.id !== draggedId) {
        const overIndex = targetDeals.findIndex((d) => d.id === overDeal.id);
        if (overIndex >= 0) insertIndex = overIndex;
      }

      const reorderUpdates = targetDeals.map((d, idx) => ({
        id: d.id,
        sort_order: idx >= insertIndex ? idx + 1 : idx,
      }));
      reorderUpdates.splice(insertIndex, 0, {
        id: draggedId,
        sort_order: insertIndex,
      });

      await reorderDeals(
        reorderUpdates.map((u) => ({
          ...u,
          stage_id: targetStageId as string,
        }))
      );

      router.refresh();
    },
    [deals, columns, stages, router]
  );

  const handleDealClick = useCallback(
    (dealId: string) => {
      const deal = deals.find((d) => d.id === dealId);
      if (deal) {
        setSelectedDeal(deal as unknown as Deal);
        setDrawerOpen(true);
      }
    },
    [deals]
  );

  const sortedStages = useMemo(
    () => [...stages].sort((a, b) => a.sort_order - b.sort_order),
    [stages]
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
          {sortedStages.map((stage, i) => (
            <div
              key={stage.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <StageColumn
                stage={stage}
                deals={columns[stage.id] ?? []}
                onDealClick={handleDealClick}
              />
            </div>
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDeal ? (
            <div className="w-[280px] rotate-[2deg] scale-105">
              <DealCard deal={activeDeal} isDragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <DealDrawer
        deal={selectedDeal}
        stages={sortedStages}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onUpdated={() => router.refresh()}
      />
    </>
  );
}
