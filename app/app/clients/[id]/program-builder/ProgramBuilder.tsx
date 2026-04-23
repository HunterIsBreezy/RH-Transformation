"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Eyebrow, Display, Body } from "@/components/type";
import { DayCell } from "@/components/training/DayCell";
import { ExerciseCatalog } from "./ExerciseCatalog";
import {
  deleteScheduleBlock,
  moveScheduleBlock,
  scheduleExerciseDrop,
  toggleBlockComplete,
  toggleBlockLocked,
} from "@/app/app/training/actions";
import { DAY_LABELS, addWeeks, weekLabel } from "@/lib/week";
import type { clientSchedule, exercises } from "@/db/schema";

type Block = typeof clientSchedule.$inferSelect;
type Exercise = typeof exercises.$inferSelect;

export function ProgramBuilder({
  clientId,
  clientName,
  firstWeekStart,
  weeks,
  blocks,
  library,
}: {
  clientId: string;
  clientName: string;
  firstWeekStart: string; // ISO date
  weeks: number;
  blocks: Block[];
  library: Exercise[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const weekStarts = useMemo(() => {
    const base = new Date(firstWeekStart);
    return Array.from({ length: weeks }, (_, i) => addWeeks(base, i));
  }, [firstWeekStart, weeks]);

  const byCell = useMemo(() => {
    const map = new Map<string, Block[]>();
    for (const b of blocks) {
      const key = `${new Date(b.weekStart).toISOString().slice(0, 10)}:${b.day}`;
      const arr = map.get(key) ?? [];
      arr.push(b);
      map.set(key, arr);
    }
    return map;
  }, [blocks]);

  function handleDragEnd(event: DragEndEvent) {
    const overData = event.over?.data.current;
    const activeData = event.active.data.current;
    if (!overData || !activeData) return;
    if (overData.kind !== "day-cell") return;

    const toDay = overData.day as number;
    const toWeek = overData.weekStartISO as string;

    if (activeData.kind === "catalog-exercise") {
      startTransition(async () => {
        await scheduleExerciseDrop({
          clientId,
          exerciseId: activeData.exerciseId,
          weekStart: toWeek,
          day: toDay,
        });
        router.refresh();
      });
    } else if (activeData.kind === "block") {
      startTransition(async () => {
        await moveScheduleBlock({ blockId: activeData.blockId, toDay });
        router.refresh();
      });
    }
  }

  const handlers = {
    onDelete: (id: string) => startTransition(async () => {
      if (!confirm("Delete this block?")) return;
      await deleteScheduleBlock(id);
      router.refresh();
    }),
    onToggleLock: (id: string) => startTransition(async () => {
      await toggleBlockLocked(id);
      router.refresh();
    }),
    onToggleComplete: (id: string) => startTransition(async () => {
      await toggleBlockComplete(id);
      router.refresh();
    }),
  };

  return (
    <div className="max-w-[1600px]">
      <Eyebrow wide className="text-copper">Coach · Program builder</Eyebrow>
      <Display as="h1" size="md" tight className="mt-6 mb-2">
        {clientName}
      </Display>
      <Body size="sm" muted tight className="mb-8">
        Drag an exercise from the left onto any day. Every drop is a snapshot — editing the
        library later won&apos;t change what this client already sees.
      </Body>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="lg:sticky lg:top-6 lg:self-start">
            <ExerciseCatalog library={library} clientId={clientId} />
          </div>

          <div className="overflow-auto">
            <div className="grid grid-cols-[60px_repeat(7,minmax(140px,1fr))] gap-2 min-w-[1000px]">
              <div />
              {DAY_LABELS.map((d) => (
                <div key={d} className="text-[10px] uppercase tracking-eyebrow text-bone-faint text-center pb-1">{d}</div>
              ))}

              {weekStarts.map((ws, wi) => {
                const iso = ws.toISOString().slice(0, 10);
                return (
                  <div key={iso} className="contents">
                    <div className="text-[10px] uppercase tracking-eyebrow text-bone-faint flex flex-col items-end justify-start pt-1 pr-2">
                      <span className="text-paper text-xs font-semibold leading-none">W{wi + 1}</span>
                      <span className="text-[10px] leading-none mt-1">{weekLabel(ws).split(" – ")[0]}</span>
                    </div>
                    {Array.from({ length: 7 }).map((_, d) => {
                      const key = `${iso}:${d}`;
                      const cellBlocks = byCell.get(key) ?? [];
                      return (
                        <DayCell
                          key={key}
                          dropId={`drop-${iso}-${d}`}
                          role="coach"
                          weekStartISO={iso}
                          day={d}
                          blocks={cellBlocks}
                          {...handlers}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DndContext>
    </div>
  );
}
