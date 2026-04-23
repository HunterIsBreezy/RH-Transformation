"use server";

import { sql } from "drizzle-orm";
import { embed } from "ai";
import { db } from "@/db";
import { requireRole } from "@/lib/auth";
import type { meetings } from "@/db/schema";

type Segment = NonNullable<(typeof meetings.$inferSelect)["transcriptSegments"]>[number];

export type TranscriptSearchHit = {
  meetingId: string;
  clientId: string;
  clientName: string | null;
  clientEmail: string;
  scheduledAt: string;
  kind: string;
  distance: number;
  snippet: string;
  speaker: string | null;
};

export async function searchTranscripts(query: string): Promise<TranscriptSearchHit[]> {
  await requireRole("coach");
  const q = query.trim();
  if (!q) return [];

  const { embedding } = await embed({
    model: "openai/text-embedding-3-small",
    value: q,
  });
  const vectorLiteral = `[${embedding.join(",")}]`;

  const rows = (await db.execute(sql`
    SELECT
      m.id AS meeting_id,
      m.client_id,
      m.scheduled_at,
      m.kind,
      m.transcript_text,
      m.transcript_segments,
      u.full_name,
      u.email,
      (m.transcript_embedding <=> ${vectorLiteral}::vector) AS distance
    FROM meetings m
    INNER JOIN clients c ON c.id = m.client_id
    INNER JOIN users u ON u.id = c.user_id
    WHERE m.transcript_embedding IS NOT NULL
    ORDER BY m.transcript_embedding <=> ${vectorLiteral}::vector
    LIMIT 10
  `)) as unknown as Array<{
    meeting_id: string;
    client_id: string;
    scheduled_at: string;
    kind: string;
    transcript_text: string | null;
    transcript_segments: Segment[] | null;
    full_name: string | null;
    email: string;
    distance: number;
  }>;

  return rows.map((r) => {
    const snippet = bestSnippet(r.transcript_segments, r.transcript_text, q);
    return {
      meetingId: r.meeting_id,
      clientId: r.client_id,
      clientName: r.full_name,
      clientEmail: r.email,
      scheduledAt: new Date(r.scheduled_at).toISOString(),
      kind: r.kind,
      distance: Number(r.distance),
      snippet: snippet.text,
      speaker: snippet.speaker,
    };
  });
}

function bestSnippet(
  segments: Segment[] | null,
  fallbackText: string | null,
  query: string,
): { text: string; speaker: string | null } {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^\w-]/g, ""))
    .filter((t) => t.length >= 3);

  if (segments && segments.length > 0) {
    let best: Segment | null = null;
    let bestScore = 0;
    for (const seg of segments) {
      const lower = seg.text.toLowerCase();
      let score = 0;
      for (const t of terms) {
        if (lower.includes(t)) score += 1;
      }
      if (score > bestScore) {
        bestScore = score;
        best = seg;
      }
    }
    if (best) return { text: truncate(best.text, 280), speaker: best.speaker };
    return { text: truncate(segments[0].text, 280), speaker: segments[0].speaker };
  }

  if (fallbackText) {
    const lower = fallbackText.toLowerCase();
    for (const t of terms) {
      const idx = lower.indexOf(t);
      if (idx >= 0) {
        const start = Math.max(0, idx - 120);
        const end = Math.min(fallbackText.length, idx + 160);
        return {
          text: (start > 0 ? "…" : "") + fallbackText.slice(start, end) + (end < fallbackText.length ? "…" : ""),
          speaker: null,
        };
      }
    }
    return { text: truncate(fallbackText, 280), speaker: null };
  }

  return { text: "No transcript content available.", speaker: null };
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n).trimEnd() + "…" : s;
}
