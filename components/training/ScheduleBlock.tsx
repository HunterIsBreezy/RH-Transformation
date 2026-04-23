"use client";

import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { clientSchedule } from "@/db/schema";
import type { ScheduleDetail } from "@/app/app/training/actions";

type Block = typeof clientSchedule.$inferSelect;

export function ScheduleBlock({
  block,
  role,
  onDelete,
  onToggleLock,
  onToggleComplete,
}: {
  block: Block;
  role: "coach" | "client";
  onDelete?: (id: string) => void;
  onToggleLock?: (id: string) => void;
  onToggleComplete?: (id: string) => void;
}) {
  const locked = block.lockedByCoach;
  const canDrag = role === "coach" ? true : !locked;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `block-${block.id}`,
    data: { kind: "block", blockId: block.id, fromDay: block.day },
    disabled: !canDrag,
  });

  const detail = (block.detail ?? {}) as ScheduleDetail;
  const complete = !!block.completedAt;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "group relative rounded-sm border bg-bg-soft p-2 text-[11px] leading-snug select-none",
        complete
          ? "border-copper/60 bg-copper-subtle"
          : "border-line hover:border-line-hover",
        canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-default",
        isDragging ? "opacity-40" : "",
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <div className={cn("font-medium tracking-body truncate", complete ? "text-paper line-through" : "text-paper")}>
            {block.title}
          </div>
          <div className="text-bone-faint tracking-body">
            {[detail.sets ? `${detail.sets}×${detail.reps ?? ""}` : detail.reps, detail.durationMin ? `${detail.durationMin}m` : null]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>
        {locked ? (
          <span title="Locked by coach" className="text-bone-faint text-[10px] leading-none">🔒</span>
        ) : null}
      </div>
      <div className="mt-1 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {onToggleComplete ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleComplete(block.id); }}
            className="text-[10px] uppercase tracking-eyebrow text-copper hover:text-paper"
          >
            {complete ? "Undo" : "Done"}
          </button>
        ) : null}
        {role === "coach" && onToggleLock ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleLock(block.id); }}
            className="text-[10px] uppercase tracking-eyebrow text-bone hover:text-paper"
          >
            {locked ? "Unlock" : "Lock"}
          </button>
        ) : null}
        {role === "coach" && onDelete ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}
            className="text-[10px] uppercase tracking-eyebrow text-bone-faint hover:text-[#b33a3a] ml-auto"
          >
            ×
          </button>
        ) : null}
      </div>
    </div>
  );
}
