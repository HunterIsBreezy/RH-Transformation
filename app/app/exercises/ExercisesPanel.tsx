"use client";

import { useMemo, useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Eyebrow, Display, Body } from "@/components/type";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  createExercise,
  deleteExercise,
  updateExercise,
  uploadExerciseBlob,
} from "./actions";
import type { exercises } from "@/db/schema";

type Exercise = typeof exercises.$inferSelect;
const CATEGORIES = ["strength", "hypertrophy", "conditioning", "mobility", "skill", "warmup", "cooldown"];

export function ExercisesPanel({ initial }: { initial: Exercise[] }) {
  const router = useRouter();
  const [items] = useState(initial);
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [creating, setCreating] = useState(false);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((e) => {
      const qOk = needle
        ? e.name.toLowerCase().includes(needle) || e.tags.some((t) => t.toLowerCase().includes(needle))
        : true;
      const cOk = catFilter ? e.category === catFilter : true;
      return qOk && cOk;
    });
  }, [items, q, catFilter]);

  if (creating || editing) {
    return (
      <ExerciseForm
        initial={editing}
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
          <Eyebrow wide className="text-copper">Coach · Exercises</Eyebrow>
          <Display as="h1" size="md" tight className="mt-6">
            The movement library, curated.
          </Display>
        </div>
        <Button onClick={() => setCreating(true)}>+ New exercise</Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <Input placeholder="Search name or tag…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="h-11 rounded-sm border border-line-strong bg-bg-soft px-3 text-sm text-paper tracking-body"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <Body muted tight>Empty library. Click <span className="text-copper">+ New exercise</span> to seed it.</Body>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((e) => (
            <Card key={e.id}>
              <CardContent className="pt-6 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] uppercase tracking-eyebrow text-bone-faint">{e.category}</span>
                  {!e.inLibrary ? <span className="text-[10px] uppercase tracking-eyebrow text-bone-faint">inline</span> : null}
                </div>
                <div className="text-base font-semibold text-paper tracking-display leading-tight">{e.name}</div>
                <div className="text-xs text-bone tracking-body">
                  {e.defaultSets ? `${e.defaultSets} × ` : ""}
                  {e.defaultReps ?? ""}
                  {e.defaultDurationMin ? `${e.defaultSets || e.defaultReps ? " · " : ""}${e.defaultDurationMin}m` : ""}
                </div>
                {e.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {e.tags.map((t) => (
                      <span key={t} className="text-[10px] uppercase tracking-eyebrow text-bone border border-line px-1.5 py-0.5 rounded-sm">{t}</span>
                    ))}
                  </div>
                ) : null}
                <div className="pt-2 flex items-center gap-3">
                  <button onClick={() => setEditing(e)} className="text-[11px] uppercase tracking-eyebrow text-copper hover:text-paper">
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${e.name}"?`)) {
                        startTransition(async () => {
                          await deleteExercise(e.id);
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

export function ExerciseForm({
  initial,
  onDone,
  defaultInLibrary = true,
}: {
  initial: Exercise | null;
  onDone: () => void;
  defaultInLibrary?: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "strength");
  const [sets, setSets] = useState(initial?.defaultSets?.toString() ?? "");
  const [reps, setReps] = useState(initial?.defaultReps ?? "");
  const [duration, setDuration] = useState(initial?.defaultDurationMin?.toString() ?? "");
  const [mediaUrl, setMediaUrl] = useState(initial?.demoUrl ?? "");
  const [cues, setCues] = useState(initial?.cues ?? "");
  const [coachNotes, setCoachNotes] = useState(initial?.coachNotes ?? "");
  const [tagsStr, setTagsStr] = useState((initial?.tags ?? []).join(", "));
  const [inLibrary, setInLibrary] = useState(initial?.inLibrary ?? defaultInLibrary);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { url } = await uploadExerciseBlob(fd);
      setMediaUrl(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "upload failed");
    } finally {
      setUploading(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!name.trim()) return setErr("Name is required.");
    const tags = tagsStr.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
    startTransition(async () => {
      try {
        if (initial) {
          await updateExercise(initial.id, {
            name,
            category,
            defaultSets: sets ? Number(sets) : null,
            defaultReps: reps || null,
            defaultDurationMin: duration ? Number(duration) : null,
            demoUrl: mediaUrl || null,
            cues: cues || null,
            coachNotes: coachNotes || null,
            tags,
            inLibrary,
          });
        } else {
          await createExercise({
            name,
            category,
            defaultSets: sets ? Number(sets) : null,
            defaultReps: reps || null,
            defaultDurationMin: duration ? Number(duration) : null,
            demoUrl: mediaUrl || null,
            cues: cues || null,
            coachNotes: coachNotes || null,
            tags,
            inLibrary,
          });
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
          {initial ? "Edit exercise" : "New exercise"}
        </div>
        <h2 className="text-2xl font-semibold tracking-display-tight text-paper">
          {initial?.name ?? "The move."}
        </h2>
      </div>

      <Field label="Name">
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>

      <Field label="Category">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-11 rounded-sm border border-line-strong bg-bg-soft px-3 text-sm text-paper tracking-body"
        >
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Default sets">
          <Input type="number" min={0} value={sets} onChange={(e) => setSets(e.target.value)} />
        </Field>
        <Field label="Default reps / load">
          <Input value={reps} onChange={(e) => setReps(e.target.value)} placeholder="e.g. 8 @ RPE 8" />
        </Field>
        <Field label="Duration (min)">
          <Input type="number" min={0} value={duration} onChange={(e) => setDuration(e.target.value)} />
        </Field>
      </div>

      <Field label="Demo media URL (YouTube, Vimeo, MP4, etc.)">
        <Input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://…" />
      </Field>

      <Field label="Or upload media (Vercel Blob)">
        <div className="flex items-center gap-3">
          <input ref={fileRef} type="file" onChange={onFilePick} className="text-xs text-bone" />
          {uploading ? <span className="text-[11px] uppercase tracking-eyebrow text-copper">Uploading…</span> : null}
        </div>
      </Field>

      <Field label="Cues (what to nail)">
        <textarea
          value={cues}
          onChange={(e) => setCues(e.target.value)}
          rows={3}
          className="w-full rounded-sm border border-line-strong bg-bg-soft p-3 text-sm text-paper tracking-body"
        />
      </Field>

      <Field label="Coach notes (private)">
        <textarea
          value={coachNotes}
          onChange={(e) => setCoachNotes(e.target.value)}
          rows={3}
          className="w-full rounded-sm border border-line-strong bg-bg-soft p-3 text-sm text-paper tracking-body"
        />
      </Field>

      <Field label="Tags (comma-separated)">
        <Input value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} placeholder="lower-body, hinge, barbell" />
      </Field>

      <label className="inline-flex items-center gap-2 text-sm text-paper tracking-body">
        <input type="checkbox" checked={inLibrary} onChange={(e) => setInLibrary(e.target.checked)} className="h-4 w-4 accent-copper" />
        Save to library
      </label>

      {err ? <div className="text-sm text-[#b33a3a] tracking-body">{err}</div> : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending || uploading}>
          {pending ? "Saving…" : initial ? "Save" : "Create exercise"}
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
