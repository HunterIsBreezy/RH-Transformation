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

/**
 * Parses a WebVTT cue file into plain text, concatenating speaker lines.
 * Strips cue timestamps, cue IDs, and WEBVTT header.
 */
export function vttToPlainText(vtt: string): string {
  const lines = vtt.split(/\r?\n/);
  const out: string[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line === "WEBVTT") continue;
    if (/^\d+$/.test(line)) continue;
    if (line.includes("-->")) continue;
    if (line.startsWith("NOTE")) continue;
    out.push(line);
  }
  return out.join(" ").replace(/\s+/g, " ").trim();
}
