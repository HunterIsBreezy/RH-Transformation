"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eyebrow, Display, Body } from "@/components/type";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  createPrescriptionTemplate,
  updatePrescriptionTemplate,
  deletePrescriptionTemplate,
} from "./actions";
import type { prescriptionTemplates, resources } from "@/db/schema";

type Template = typeof prescriptionTemplates.$inferSelect;
type Resource = typeof resources.$inferSelect;

const PILLARS = ["body", "mind", "systems"];

export function PrescriptionsPanel({
  initial,
  resources: allResources,
}: {
  initial: Template[];
  resources: Resource[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Template | null>(null);
  const [creating, setCreating] = useState(false);
  const [, startTransition] = useTransition();

  if (creating || editing) {
    return (
      <TemplateForm
        initial={editing}
        allResources={allResources}
        onDone={() => {
          setCreating(false);
          setEditing(null);
          router.refresh();
        }}
      />
    );
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-start justify-between mb-10">
        <div>
          <Eyebrow wide className="text-copper">Coach · Prescriptions</Eyebrow>
          <Display as="h1" size="md" tight className="mt-6">
            Templates you reach for again and again.
          </Display>
        </div>
        <Button onClick={() => setCreating(true)}>+ New template</Button>
      </div>

      {initial.length === 0 ? (
        <Body muted tight>No templates yet. Create one and it&apos;ll be one-click to apply on any client&apos;s board.</Body>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {initial.map((t) => (
            <Card key={t.id}>
              <CardContent className="pt-6 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] uppercase tracking-eyebrow text-bone-faint">{t.pillar}</span>
                  <span className="text-[10px] uppercase tracking-eyebrow text-bone-faint">{t.resourceIds.length} resources</span>
                </div>
                <div className="text-base font-semibold text-paper tracking-display leading-tight">{t.title}</div>
                <Body size="sm" muted tight className="line-clamp-3 whitespace-pre-wrap">{t.body}</Body>
                <div className="pt-2 flex items-center gap-3">
                  <button onClick={() => setEditing(t)} className="text-[11px] uppercase tracking-eyebrow text-copper hover:text-paper">
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${t.title}"?`)) {
                        startTransition(async () => {
                          await deletePrescriptionTemplate(t.id);
                          router.refresh();
                        });
                      }
                    }}
                    className="text-[11px] uppercase tracking-eyebrow text-bone-faint hover:text-[#b33a3a]"
                  >
                    Delete
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateForm({
  initial,
  allResources,
  onDone,
}: {
  initial: Template | null;
  allResources: Resource[];
  onDone: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [pillar, setPillar] = useState(initial?.pillar ?? "body");
  const [body, setBody] = useState(initial?.body ?? "");
  const [tagsStr, setTagsStr] = useState((initial?.tags ?? []).join(", "));
  const [resourceIds, setResourceIds] = useState<string[]>(initial?.resourceIds ?? []);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleResource(id: string) {
    setResourceIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!title.trim()) return setErr("Title is required.");
    const tags = tagsStr.split(",").map((t) => t.trim()).filter(Boolean);
    startTransition(async () => {
      try {
        if (initial) {
          await updatePrescriptionTemplate(initial.id, { title, pillar, body, resourceIds, tags });
        } else {
          await createPrescriptionTemplate({ title, pillar, body, resourceIds, tags });
        }
        onDone();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "save failed");
      }
    });
  }

  return (
    <form onSubmit={submit} className="max-w-3xl flex flex-col gap-6">
      <div>
        <div className="text-[11px] uppercase tracking-eyebrow text-bone-faint mb-2">
          {initial ? "Edit template" : "New template"}
        </div>
        <h2 className="text-2xl font-semibold tracking-display-tight text-paper">
          {initial ? initial.title : "Shape the prescription."}
        </h2>
      </div>

      <Field label="Title">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </Field>

      <Field label="Pillar">
        <select
          value={pillar}
          onChange={(e) => setPillar(e.target.value)}
          className="h-11 rounded-sm border border-line-strong bg-bg-soft px-3 text-sm text-paper tracking-body"
        >
          {PILLARS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </Field>

      <Field label="Prescription body">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          placeholder="The steps. The frame. The why."
          className="w-full rounded-sm border border-line-strong bg-bg-soft p-3 text-sm text-paper tracking-body"
        />
      </Field>

      <Field label="Tags (comma-separated)">
        <Input value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} placeholder="morning, identity" />
      </Field>

      <Field label="Attached resources">
        {allResources.length === 0 ? (
          <Body size="sm" muted tight>Add resources on the Resources page, then come back.</Body>
        ) : (
          <div className="flex flex-wrap gap-2">
            {allResources.map((r) => {
              const on = resourceIds.includes(r.id);
              return (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => toggleResource(r.id)}
                  className={`text-[11px] uppercase tracking-eyebrow px-2 py-1 rounded-sm border transition-colors ${
                    on
                      ? "border-copper bg-copper-subtle text-paper"
                      : "border-line text-bone hover:border-line-hover hover:text-paper"
                  }`}
                >
                  {r.title}
                </button>
              );
            })}
          </div>
        )}
      </Field>

      {err ? <div className="text-sm text-[#b33a3a] tracking-body">{err}</div> : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : initial ? "Save" : "Create template"}
        </Button>
        <button type="button" onClick={onDone} className="text-[11px] uppercase tracking-eyebrow text-bone hover:text-paper">
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-[11px] uppercase tracking-eyebrow text-bone-faint">{label}</div>
      {children}
    </div>
  );
}
