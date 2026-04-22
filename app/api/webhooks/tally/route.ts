import { NextResponse, type NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { clients, intakeResponses, users } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TallyField = { key: string; label: string; value: unknown };
type TallyPayload = {
  eventType?: string;
  data?: {
    submissionId?: string;
    createdAt?: string;
    fields?: TallyField[];
    [k: string]: unknown;
  };
};

export async function POST(req: NextRequest) {
  const secret = process.env.TALLY_SIGNING_SECRET;
  const signature = req.headers.get("tally-signature");
  const raw = await req.text();

  if (!secret || !signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }
  const expected = createHmac("sha256", secret).update(raw).digest("base64");
  try {
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return NextResponse.json({ error: "bad signature" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  const body = JSON.parse(raw) as TallyPayload;
  const fields = body.data?.fields ?? [];
  const email = pickEmail(fields);
  if (!email) {
    return NextResponse.json({ error: "missing email in intake" }, { status: 400 });
  }

  const consent = pickConsent(fields);

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  let client = user
    ? (await db.select().from(clients).where(eq(clients.userId, user.id)).limit(1))[0]
    : null;

  if (!user) {
    const [createdUser] = await db
      .insert(users)
      .values({ email, clerkId: `pending:${email}`, role: "client" })
      .returning();
    const [createdClient] = await db
      .insert(clients)
      .values({ userId: createdUser.id, status: "applicant", transcriptConsent: consent ?? false })
      .returning();
    client = createdClient;
  } else if (!client) {
    const [createdClient] = await db
      .insert(clients)
      .values({ userId: user.id, status: "applicant", transcriptConsent: consent ?? false })
      .returning();
    client = createdClient;
  } else if (consent !== null && client.transcriptConsent !== consent) {
    await db
      .update(clients)
      .set({
        transcriptConsent: consent,
        consentSignedAt: consent ? new Date() : client.consentSignedAt,
        updatedAt: new Date(),
      })
      .where(eq(clients.id, client.id));
  }

  await db.insert(intakeResponses).values({
    clientId: client!.id,
    source: "tally",
    submittedAt: body.data?.createdAt ? new Date(body.data.createdAt) : new Date(),
    payload: body.data ?? {},
  });

  return NextResponse.json({ received: true });
}

function pickEmail(fields: TallyField[]) {
  const byType = fields.find(
    (f) => f.key?.toLowerCase().includes("email") || f.label?.toLowerCase().includes("email"),
  );
  const v = byType?.value;
  if (typeof v === "string") return v.toLowerCase();
  return null;
}

function pickConsent(fields: TallyField[]): boolean | null {
  const f = fields.find((f) => {
    const haystack = `${f.key ?? ""} ${f.label ?? ""}`.toLowerCase();
    return haystack.includes("transcript") && haystack.includes("consent");
  });
  if (!f) return null;
  if (typeof f.value === "boolean") return f.value;
  if (typeof f.value === "string") {
    const v = f.value.toLowerCase();
    if (["yes", "true", "i consent", "agreed"].some((s) => v.includes(s))) return true;
    if (["no", "false", "decline"].some((s) => v.includes(s))) return false;
  }
  if (Array.isArray(f.value)) {
    return f.value.some((v) => typeof v === "string" && v.toLowerCase().includes("yes"));
  }
  return null;
}
