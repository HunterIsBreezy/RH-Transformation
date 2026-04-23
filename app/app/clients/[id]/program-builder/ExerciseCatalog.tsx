"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useDraggable } from "@dnd-kit/core";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ExerciseForm } from "@/app/app/exercises/ExercisesPanel";
import { cloneFromClient, listClientsForClone } from "@/app/app/training/actions";
import type { exercises } from "@/db/schema";

type Exercise = typeof exercises.$inferSelect;

export function ExerciseCatalog({
  library,
  clientId,
}: {
  library: Exercise[];
  clientId: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return library.filter((e) =>
      !needle ||
      e.name.toLowerCase().includes(needle) ||
      e.category.toLowerCase().includes(needle) ||
      e.tags.some((t) => t.toLowerCase().includes(needle)),
    );
  }, [library, q]);

  if (creating) {
    return (
      <div className="rounded-sm border border-line bg-bg-card p-4">
        <ExerciseForm
          initial={null}
          onDone={() => {
            setCreating(false);
            router.refresh();
          }}
        />
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-line bg-bg-card flex flex-col h-full">
      <div className="p-3 flex items-center gap-2 border-b border-line">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search exercises…"
          className="flex-1"
        />
        <Button size="sm" onClick={() => setCreating(true)}>+ New</Button>
      </div>
      <div className="p-2 flex flex-col gap-1 overflow-auto flex-1 max-h-[560px]">
        {filtered.length === 0 ? (
          <div className="p-3 text-xs text-bone-faint tracking-body">
            Nothing matches. Hit <span className="text-copper">+ New</span> to add one.
          </div>
        ) : (
          filtered.map((e) => <CatalogItem key={e.id} exercise={e} />)
        )}
      </div>
      <CloneFromClient clientId={clientId} />
    </div>
  );
}

function CatalogItem({ exercise }: { exercise: Exercise }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `catalog-${exercise.id}`,
    data: { kind: "catalog-exercise", exerciseId: exercise.id },
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`rounded-sm border border-line hover:border-line-hover bg-bg-soft px-2 py-1.5 cursor-grab active:cursor-grabbing select-none ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <div className="text-[10px] uppercase tracking-eyebrow text-bone-faint">{exercise.category}</div>
      <div className="text-sm text-paper tracking-body leading-tight">{exercise.name}</div>
      <div className="text-[11px] text-bone-faint tracking-body">
        {[exercise.defaultSets ? `${exercise.defaultSets}×${exercise.defaultReps ?? ""}` : exercise.defaultReps, exercise.defaultDurationMin ? `${exercise.defaultDurationMin}m` : null]
          .filter(Boolean)
          .join(" · ")}
      </div>
    </div>
  );
}

function CloneFromClient({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<{ id: string; name: string | null; email: string }[] | null>(null);
  const [pending, startTransition] = useTransition();

  async function load() {
    if (options) return;
    const rows = await listClientsForClone(clientId);
    setOptions(rows);
  }

  return (
    <div className="border-t border-line p-2">
      {!open ? (
        <button
          onClick={() => { setOpen(true); void load(); }}
          className="w-full text-[11px] uppercase tracking-eyebrow text-bone hover:text-copper py-1"
        >
          Clone from another client →
        </button>
      ) : (
        <div className="flex flex-col gap-1">
          <div className="text-[10px] uppercase tracking-eyebrow text-bone-faint px-1">Pick source</div>
          {!options ? (
            <div className="text-xs text-bone-faint px-1 py-2">Loading…</div>
          ) : options.length === 0 ? (
            <div className="text-xs text-bone-faint px-1 py-2">No other clients yet.</div>
          ) : (
            options.map((c) => (
              <button
                key={c.id}
                disabled={pending}
                onClick={() => {
                  if (!confirm(`Clone ${c.name ?? c.email}'s schedule onto this client? Existing future weeks will be replaced.`)) return;
                  startTransition(async () => {
                    await cloneFromClient({ sourceClientId: c.id, targetClientId: clientId });
                    setOpen(false);
                    router.refresh();
                  });
                }}
                className="text-left text-sm text-paper hover:bg-bg-soft rounded-sm px-2 py-1.5 tracking-body"
              >
                {c.name ?? c.email}
              </button>
            ))
          )}
          <button onClick={() => setOpen(false)} className="text-[10px] uppercase tracking-eyebrow text-bone-faint hover:text-paper py-1">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
