"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Body } from "@/components/type";
import { searchTranscripts, type TranscriptSearchHit } from "./actions";

export function TranscriptSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<TranscriptSearchHit[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setErr(null);
    startTransition(async () => {
      try {
        const hits = await searchTranscripts(q);
        setResults(hits);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "search failed");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={run} className="flex gap-2 max-w-2xl">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search every transcript — e.g. sleep anxiety, nutrition fell off, quitting…"
          autoFocus
        />
        <Button type="submit" disabled={pending || !q.trim()}>
          {pending ? "Searching…" : "Search"}
        </Button>
      </form>

      {err ? (
        <div className="rounded-sm border border-[#b33a3a] bg-[#b33a3a]/10 px-3 py-2 text-sm text-[#b33a3a] tracking-body">
          {err}
        </div>
      ) : null}

      {results === null && !pending ? (
        <Body size="sm" muted tight>
          Semantic search across every transcribed meeting. Type a concept — not an exact quote — and we&apos;ll
          rank the calls where that topic surfaced most.
        </Body>
      ) : null}

      {results && results.length === 0 ? (
        <Body size="sm" muted tight>
          Nothing matched. Try a broader phrase, or confirm transcripts have finished processing.
        </Body>
      ) : null}

      {results && results.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {results.map((hit) => (
            <li key={hit.meetingId} className="rounded-sm border border-line bg-bg-card p-4">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-2">
                <div>
                  <Link
                    href={`/app/clients/${hit.clientId}`}
                    className="text-sm font-semibold text-paper tracking-display-tight hover:text-copper"
                  >
                    {hit.clientName ?? hit.clientEmail}
                  </Link>
                  <div className="text-[11px] uppercase tracking-eyebrow text-bone-faint mt-1">
                    {hit.kind} ·{" "}
                    {new Date(hit.scheduledAt).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
                <div className="text-[10px] uppercase tracking-eyebrow text-bone-faint">
                  similarity {(1 - hit.distance).toFixed(2)}
                </div>
              </div>
              {hit.speaker ? (
                <div className="text-[10px] uppercase tracking-eyebrow text-copper mb-1">
                  {hit.speaker}
                </div>
              ) : null}
              <Snippet text={hit.snippet} terms={q} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function Snippet({ text, terms }: { text: string; terms: string }) {
  const toks = terms
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^\w-]/g, ""))
    .filter((t) => t.length >= 3);
  if (toks.length === 0) {
    return <p className="text-sm text-paper tracking-body leading-relaxed">{text}</p>;
  }
  const pattern = new RegExp(`(${toks.map(escapeRe).join("|")})`, "gi");
  return (
    <p className="text-sm text-paper tracking-body leading-relaxed">
      {text.split(pattern).map((chunk, i) =>
        pattern.test(chunk) ? (
          <mark key={i} className="bg-copper/40 text-paper rounded-sm px-0.5">
            {chunk}
          </mark>
        ) : (
          <span key={i}>{chunk}</span>
        ),
      )}
    </p>
  );
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
