"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { logBlockActuals, type ScheduleDetail } from "@/app/app/training/actions";
import type { clientSchedule } from "@/db/schema";

type Block = typeof clientSchedule.$inferSelect;

export function LogActualsDialog({
  block,
  open,
  onClose,
}: {
  block: Block | null;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const detail = (block?.detail ?? {}) as ScheduleDetail;
  const actual = detail.actual ?? {};
  const [sets, setSets] = useState<string>("");
  const [reps, setReps] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [note, setNote] = useState<string>("");

  useEffect(() => {
    if (!block) return;
    setSets(actual.sets != null ? String(actual.sets) : detail.sets != null ? String(detail.sets) : "");
    setReps(actual.reps ?? detail.reps ?? "");
    setWeight(actual.weight ?? "");
    setNote(actual.note ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block?.id]);

  if (!block) return null;

  function submit() {
    if (!block) return;
    startTransition(async () => {
      await logBlockActuals({
        blockId: block.id,
        sets: sets ? Number(sets) : null,
        reps: reps || null,
        weight: weight || null,
        note: note || null,
      });
      onClose();
      router.refresh();
    });
  }

  function skip() {
    // Let the parent fall back to the plain toggleBlockComplete flow.
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log what you actually did</DialogTitle>
          <DialogDescription>
            {block.title} · prescribed{" "}
            {[
              detail.sets != null ? `${detail.sets}×${detail.reps ?? ""}` : detail.reps,
              detail.durationMin ? `${detail.durationMin}m` : null,
            ]
              .filter(Boolean)
              .join(" · ") || "freeform"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Sets">
            <Input
              type="number"
              min={0}
              value={sets}
              onChange={(e) => setSets(e.target.value)}
              placeholder={detail.sets != null ? String(detail.sets) : ""}
            />
          </Field>
          <Field label="Reps">
            <Input
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder={detail.reps ?? "8, 8, 6, 4…"}
            />
          </Field>
          <Field label="Weight / load">
            <Input
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="225 lb, BW, etc."
            />
          </Field>
          <Field label="Note">
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="How did it feel?"
            />
          </Field>
        </div>

        <DialogFooter>
          <div className="flex items-center gap-3 w-full">
            <Button type="button" onClick={submit} disabled={pending}>
              {pending ? "Saving…" : "Save & complete"}
            </Button>
            <button
              type="button"
              onClick={skip}
              className="text-[11px] uppercase tracking-eyebrow text-bone hover:text-paper"
            >
              Cancel
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[10px] uppercase tracking-eyebrow text-bone-faint">{label}</div>
      {children}
    </div>
  );
}
