"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { createResource, uploadResourceBlob } from "@/app/app/resources/actions";
import type { resources } from "@/db/schema";

type Resource = typeof resources.$inferSelect;

export function ResourcePicker({
  library,
  selectedIds,
  behavior,
  onSelect,
  onClose,
}: {
  library: Resource[];
  selectedIds: string[];
  behavior?: string;
  onSelect: (resourceId: string) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<"pick" | "create">("pick");
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [kind, setKind] = useState("article");
  const [saveToLibrary, setSaveToLibrary] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const needle = q.toLowerCase().trim();
  const filtered = library.filter((r) => {
    const qOk = needle
      ? r.title.toLowerCase().includes(needle) ||
        (r.author ?? "").toLowerCase().includes(needle)
      : true;
    const dedup = !selectedIds.includes(r.id);
    return qOk && dedup;
  });

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
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

  function createAndAttach(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!title.trim()) return setErr("Title is required.");
    startTransition(async () => {
      try {
        const created = await createResource({
          kind,
          title,
          url: url || null,
          behaviorsTargeted: behavior ? [behavior] : [],
          inLibrary: saveToLibrary,
        });
        onSelect(created.id);
        router.refresh();
        onClose();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "create failed");
      }
    });
  }

  return (
    <div className="mt-2 rounded-sm border border-line-strong bg-bg-elevated p-4 w-full max-w-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-3">
          <Tab active={mode === "pick"} onClick={() => setMode("pick")}>Pick from library</Tab>
          <Tab active={mode === "create"} onClick={() => setMode("create")}>New resource</Tab>
        </div>
        <button onClick={onClose} className="text-bone-faint hover:text-paper text-xs">×</button>
      </div>

      {mode === "pick" ? (
        <>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title, author…"
            className="mb-3"
            autoFocus
          />
          <div className="max-h-[320px] overflow-auto flex flex-col gap-1">
            {filtered.length === 0 ? (
              <div className="text-sm text-bone-faint tracking-body px-2 py-4">
                Nothing matches. Try the <span className="text-copper">New resource</span> tab.
              </div>
            ) : (
              filtered.map((r) => (
                <button
                  key={r.id}
                  onClick={() => { onSelect(r.id); onClose(); }}
                  className="text-left px-3 py-2 rounded-sm border border-transparent hover:border-line hover:bg-bg-card"
                >
                  <div className="text-[10px] uppercase tracking-eyebrow text-bone-faint">{r.kind}</div>
                  <div className="text-sm text-paper tracking-body">{r.title}</div>
                  {r.author ? <div className="text-xs text-bone mt-0.5">{r.author}</div> : null}
                </button>
              ))
            )}
          </div>
        </>
      ) : (
        <form onSubmit={createAndAttach} className="flex flex-col gap-3">
          <div className="flex gap-2">
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className="h-10 rounded-sm border border-line-strong bg-bg-soft px-2 text-sm text-paper"
            >
              {["article","video","book","pdf","doc","podcast","other"].map((k) => <option key={k}>{k}</option>)}
            </select>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="flex-1" />
          </div>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://… (optional)" />
          <div className="flex items-center gap-3">
            <input type="file" onChange={handleFile} className="text-xs text-bone" />
            {uploading ? <span className="text-[11px] uppercase tracking-eyebrow text-copper">Uploading…</span> : null}
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-paper tracking-body">
            <input
              type="checkbox"
              checked={saveToLibrary}
              onChange={(e) => setSaveToLibrary(e.target.checked)}
              className="h-4 w-4 accent-copper"
            />
            Save to library
          </label>
          {err ? <div className="text-sm text-[#b33a3a] tracking-body">{err}</div> : null}
          <div className="flex gap-3 items-center">
            <button
              type="submit"
              disabled={pending || uploading}
              className="inline-flex items-center h-9 px-4 rounded-sm bg-copper text-paper text-[11px] uppercase tracking-eyebrow disabled:opacity-50"
            >
              {pending ? "Creating…" : "Create & attach"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-[11px] uppercase tracking-eyebrow pb-1 border-b ${
        active ? "text-copper border-copper" : "text-bone border-transparent hover:text-paper"
      }`}
    >
      {children}
    </button>
  );
}
