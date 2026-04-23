"use client";

import { useMemo, useState, useTransition } from "react";
import { Eyebrow, Display, Body } from "@/components/type";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ResourceForm } from "./ResourceForm";
import { deleteResource } from "./actions";
import { isBlobUrl } from "@/lib/blob";
import type { resources } from "@/db/schema";

type Resource = typeof resources.$inferSelect;

const KINDS = ["book", "article", "video", "podcast", "pdf", "doc", "other"];

export function ResourcesPanel({ initial }: { initial: Resource[] }) {
  const [items] = useState<Resource[]>(initial);
  const [q, setQ] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [editing, setEditing] = useState<Resource | null>(null);
  const [creating, setCreating] = useState(false);
  const [, startTransition] = useTransition();

  const allTags = useMemo(() => {
    const s = new Set<string>();
    for (const r of items) for (const t of r.behaviorsTargeted) s.add(t);
    return Array.from(s).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((r) => {
      const qOk = needle
        ? r.title.toLowerCase().includes(needle) ||
          (r.author ?? "").toLowerCase().includes(needle) ||
          r.kind.toLowerCase().includes(needle)
        : true;
      const tOk = tagFilter ? r.behaviorsTargeted.includes(tagFilter) : true;
      return qOk && tOk;
    });
  }, [items, q, tagFilter]);

  if (creating) {
    return (
      <div className="max-w-3xl">
        <ResourceForm onDone={() => setCreating(false)} />
      </div>
    );
  }
  if (editing) {
    return (
      <div className="max-w-3xl">
        <ResourceForm initial={editing} onDone={() => setEditing(null)} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-start justify-between mb-10">
        <div>
          <Eyebrow wide className="text-copper">Coach · Resources</Eyebrow>
          <Display as="h1" size="md" tight className="mt-6">
            The archive you prescribe from.
          </Display>
        </div>
        <Button onClick={() => setCreating(true)}>+ New resource</Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <Input
          placeholder="Search title, author, kind…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="h-11 rounded-sm border border-line-strong bg-bg-soft px-3 text-sm text-paper tracking-body"
        >
          <option value="">All behaviors</option>
          {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <Body muted tight>No resources yet. Click <span className="text-copper">+ New resource</span> to add the first one.</Body>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <Card key={r.id} className="flex flex-col">
              <CardContent className="pt-6 flex flex-col gap-3 flex-1">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] uppercase tracking-eyebrow text-bone-faint">{r.kind}</span>
                  {!r.inLibrary ? (
                    <span className="text-[10px] uppercase tracking-eyebrow text-bone-faint">inline</span>
                  ) : null}
                </div>
                <div>
                  <div className="text-base font-semibold text-paper tracking-display leading-tight">{r.title}</div>
                  {r.author ? <div className="text-xs text-bone mt-1">{r.author}</div> : null}
                </div>
                {r.behaviorsTargeted.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {r.behaviorsTargeted.map((t) => (
                      <span key={t} className="text-[10px] uppercase tracking-eyebrow text-bone border border-line px-1.5 py-0.5 rounded-sm">
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
                {r.url ? (
                  <span className="text-xs text-copper break-all">
                    {isBlobUrl(r.url) ? "Uploaded file" : new URL(r.url).hostname}
                  </span>
                ) : null}
                <div className="mt-auto pt-2 flex items-center gap-3">
                  <a
                    href={`/app/resources/${r.id}`}
                    className="text-[11px] uppercase tracking-eyebrow text-copper hover:text-paper"
                  >
                    View
                  </a>
                  <button onClick={() => setEditing(r)} className="text-[11px] uppercase tracking-eyebrow text-bone hover:text-paper">
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${r.title}"?`)) {
                        startTransition(async () => {
                          await deleteResource(r.id);
                          location.reload();
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

export { KINDS };
