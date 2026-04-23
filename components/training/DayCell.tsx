"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { ScheduleBlock } from "./ScheduleBlock";
import type { clientSchedule } from "@/db/schema";

type Block = typeof clientSchedule.$inferSelect;

export function DayCell({
  dropId,
  blocks,
  role,
  weekStartISO,
  day,
  disabled,
  onDelete,
  onToggleLock,
  onToggleComplete,
}: {
  dropId: string;
  blocks: Block[];
  role: "coach" | "client";
  weekStartISO: string;
  day: number;
  disabled?: boolean;
  onDelete?: (id: string) => void;
  onToggleLock?: (id: string) => void;
  onToggleComplete?: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: dropId,
    data: { kind: "day-cell", weekStartISO, day },
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col gap-1 rounded-sm border p-1.5 min-h-[92px] transition-colors",
        isOver ? "border-copper bg-copper-subtle" : "border-line bg-bg-card",
        disabled ? "opacity-60" : "",
      )}
    >
      {blocks.map((b) => (
        <ScheduleBlock
          key={b.id}
          block={b}
          role={role}
          onDelete={onDelete}
          onToggleLock={onToggleLock}
          onToggleComplete={onToggleComplete}
        />
      ))}
      {blocks.length === 0 && !disabled ? (
        <div className="text-[10px] uppercase tracking-eyebrow text-bone-faint/60 text-center py-2">
          Drop here
        </div>
      ) : null}
    </div>
  );
}
