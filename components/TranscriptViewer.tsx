"use client";

import { useEffect, useMemo, useRef } from "react";
import type { meetings } from "@/db/schema";

type Segment = NonNullable<(typeof meetings.$inferSelect)["transcriptSegments"]>[number];

export function TranscriptViewer({
  segments,
  transcriptText,
  highlight,
}: {
  segments: Segment[] | null;
  transcriptText: string | null;
  highlight?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const rendered = useMemo(() => {
    if (segments && segments.length > 0) return segments;
    // Fallback for older meetings without structured segments.
    if (!transcriptText) return [];
    return transcriptText
      .split(/\n{2,}/)
      .map((chunk): Segment => {
        const m = chunk.match(/^([^:]{1,48}):\s+([\s\S]+)$/);
        if (m) return { speaker: m[1].trim(), text: m[2].trim() };
        return { speaker: null, text: chunk.trim() };
      })
      .filter((s) => s.text.length > 0);
  }, [segments, transcriptText]);

  const terms = useMemo(() => {
    if (!highlight) return [];
    return highlight
      .toLowerCase()
      .split(/\s+/)
      .map((t) => t.replace(/[^\w-]/g, ""))
      .filter((t) => t.length >= 3);
  }, [highlight]);

  useEffect(() => {
    if (!highlight || !containerRef.current) return;
    const el = containerRef.current.querySelector("[data-matched='true']");
    if (el) el.scrollIntoView({ block: "center", behavior: "instant" as ScrollBehavior });
  }, [highlight]);

  if (rendered.length === 0) {
    return <div className="text-sm text-bone-faint tracking-body">Transcript not available.</div>;
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-4">
      {rendered.map((seg, i) => {
        const matches = terms.some((t) => seg.text.toLowerCase().includes(t));
        return (
          <div
            key={i}
            data-matched={matches ? "true" : undefined}
            className={`rounded-sm px-3 py-2 border ${
              matches ? "border-copper bg-copper-subtle" : "border-transparent"
            }`}
          >
            {seg.speaker ? (
              <div className="text-[10px] uppercase tracking-eyebrow text-copper mb-1">
                {seg.speaker}
              </div>
            ) : null}
            <div className="text-sm text-paper tracking-body leading-relaxed">
              {terms.length > 0 ? highlightText(seg.text, terms) : seg.text}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function highlightText(text: string, terms: string[]): React.ReactNode[] {
  if (terms.length === 0) return [text];
  const pattern = new RegExp(`(${terms.map(escapeRe).join("|")})`, "gi");
  return text.split(pattern).map((chunk, i) =>
    pattern.test(chunk) ? (
      <mark key={i} className="bg-copper/40 text-paper rounded-sm px-0.5">
        {chunk}
      </mark>
    ) : (
      <span key={i}>{chunk}</span>
    ),
  );
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
