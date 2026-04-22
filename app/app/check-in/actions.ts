"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { checkIns } from "@/db/schema";
import { getClientByClerkId } from "@/lib/queries";
import { requireRole } from "@/lib/auth";

export async function saveCheckIn(input: {
  clientId: string;
  mood: number;
  energy: number;
  sleepHours: number | null;
  training: string;
  nutrition: string;
  win: string;
  friction: string;
  note: string;
}) {
  await requireRole("client");

  const user = await currentUser();
  if (!user) throw new Error("unauthenticated");
  const detail = await getClientByClerkId(user.id);
  if (!detail || detail.client.id !== input.clientId) {
    throw new Error("not your client record");
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const existing = await db
    .select({ id: checkIns.id })
    .from(checkIns)
    .where(and(eq(checkIns.clientId, input.clientId), eq(checkIns.day, today)))
    .limit(1);

  const payload = {
    mood: input.mood,
    energy: input.energy,
    sleepHours: input.sleepHours,
    training: input.training,
    nutrition: input.nutrition,
    win: input.win || null,
    friction: input.friction || null,
    note: input.note || null,
  };

  if (existing[0]) {
    await db
      .update(checkIns)
      .set({ ...payload, updatedAt: new Date() })
      .where(eq(checkIns.id, existing[0].id));
  } else {
    await db.insert(checkIns).values({ clientId: input.clientId, day: today, ...payload });
  }

  revalidatePath("/app/today");
  revalidatePath("/app/check-in");
}
