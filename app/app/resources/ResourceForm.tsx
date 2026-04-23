"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createResource, updateResource, uploadResourceBlob } from "./actions";
import { askClaudeForResource, saveClaudeAsFile, type AssistOutputT } from "./ai-actions";
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

      <ClaudeAssist
        kind={kind}
        title={title}
        author={author ?? ""}
        url={url ?? ""}
        bodyMd={bodyMd ?? ""}
        onApply={(out, uploadedUrl) => {
          console.log("[onApply] received", out, "uploadedUrl:", uploadedUrl);
          if (out.title) { console.log("[onApply] setTitle:", out.title); setTitle(out.title); }
          if (out.author) { console.log("[onApply] setAuthor:", out.author); setAuthor(out.author); }
          console.log("[onApply] setBodyMd len:", out.summary.length);
          setBodyMd(out.summary);
          const newTags = Array.from(new Set([
            ...tagsStr.split(",").map((t) => t.trim()).filter(Boolean),
            ...out.tags,
          ]));
          console.log("[onApply] setTagsStr:", newTags.join(", "));
          setTagsStr(newTags.join(", "));
          if (uploadedUrl && !url) { console.log("[onApply] setUrl:", uploadedUrl); setUrl(uploadedUrl); }
        }}
      />


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

function ClaudeAssist({
  kind,
  title,
  author,
  url,
  bodyMd,
  onApply,
}: {
  kind: string;
  title: string;
  author: string;
  url: string;
  bodyMd: string;
  onApply: (out: AssistOutputT, uploadedUrl?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<AssistOutputT | null>(null);
  const [saveAsFile, setSaveAsFile] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function ask() {
    if (!prompt.trim()) return;
    setErr(null);
    startTransition(async () => {
      try {
        const out = await askClaudeForResource({
          prompt,
          kind,
          title,
          author,
          url,
          existingNotes: bodyMd,
        });
        setResult(out);
        setSaveAsFile(out.suggestAsFile);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Claude failed");
      }
    });
  }

  async function apply() {
    if (!result) return;
    console.log("[apply] result:", result);
    console.log("[apply] saveAsFile:", saveAsFile);
    setErr(null);
    try {
      let uploadedUrl: string | undefined;
      if (saveAsFile) {
        console.log("[apply] uploading summary as file...");
        const { url: u } = await saveClaudeAsFile({
          title: result.title || title || "resource",
          markdown: result.summary,
        });
        uploadedUrl = u;
        console.log("[apply] uploaded:", uploadedUrl);
      }
      console.log("[apply] calling onApply");
      onApply(result, uploadedUrl);
      console.log("[apply] onApply returned");
      setResult(null);
    } catch (e) {
      console.error("[apply] error:", e);
      setErr(e instanceof Error ? e.message : "apply failed");
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start text-[11px] uppercase tracking-eyebrow text-copper hover:text-paper"
      >
        Ask Claude to help →
      </button>
    );
  }

  return (
    <div className="rounded-sm border border-line-strong bg-bg-elevated p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-eyebrow text-copper">Ask Claude</div>
        <button type="button" onClick={() => setOpen(false)} className="text-bone-faint hover:text-paper text-xs">×</button>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-eyebrow text-bone-faint mb-2">
          Your prompt
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="e.g. Summarize this video and pull 5 behavior tags. Or: Write a chapter-3 summary of Atomic Habits."
          className="w-full rounded-sm border border-line bg-bg-soft p-3 text-sm text-paper tracking-body"
        />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Button type="button" onClick={ask} disabled={pending || !prompt.trim()}>
          {pending ? "Thinking…" : result ? "Regenerate" : "Ask"}
        </Button>
        {result ? (
          <button
            type="button"
            onClick={() => { setResult(null); setErr(null); }}
            className="text-[11px] uppercase tracking-eyebrow text-bone hover:text-paper"
          >
            Clear output
          </button>
        ) : null}
        <span className="text-[11px] uppercase tracking-eyebrow text-bone-faint">
          Uses form fields above as context.
        </span>
      </div>

      {err ? <div className="text-sm text-[#b33a3a] tracking-body">{err}</div> : null}

      {result ? (
        <div className="mt-2 flex flex-col gap-3 border-t border-line pt-4">
          <div className="text-[10px] uppercase tracking-eyebrow text-copper">
            Claude's output
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-eyebrow text-bone-faint">Suggested title</div>
            <div className="text-sm text-paper tracking-body">{result.title}</div>
          </div>
          {result.author ? (
            <div>
              <div className="text-[10px] uppercase tracking-eyebrow text-bone-faint">Suggested author</div>
              <div className="text-sm text-paper tracking-body">{result.author}</div>
            </div>
          ) : null}
          <div>
            <div className="text-[10px] uppercase tracking-eyebrow text-bone-faint">Summary</div>
            <pre className="mt-1 whitespace-pre-wrap text-sm text-paper tracking-body leading-relaxed max-h-[320px] overflow-auto bg-bg-soft border border-line rounded-sm p-3">
              {result.summary}
            </pre>
          </div>
          {result.tags.length > 0 ? (
            <div>
              <div className="text-[10px] uppercase tracking-eyebrow text-bone-faint mb-1">Suggested tags</div>
              <div className="flex flex-wrap gap-1">
                {result.tags.map((t) => (
                  <span key={t} className="text-[10px] uppercase tracking-eyebrow text-bone border border-line px-1.5 py-0.5 rounded-sm">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <label className="inline-flex items-center gap-2 text-sm text-paper tracking-body">
            <input
              type="checkbox"
              checked={saveAsFile}
              onChange={(e) => setSaveAsFile(e.target.checked)}
              className="h-4 w-4 accent-copper"
            />
            Save summary as a markdown file upload (Vercel Blob)
          </label>

          <div className="flex items-center gap-3 flex-wrap">
            <Button type="button" onClick={apply} disabled={pending}>
              {pending ? "Applying…" : "Apply to form"}
            </Button>
            <button
              type="button"
              onClick={ask}
              disabled={pending || !prompt.trim()}
              className="text-[11px] uppercase tracking-eyebrow text-copper hover:text-paper disabled:opacity-50"
            >
              Regenerate
            </button>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="text-[11px] uppercase tracking-eyebrow text-bone hover:text-paper"
            >
              Discard
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
