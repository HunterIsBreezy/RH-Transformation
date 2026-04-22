"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createResource, updateResource, uploadResourceBlob } from "./actions";
import { KINDS } from "./ResourcesPanel";
import type { resources } from "@/db/schema";

type Resource = typeof resources.$inferSelect;

export function ResourceForm({
  initial,
  onDone,
  defaultInLibrary = true,
  prefilledBehavior,
}: {
  initial?: Resource | null;
  onDone: () => void;
  defaultInLibrary?: boolean;
  prefilledBehavior?: string;
}) {
  const router = useRouter();
  const [kind, setKind] = useState(initial?.kind ?? "article");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [author, setAuthor] = useState(initial?.author ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [bodyMd, setBodyMd] = useState(initial?.bodyMd ?? "");
  const [tagsStr, setTagsStr] = useState(
    (initial?.behaviorsTargeted ?? (prefilledBehavior ? [prefilledBehavior] : [])).join(", "),
  );
  const [inLibrary, setInLibrary] = useState<boolean>(initial?.inLibrary ?? defaultInLibrary);
  const [err, setErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
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
      const { url: blobUrl } = await uploadResourceBlob(fd);
      setUrl(blobUrl);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "upload failed");
    } finally {
      setUploading(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!title.trim()) {
      setErr("Title is required.");
      return;
    }
    const tags = tagsStr
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    startTransition(async () => {
      try {
        if (initial) {
          await updateResource(initial.id, {
            kind,
            title,
            author,
            url,
            bodyMd,
            behaviorsTargeted: tags,
            inLibrary,
          });
        } else {
          await createResource({
            kind,
            title,
            author,
            url,
            bodyMd,
            behaviorsTargeted: tags,
            inLibrary,
          });
        }
        onDone();
        router.refresh();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "save failed");
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <div>
        <div className="text-[11px] uppercase tracking-eyebrow text-bone-faint mb-2">
          {initial ? "Edit resource" : "New resource"}
        </div>
        <h2 className="text-2xl font-semibold tracking-display-tight text-paper">
          {initial ? initial.title : "What are we adding?"}
        </h2>
      </div>

      <Field label="Type">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="h-11 rounded-sm border border-line-strong bg-bg-soft px-3 text-sm text-paper tracking-body"
        >
          {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </Field>

      <Field label="Title">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </Field>

      <Field label="Author (optional)">
        <Input value={author ?? ""} onChange={(e) => setAuthor(e.target.value)} />
      </Field>

      <Field label="URL (YouTube, article, PDF — anything)">
        <Input value={url ?? ""} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
      </Field>

      <Field label="Or upload a file (Vercel Blob)">
        <div className="flex items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            onChange={onFilePick}
            className="block text-xs text-bone"
          />
          {uploading ? <span className="text-[11px] uppercase tracking-eyebrow text-copper">Uploading…</span> : null}
        </div>
      </Field>

      <Field label="Behavior tags (comma-separated)">
        <Input
          value={tagsStr}
          onChange={(e) => setTagsStr(e.target.value)}
          placeholder="morning-routine, sleep, identity"
        />
      </Field>

      <Field label="Coach notes (optional)">
        <textarea
          value={bodyMd ?? ""}
          onChange={(e) => setBodyMd(e.target.value)}
          rows={4}
          className="w-full rounded-sm border border-line-strong bg-bg-soft p-3 text-sm text-paper tracking-body"
        />
      </Field>

      <label className="inline-flex items-center gap-2 text-sm text-paper tracking-body">
        <input type="checkbox" checked={inLibrary} onChange={(e) => setInLibrary(e.target.checked)} className="h-4 w-4 accent-copper" />
        Save to library (available for future clients)
      </label>

      {err ? (
        <div className="text-sm text-[#b33a3a] tracking-body">{err}</div>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending || uploading}>
          {pending ? "Saving…" : initial ? "Save" : "Create resource"}
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
