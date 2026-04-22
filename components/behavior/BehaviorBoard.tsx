"use client";

import { useMemo, useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  applyTemplateToEntry,
  createBehaviorEntry,
  deleteBehaviorEntry,
  updateBehaviorEntry,
} from "./actions";
import { ResourceChip } from "./ResourceChip";
import { ResourcePicker } from "./ResourcePicker";
import type {
  behaviorEntries,
  prescriptionTemplates,
  resources,
} from "@/db/schema";

type Entry = typeof behaviorEntries.$inferSelect;
type Resource = typeof resources.$inferSelect;
type Template = typeof prescriptionTemplates.$inferSelect;

const PILLARS = ["body", "mind", "systems"];
const STATUSES: Entry["status"][] = [
  "current",
  "desired",
  "prescribed",
  "inflight",
  "completed",
  "dropped",
];

export function BehaviorBoard({
  clientId,
  entries,
  resources: attachedResources,
  libraryResources,
  templates,
  canEdit,
}: {
  clientId: string;
  entries: Entry[];
  resources: Resource[];
  libraryResources: Resource[];
  templates: Template[];
  canEdit: boolean;
}) {
  const resourceById = useMemo(() => {
    const map = new Map<string, Resource>();
    for (const r of attachedResources) map.set(r.id, r);
    for (const r of libraryResources) if (!map.has(r.id)) map.set(r.id, r);
    return map;
  }, [attachedResources, libraryResources]);

  return (
    <div className="flex flex-col gap-3">
      <div className="hidden md:grid grid-cols-12 gap-4 text-[10px] uppercase tracking-eyebrow text-bone-faint px-3">
        <div className="col-span-3">Current</div>
        <div className="col-span-3">Desired</div>
        <div className="col-span-4">Prescription</div>
        <div className="col-span-2">Progress</div>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-sm border border-line bg-bg-card px-6 py-10 text-center text-sm text-bone tracking-body">
          No behaviors on the board yet. {canEdit ? "Add the first one below." : "Your coaches will add some soon."}
        </div>
      ) : (
        entries.map((e) => (
          <BehaviorRow
            key={e.id}
            entry={e}
            resourceById={resourceById}
            libraryResources={libraryResources}
            templates={templates}
            canEdit={canEdit}
          />
        ))
      )}

      {canEdit ? <NewBehaviorForm clientId={clientId} /> : null}
    </div>
  );
}

