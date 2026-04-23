/**
 * Zoom server-to-server OAuth client.
 * Requires env: ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET, ZOOM_COACH_USER_ID.
 */

type ZoomRecordingFile = {
  id: string;
  meeting_id: string;
  recording_start: string;
  recording_end: string;
  file_type: string;
  file_extension: string;
  file_size: number;
  download_url: string;
  recording_type: string;
  status: string;
};

export type ZoomMeetingRecording = {
  uuid: string;
  id: number;
  topic: string;
  start_time: string;
  duration: number;
  recording_files: ZoomRecordingFile[];
};

export async function zoomAccessToken(): Promise<string> {
  const accountId = must("ZOOM_ACCOUNT_ID");
  const clientId = must("ZOOM_CLIENT_ID");
  const clientSecret = must("ZOOM_CLIENT_SECRET");

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    {
      method: "POST",
      headers: { Authorization: `Basic ${basic}` },
    },
  );
  if (!res.ok) {
    throw new Error(`zoom oauth failed: ${res.status} ${await res.text().catch(() => "")}`);
  }
  const body = (await res.json()) as { access_token: string };
  return body.access_token;
}

/**
 * Find the recording whose start_time is closest to `near` (within ±2h).
 * Returns null if nothing matches yet — the caller should back off and retry.
 */
export async function findRecordingNear(near: Date): Promise<ZoomMeetingRecording | null> {
  const token = await zoomAccessToken();
  const userId = must("ZOOM_COACH_USER_ID");

  const from = new Date(near.getTime() - 2 * 3600_000).toISOString().slice(0, 10);
  const to = new Date(near.getTime() + 2 * 3600_000).toISOString().slice(0, 10);

  const res = await fetch(
    `https://api.zoom.us/v2/users/${userId}/recordings?from=${from}&to=${to}&page_size=50`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    throw new Error(`zoom recordings list failed: ${res.status}`);
  }
  const body = (await res.json()) as { meetings: ZoomMeetingRecording[] };
  if (!body.meetings || body.meetings.length === 0) return null;

  const target = near.getTime();
  const tolerated = body.meetings.filter(
    (m) => Math.abs(new Date(m.start_time).getTime() - target) < 2 * 3600_000,
  );
  if (tolerated.length === 0) return null;
  tolerated.sort(
    (a, b) =>
      Math.abs(new Date(a.start_time).getTime() - target) -
      Math.abs(new Date(b.start_time).getTime() - target),
  );
  return tolerated[0];
}

export async function downloadZoomFile(url: string): Promise<{ bytes: Uint8Array; contentType: string }> {
  const token = await zoomAccessToken();
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    throw new Error(`zoom download failed: ${res.status}`);
  }
  const buf = await res.arrayBuffer();
  return {
    bytes: new Uint8Array(buf),
    contentType: res.headers.get("content-type") ?? "application/octet-stream",
  };
}

export async function fetchZoomText(url: string): Promise<string> {
  const token = await zoomAccessToken();
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    throw new Error(`zoom fetch text failed: ${res.status}`);
  }
  return await res.text();
}

function must(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`${key} not set`);
  return v;
}

export type TranscriptSegment = {
  speaker: string | null;
  text: string;
  startMs?: number;
};

/**
 * Parses a WebVTT cue file into per-speaker segments.
 * Handles two common Zoom layouts:
 *   (a) Inline <v Speaker Name>text</v> tags inside cue content.
 *   (b) Cue content beginning with `Speaker Name: text` (no tags).
 * Consecutive cues from the same speaker collapse into a single segment.
 */
export function parseVttSegments(vtt: string): TranscriptSegment[] {
  const lines = vtt.split(/\r?\n/);
  const raw: TranscriptSegment[] = [];

  let cueStart: number | undefined;
  let buffer: string[] = [];

  function flush() {
    if (buffer.length === 0) return;
    const payload = buffer.join(" ").replace(/\s+/g, " ").trim();
    if (payload) {
      for (const s of splitSpeakerParts(payload)) {
        raw.push({ speaker: s.speaker, text: s.text, startMs: cueStart });
      }
    }
    buffer = [];
    cueStart = undefined;
  }

  for (const line0 of lines) {
    const line = line0.trim();
    if (!line) { flush(); continue; }
    if (line === "WEBVTT") continue;
    if (line.startsWith("NOTE")) continue;
    if (/^\d+$/.test(line)) continue;
    if (line.includes("-->")) {
      flush();
      cueStart = vttTimestampToMs(line.split("-->")[0].trim());
      continue;
    }
    buffer.push(line);
  }
  flush();

  // Collapse consecutive segments from the same speaker.
  const merged: TranscriptSegment[] = [];
  for (const seg of raw) {
    const prev = merged[merged.length - 1];
    if (prev && prev.speaker === seg.speaker) {
      prev.text = `${prev.text} ${seg.text}`.trim();
    } else {
      merged.push({ ...seg });
    }
  }
  return merged;
}

function splitSpeakerParts(text: string): Array<{ speaker: string | null; text: string }> {
  // Inline <v Speaker>body</v> — may appear multiple times per line.
  const inline = /<v(?:\.[\w-]+)?\s+([^>]+)>([\s\S]*?)(?:<\/v>|$)/gi;
  const matches = [...text.matchAll(inline)];
  if (matches.length > 0) {
    const out: Array<{ speaker: string | null; text: string }> = [];
    for (const m of matches) {
      const speaker = m[1]?.trim() || null;
      const body = stripVttTags(m[2]).trim();
      if (body) out.push({ speaker, text: body });
    }
    return out;
  }
  // "Speaker Name: body"
  const colon = text.match(/^([A-Z][\w .'-]{0,48}):\s+(.+)$/);
  if (colon) {
    return [{ speaker: colon[1].trim(), text: stripVttTags(colon[2]).trim() }];
  }
  return [{ speaker: null, text: stripVttTags(text).trim() }];
}

function stripVttTags(s: string): string {
  return s.replace(/<\/?[^>]+>/g, "");
}

function vttTimestampToMs(ts: string): number | undefined {
  // e.g. 00:02:14.450 or 02:14.450
  const parts = ts.split(/[:.]/).map(Number);
  if (parts.some((n) => Number.isNaN(n))) return undefined;
  if (parts.length === 4) {
    const [h, m, s, ms] = parts;
    return ((h * 60 + m) * 60 + s) * 1000 + ms;
  }
  if (parts.length === 3) {
    const [m, s, ms] = parts;
    return (m * 60 + s) * 1000 + ms;
  }
  return undefined;
}

/**
 * Flattens parsed segments into readable plain text with speaker prefixes.
 * Used for embedding + fallback when the UI can't render segments.
 */
export function segmentsToPlainText(segs: TranscriptSegment[]): string {
  return segs
    .map((s) => (s.speaker ? `${s.speaker}: ${s.text}` : s.text))
    .join("\n\n")
    .trim();
}

/**
 * Back-compat: old callers use vttToPlainText. Delegate via segment parsing
 * so we get speaker prefixes for free.
 */
export function vttToPlainText(vtt: string): string {
  return segmentsToPlainText(parseVttSegments(vtt));
}
