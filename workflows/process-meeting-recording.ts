import { sleep, FatalError, RetryableError } from "workflow";
import { eq } from "drizzle-orm";
import { put } from "@vercel/blob";
import { embed } from "ai";
import { db } from "@/db";
import { clients, meetings } from "@/db/schema";
import {
  downloadZoomFile,
  fetchZoomText,
  findRecordingNear,
  vttToPlainText,
  type ZoomMeetingRecording,
} from "@/lib/zoom";

const MAX_POLL_ATTEMPTS = 10;
// Safe embedding window for text-embedding-3-small (~8k tokens; ~30k chars).
const EMBED_CHAR_LIMIT = 28_000;

export async function processMeetingRecording(meetingId: string) {
  "use workflow";

  console.log(`[workflow:meeting] start meetingId=${meetingId}`);

  const ctx = await loadMeetingContext(meetingId);
  if (!ctx) return { skipped: "meeting not found" };
  if (!ctx.consented) return { skipped: "no transcript consent" };

  // Sleep until 1h past scheduled start — recording/transcript typically ready within 15-30m after.
  const wakeAt = new Date(new Date(ctx.scheduledAt).getTime() + 60 * 60_000);
  console.log(`[workflow:meeting] sleeping until ${wakeAt.toISOString()}`);
  await sleep(wakeAt);

  const recording = await pollForRecording(meetingId);
  if (!recording) return { skipped: "no recording found after polling" };

  const assets = await persistRecording(meetingId, recording);
  if (!assets.transcriptText) return { skipped: "recording downloaded, no transcript available" };

  await embedTranscript(meetingId, assets.transcriptText);

  console.log(`[workflow:meeting] done meetingId=${meetingId}`);
  return { ok: true, recordingUrl: assets.recordingUrl };
}

async function loadMeetingContext(meetingId: string): Promise<{
  scheduledAt: string;
  consented: boolean;
  clientId: string;
} | null> {
  "use step";
  console.log(`[step:loadMeetingContext] ${meetingId}`);

  const [row] = await db
    .select({
      scheduledAt: meetings.scheduledAt,
      clientId: meetings.clientId,
      consent: clients.transcriptConsent,
    })
    .from(meetings)
    .innerJoin(clients, eq(clients.id, meetings.clientId))
    .where(eq(meetings.id, meetingId))
    .limit(1);

  if (!row) return null;
  return {
    scheduledAt: new Date(row.scheduledAt).toISOString(),
    consented: row.consent,
    clientId: row.clientId,
  };
}

async function pollForRecording(meetingId: string): Promise<ZoomMeetingRecording | null> {
  "use step";
  console.log(`[step:pollForRecording] ${meetingId}`);

  const [row] = await db
    .select({ scheduledAt: meetings.scheduledAt })
    .from(meetings)
    .where(eq(meetings.id, meetingId))
    .limit(1);
  if (!row) throw new FatalError("meeting vanished during polling");

  let attempt = 0;
  while (attempt < MAX_POLL_ATTEMPTS) {
    const found = await findRecordingNear(new Date(row.scheduledAt));
    if (found && found.recording_files.some((f) => f.status === "completed")) {
      return found;
    }
    attempt++;
    // Step errors are retried automatically with backoff by the workflow runtime.
    if (attempt >= MAX_POLL_ATTEMPTS) return null;
    throw new RetryableError(`recording not ready (attempt ${attempt})`);
  }
  return null;
}

async function persistRecording(
  meetingId: string,
  recording: ZoomMeetingRecording,
): Promise<{ recordingUrl: string | null; transcriptText: string | null }> {
  "use step";
  console.log(`[step:persistRecording] meetingId=${meetingId} zoomId=${recording.id}`);

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new FatalError("BLOB_READ_WRITE_TOKEN not set");

  const video = recording.recording_files.find(
    (f) => f.file_type === "MP4" && f.status === "completed",
  );
  const transcriptFile = recording.recording_files.find(
    (f) => f.file_type === "TRANSCRIPT" && f.status === "completed",
  );

  let recordingUrl: string | null = null;
  if (video) {
    const { bytes, contentType } = await downloadZoomFile(video.download_url);
    const blob = await put(
      `meetings/${meetingId}/recording.${video.file_extension.toLowerCase()}`,
      Buffer.from(bytes),
      { access: "private", contentType, token, addRandomSuffix: true },
    );
    recordingUrl = blob.url;
  }

  let transcriptText: string | null = null;
  if (transcriptFile) {
    const vtt = await fetchZoomText(transcriptFile.download_url);
    transcriptText = vttToPlainText(vtt);
    // Keep the raw VTT in Blob for future re-processing.
    await put(`meetings/${meetingId}/transcript.vtt`, vtt, {
      access: "private",
      contentType: "text/vtt; charset=utf-8",
      token,
      addRandomSuffix: true,
    });
  }

  await db
    .update(meetings)
    .set({
      zoomMeetingId: String(recording.id),
      zoomRecordingUrl: recordingUrl,
      transcriptText,
      updatedAt: new Date(),
    })
    .where(eq(meetings.id, meetingId));

  return { recordingUrl, transcriptText };
}

async function embedTranscript(meetingId: string, transcript: string): Promise<void> {
  "use step";
  console.log(`[step:embedTranscript] meetingId=${meetingId} chars=${transcript.length}`);

  const text = transcript.length > EMBED_CHAR_LIMIT ? transcript.slice(0, EMBED_CHAR_LIMIT) : transcript;
  const { embedding } = await embed({
    model: "openai/text-embedding-3-small",
    value: text,
  });

  await db
    .update(meetings)
    .set({ transcriptEmbedding: embedding, updatedAt: new Date() })
    .where(eq(meetings.id, meetingId));
}
