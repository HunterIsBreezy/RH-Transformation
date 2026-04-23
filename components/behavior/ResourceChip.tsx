"use client";

import { useState } from "react";
import { toDisplayUrl } from "@/lib/blob";
import type { resources } from "@/db/schema";

type Resource = typeof resources.$inferSelect;

export function ResourceChip({
  resource,
  onRemove,
}: {
  resource: Resource;
  onRemove?: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="inline-flex flex-col">
      <div className="inline-flex items-center gap-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-eyebrow px-2 py-1 rounded-sm border border-line text-bone hover:border-copper hover:text-copper transition-colors max-w-[240px]"
        >
          <span className="text-bone-faint">{resource.kind}</span>
          <span className="truncate text-paper normal-case tracking-body text-xs font-medium">{resource.title}</span>
        </button>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="text-bone-faint hover:text-[#b33a3a] text-xs leading-none px-1"
            aria-label="Remove resource"
          >
            ×
          </button>
        ) : null}
      </div>
      {open ? <ResourcePreview resource={resource} /> : null}
    </div>
  );
}

function ResourcePreview({ resource }: { resource: Resource }) {
  const url = resource.url ?? "";
  const embed = toEmbedUrl(url);
  const display = toDisplayUrl(url) ?? "";

  return (
    <div className="mt-2 rounded-sm border border-line bg-bg-soft p-3 max-w-full">
      {embed ? (
        <div className="aspect-video w-full">
          <iframe src={embed} title={resource.title} className="w-full h-full rounded-sm" allowFullScreen />
        </div>
      ) : isPdf(url) ? (
        <iframe src={display} title={resource.title} className="w-full h-[480px] rounded-sm bg-bg-card" />
      ) : url ? (
        <a href={display} target="_blank" rel="noopener noreferrer" className="text-sm text-copper hover:text-paper break-all">
          Open {url}
        </a>
      ) : null}
      {resource.bodyMd ? (
        <pre className="mt-3 whitespace-pre-wrap text-xs text-bone tracking-body leading-relaxed">
          {resource.bodyMd}
        </pre>
      ) : null}
      {resource.author ? (
        <div className="mt-2 text-[11px] uppercase tracking-eyebrow text-bone-faint">{resource.author}</div>
      ) : null}
    </div>
  );
}

function toEmbedUrl(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

function isPdf(url: string) {
  return /\.pdf($|\?)/i.test(url);
}