function BehaviorRow({
  entry,
  resourceById,
  libraryResources,
  templates,
  canEdit,
}: {
  entry: Entry;
  resourceById: Map<string, Resource>;
  libraryResources: Resource[];
  templates: Template[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [showPicker, setShowPicker] = useState(false);
  const [, startTransition] = useTransition();

  function patch(update: Parameters<typeof updateBehaviorEntry>[1]) {
    startTransition(async () => {
      await updateBehaviorEntry(entry.id, update);
      router.refresh();
    });
  }

  const chips = (entry.resourceIds ?? [])
    .map((id) => resourceById.get(id))
    .filter(Boolean) as Resource[];

  return (
    <div className="rounded-sm border border-line bg-bg-card p-3 md:p-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <Cell label="Current" spanClass="md:col-span-3">
          <EditableText
            value={entry.current ?? ""}
            disabled={!canEdit}
            onSave={(v) => patch({ current: v })}
            placeholder="What's the current pattern?"
            rows={3}
          />
          <PillSelect
            value={entry.pillar}
            disabled={!canEdit}
            options={PILLARS}
            onChange={(v) => patch({ pillar: v })}
          />
        </Cell>

        <Cell label="Desired" spanClass="md:col-span-3">
          <EditableText
            value={entry.desired ?? ""}
            disabled={!canEdit}
            onSave={(v) => patch({ desired: v })}
            placeholder="What are we replacing it with?"
            rows={3}
          />
        </Cell>

        <Cell label="Prescription" spanClass="md:col-span-4">
          <EditableText
            value={entry.prescription ?? ""}
            disabled={!canEdit}
            onSave={(v) => patch({ prescription: v })}
            placeholder="The exact steps."
            rows={3}
          />

          <div className="flex flex-wrap gap-1.5">
            {chips.map((r) => (
              <ResourceChip
                key={r.id}
                resource={r}
                onRemove={
                  canEdit
                    ? () =>
                        patch({
                          resourceIds: (entry.resourceIds ?? []).filter((x) => x !== r.id),
                        })
                    : undefined
                }
              />
            ))}
            {canEdit ? (
              <button
                type="button"
                onClick={() => setShowPicker((v) => !v)}
                className="text-[11px] uppercase tracking-eyebrow px-2 py-1 rounded-sm border border-dashed border-line text-bone hover:border-copper hover:text-copper"
              >
                + Resource
              </button>
            ) : null}
          </div>

          {showPicker ? (
            <ResourcePicker
              library={libraryResources}
              selectedIds={entry.resourceIds ?? []}
              behavior={entry.pillar}
              onSelect={(id) =>
                patch({ resourceIds: [...(entry.resourceIds ?? []), id] })
              }
              onClose={() => setShowPicker(false)}
            />
          ) : null}

          {canEdit && templates.length > 0 ? (
            <TemplateMenu
              templates={templates}
              onApply={(templateId) => {
                startTransition(async () => {
                  await applyTemplateToEntry(entry.id, templateId);
                  router.refresh();
                });
              }}
            />
          ) : null}
        </Cell>

        <Cell label="Progress" spanClass="md:col-span-2">
          <StatusSelect
            value={entry.status}
            disabled={!canEdit}
            onChange={(v) => patch({ status: v })}
          />
          <ProgressSlider
            value={entry.progressPct}
            disabled={!canEdit}
            onChange={(n) => patch({ progressPct: n })}
          />
          {canEdit ? (
            <button
              onClick={() => {
                if (confirm("Delete this behavior entry?")) {
                  startTransition(async () => {
                    await deleteBehaviorEntry(entry.id);
                    router.refresh();
                  });
                }
              }}
              className="text-[10px] uppercase tracking-eyebrow text-bone-faint hover:text-[#b33a3a]"
            >
              Delete row
            </button>
          ) : null}
        </Cell>
      </div>
    </div>
  );
}

function Cell({
  label,
  spanClass,
  children,
}: {
  label: string;
  spanClass: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-3", spanClass)}>
      <div className="md:hidden text-[10px] uppercase tracking-eyebrow text-bone-faint">
        {label}
      </div>
      {children}
    </div>
  );
}

function EditableText({
  value,
  onSave,
  placeholder,
  rows = 2,
  disabled,
}: {
  value: string;
  onSave: (v: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}) {
  const [v, setV] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scheduleSave(next: string) {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (next !== value) onSave(next);
    }, 700);
  }

  return (
    <textarea
      disabled={disabled}
      value={v}
      onChange={(e) => { setV(e.target.value); scheduleSave(e.target.value); }}
      onBlur={() => { if (v !== value) onSave(v); }}
      rows={rows}
      placeholder={placeholder}
      className={cn(
        "w-full rounded-sm border border-line bg-bg-soft p-2 text-sm text-paper tracking-body placeholder:text-bone-faint focus:outline-none focus:border-copper",
        disabled ? "opacity-70 cursor-not-allowed" : "",
      )}
    />
  );
}

function PillSelect({
  value,
  options,
  onChange,
  disabled,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <select
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 rounded-sm border border-line bg-bg-soft px-2 text-[11px] uppercase tracking-eyebrow text-bone disabled:opacity-60"
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function StatusSelect({
  value,
  onChange,
  disabled,
}: {
  value: Entry["status"];
  onChange: (v: Entry["status"]) => void;
  disabled?: boolean;
}) {
  return (
    <select
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value as Entry["status"])}
      className="h-8 rounded-sm border border-line bg-bg-soft px-2 text-[11px] uppercase tracking-eyebrow text-paper disabled:opacity-60"
    >
      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  );
}

function ProgressSlider({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  const [local, setLocal] = useState(value);
  return (
    <div className="flex flex-col gap-1">
      <input
        type="range"
        min={0}
        max={100}
        value={local}
        disabled={disabled}
        onChange={(e) => setLocal(Number(e.target.value))}
        onPointerUp={() => { if (local !== value) onChange(local); }}
        onKeyUp={() => { if (local !== value) onChange(local); }}
        className="accent-copper"
      />
      <div className="text-[11px] uppercase tracking-eyebrow text-bone-faint">
        {local}%
      </div>
    </div>
  );
}

function NewBehaviorForm({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [pillar, setPillar] = useState("body");
  const [current, setCurrent] = useState("");
  const [desired, setDesired] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!current.trim() || !desired.trim()) return;
    startTransition(async () => {
      await createBehaviorEntry(clientId, { pillar, current, desired });
      setCurrent("");
      setDesired("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="rounded-sm border border-dashed border-line bg-bg-soft p-4 flex flex-col md:flex-row gap-3 items-start">
      <select
        value={pillar}
        onChange={(e) => setPillar(e.target.value)}
        className="h-10 rounded-sm border border-line bg-bg-card px-2 text-[11px] uppercase tracking-eyebrow text-bone"
      >
        {PILLARS.map((p) => <option key={p}>{p}</option>)}
      </select>
      <input
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        placeholder="Current pattern…"
        className="flex-1 h-10 rounded-sm border border-line bg-bg-card px-3 text-sm text-paper tracking-body"
      />
      <input
        value={desired}
        onChange={(e) => setDesired(e.target.value)}
        placeholder="Desired replacement…"
        className="flex-1 h-10 rounded-sm border border-line bg-bg-card px-3 text-sm text-paper tracking-body"
      />
      <button
        type="submit"
        disabled={pending}
        className="h-10 px-4 rounded-sm bg-copper text-paper text-[11px] uppercase tracking-eyebrow disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add behavior"}
      </button>
    </form>
  );
}

function TemplateMenu({
  templates,
  onApply,
}: {
  templates: Template[];
  onApply: (templateId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="self-start text-[11px] uppercase tracking-eyebrow text-bone-faint hover:text-copper"
      >
        Apply template →
      </button>
    );
  }
  return (
    <div className="rounded-sm border border-line-strong bg-bg-elevated p-2 flex flex-col max-w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] uppercase tracking-eyebrow text-bone-faint">Apply a template</div>
        <button onClick={() => setOpen(false)} className="text-bone-faint hover:text-paper text-xs">×</button>
      </div>
      <div className="flex flex-col max-h-[220px] overflow-auto">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => { onApply(t.id); setOpen(false); }}
            className="text-left px-2 py-1.5 rounded-sm hover:bg-bg-card"
          >
            <div className="text-[10px] uppercase tracking-eyebrow text-bone-faint">{t.pillar}</div>
            <div className="text-sm text-paper tracking-body">{t.title}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
