import { NextResponse, type NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { start } from "workflow/api";
import { db } from "@/db";
import { clients, meetings, users } from "@/db/schema";
import { processMeetingRecording } from "@/workflows/process-meeting-recording";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CalendlyScheduledEvent = {
  uri?: string;
  start_time?: string;
  end_time?: string;
};

type CalendlyInvitee = {
  uri?: string;
  email?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  scheduled_event?: CalendlyScheduledEvent;
  event?: string;
};

type CalendlyPayload = {
  event: string;
  payload: CalendlyInvitee & {
    invitee?: CalendlyInvitee;
    scheduled_event?: CalendlyScheduledEvent;
  };
};

export async function POST(req: NextRequest) {
  const secret = process.env.CALENDLY_SIGNING_KEY;
  const header = req.headers.get("calendly-webhook-signature");
  const raw = await req.text();

  if (!secret || !header || !verify(header, raw, secret)) {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  const body = JSON.parse(raw) as CalendlyPayload;
  const invitee = body.payload.invitee ?? body.payload;
  const scheduled: CalendlyScheduledEvent | null =
    body.payload.scheduled_event ?? invitee.scheduled_event ?? null;
  const email = invitee.email?.toLowerCase() ?? null;
  if (!email) {
    return NextResponse.json({ error: "missing invitee email" }, { status: 400 });
  }

  switch (body.event) {
    case "invitee.created": {
      const fullName =
        invitee.name ??
        [invitee.first_name, invitee.last_name].filter(Boolean).join(" ") ??
        null;

      const user = await upsertUser(email, fullName ?? null);
      const client = await upsertClient(user.id, "applied");

      if (scheduled?.start_time) {
        const eventUri = scheduled.uri ?? null;
        const existing = eventUri
          ? await db
              .select({ id: meetings.id })
              .from(meetings)
              .where(eq(meetings.calendlyEventUri, eventUri))
              .limit(1)
          : [];
        if (existing.length === 0) {
          const [created] = await db
            .insert(meetings)
            .values({
              clientId: client.id,
              coachId: user.id,
              kind: "discovery",
              scheduledAt: new Date(scheduled.start_time),
              endedAt: scheduled.end_time ? new Date(scheduled.end_time) : null,
              source: "calendly",
              calendlyEventUri: eventUri,
              calendlyInviteeUri: invitee.uri ?? null,
            })
            .returning({ id: meetings.id });
          try {
            await start(processMeetingRecording, [created.id]);
          } catch (e) {
            console.warn("[calendly] failed to start recording workflow", e);
          }
        }
      }
      break;
    }

    case "invitee.canceled": {
      const eventUri = scheduled?.uri ?? null;
      const inviteeUri = invitee.uri ?? null;
      if (eventUri || inviteeUri) {
        await db
          .update(meetings)
          .set({ canceledAt: new Date(), updatedAt: new Date() })
          .where(
            and(
              eventUri ? eq(meetings.calendlyEventUri, eventUri) : undefined,
              inviteeUri ? eq(meetings.calendlyInviteeUri, inviteeUri) : undefined,
            )!,
          );
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}

function verify(header: string, raw: string, secret: string) {
  const parts = Object.fromEntries(header.split(",").map((p) => p.trim().split("=") as [string, string]));
  const t = parts["t"];
  const v1 = parts["v1"];
  if (!t || !v1) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${raw}`).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(v1, "hex"));
  } catch {
    return false;
  }
}

async function upsertUser(email: string, fullName: string | null) {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) {
    if (fullName && !existing.fullName) {
      await db.update(users).set({ fullName, updatedAt: new Date() }).where(eq(users.id, existing.id));
    }
    return existing;
  }
  const [created] = await db
    .insert(users)
    .values({ email, fullName, clerkId: `pending:${email}`, role: "client" })
    .returning();
  return created;
}

async function upsertClient(userId: string, status: "applied") {
  const [existing] = await db.select().from(clients).where(eq(clients.userId, userId)).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(clients).values({ userId, status }).returning();
  return created;
}
