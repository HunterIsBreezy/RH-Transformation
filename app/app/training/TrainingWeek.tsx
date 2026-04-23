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
import { DayCell } from "@/components/training/DayCell";
import { Eyebrow, Display, Body } from "@/components/type";
import { moveScheduleBlock, toggleBlockComplete } from "./actions";
import { DAY_LABELS, addWeeks, currentWeekStart, isPastWeek, weekLabel } from "@/lib/week";
import type { clientSchedule } from "@/db/schema";

type Block = typeof clientSchedule.$inferSelect;

export function TrainingWeek({
  clientId,
  weekStartISO,
  blocks,
  allowNavigate,
}: {
  clientId: string;
  weekStartISO: string;
  blocks: Block[];
  allowNavigate: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const [viewWeek, setViewWeek] = useState(weekStartISO);

  const weekStart = new Date(viewWeek);
  const readOnly = isPastWeek(weekStart);
  const isCurrent = viewWeek === currentWeekStart().toISOString().slice(0, 10);

  const byDay = useMemo(() => {
    const map = new Map<number, Block[]>();
    for (const b of blocks) {
      if (new Date(b.weekStart).toISOString().slice(0, 10) !== viewWeek) continue;
      const arr = map.get(b.day) ?? [];
      arr.push(b);
      map.set(b.day, arr);
    }
    return map;
  }, [blocks, viewWeek]);

  function handleDragEnd(event: DragEndEvent) {
    const overData = event.over?.data.current;
    const activeData = event.active.data.current;
    if (!overData || !activeData) return;
    if (overData.kind !== "day-cell" || activeData.kind !== "block") return;

    // Same week constraint is implicit — client only sees one week at a time.
    const toDay = overData.day as number;
    startTransition(async () => {
      try {
        await moveScheduleBlock({ blockId: activeData.blockId, toDay });
        router.refresh();
      } catch (e) {
        console.error("[training] move failed:", e);
      }
    });
  }

  function shiftWeek(delta: number) {
    const next = addWeeks(weekStart, delta);
    setViewWeek(next.toISOString().slice(0, 10));
  }

  const weekBlocks = blocks.filter((b) => new Date(b.weekStart).toISOString().slice(0, 10) === viewWeek);
  const total = weekBlocks.length;
  const done = weekBlocks.filter((b) => b.completedAt).length;

  return (
    <div className="max-w-6xl">
      <Eyebrow wide className="text-copper">Training</Eyebrow>
      <Display as="h1" size="md" tight className="mt-6 mb-6">
        {isCurrent ? "This week, block by block." : weekLabel(weekStart)}
      </Display>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftWeek(-1)}
            disabled={!allowNavigate}
            className="text-[11px] uppercase tracking-eyebrow text-bone hover:text-copper disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-[11px] uppercase tracking-eyebrow text-bone-faint">
            {weekLabel(weekStart)}
          </span>
          <button
            onClick={() => shiftWeek(1)}
            disabled={!allowNavigate}
            className="text-[11px] uppercase tracking-eyebrow text-bone hover:text-copper disabled:opacity-40"
          >
            Next →
          </button>
          {!isCurrent ? (
            <button
              onClick={() => setViewWeek(currentWeekStart().toISOString().slice(0, 10))}
              className="text-[11px] uppercase tracking-eyebrow text-copper hover:text-paper ml-2"
            >
              Back to this week
            </button>
          ) : null}
        </div>
        <div className="text-[11px] uppercase tracking-eyebrow text-bone-faint">
          {done}/{total} done {readOnly ? "· locked (past week)" : ""}
        </div>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {DAY_LABELS.map((label, d) => (
            <div key={d} className="flex flex-col gap-1">
              <div className="text-[10px] uppercase tracking-eyebrow text-bone-faint text-center">
                {label}
              </div>
              <DayCell
                dropId={`client-day-${d}`}
                role="client"
                weekStartISO={viewWeek}
                day={d}
                blocks={byDay.get(d) ?? []}
                disabled={readOnly}
                onToggleComplete={(id) => startTransition(async () => {
                  await toggleBlockComplete(id);
                  router.refresh();
                })}
              />
            </div>
          ))}
        </div>
      </DndContext>

      {weekBlocks.length === 0 ? (
        <div className="mt-8">
          <Body size="sm" muted tight>Your coaches haven&apos;t built this week yet.</Body>
        </div>
      ) : null}
    </div>
  );
}
