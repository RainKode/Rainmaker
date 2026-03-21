"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PipelineKanban } from "@/components/crm/pipeline-kanban";
import { subscribeToDeals } from "@/lib/events/realtime";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { PipelineStage } from "@/types/crm";

type Props = {
  pipeline: Record<string, unknown>;
  stages: PipelineStage[];
  initialDeals: Record<string, unknown>[];
  orgId: string;
};

export function PipelineKanbanClient({
  pipeline,
  stages,
  initialDeals,
  orgId,
}: Props) {
  const router = useRouter();
  const [deals, setDeals] = useState(initialDeals);

  useEffect(() => {
    const unsub = subscribeToDeals(orgId, () => {
      router.refresh();
    });
    return unsub;
  }, [orgId, router]);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <Link
          href="/crm/pipelines"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors w-fit min-h-[44px]"
        >
          <ArrowLeft className="size-4" />
          Back to pipelines
        </Link>
        <h1 className="text-2xl font-bold tracking-tight mt-2">
          {String(pipeline.name)}
        </h1>
        {pipeline.description ? (
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {String(pipeline.description)}
          </p>
        ) : null}
      </div>

      {/* Kanban Board */}
      <PipelineKanban
        stages={stages}
        deals={deals}
        pipelineId={pipeline.id as string}
      />
    </div>
  );
}
