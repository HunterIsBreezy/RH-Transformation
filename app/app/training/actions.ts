"use server";

import { revalidatePath } from "next/cache";
import { and, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { clientSchedule, clients, exercises as exercisesTable, users } from "@/db/schema";
import { getRole } from "@/lib/auth";
import { addWeeks, currentWeekStart, isPastWeek, toMondayUtc } from "@/lib/week";

async function resolveAllowedClientId(clientId: string) {
  const cu = await currentUser();
  if (!cu) throw new Error("unauthenticated");
  const role = await getRole();
  if (role === "coach") return clientId;
  if (role === "client") {
    const [row] = await db
      .select({ id: clients.id })
      .from(users)
      .innerJoin(clients, eq(clients.userId, users.id))
      .where(and(eq(users.clerkId, cu.id), eq(clients.id, clientId)))
      .limit(1);
    if (!row) throw new Error("not your schedule");
    return row.id;
  }
  throw new Error("no role");
}

export type ScheduleDetail = {
  sets?: number | null;
  reps?: string | null;
  durationMin?: number | null;
  cues?: string | null;
  mediaUrl?: string | null;
  coachNotes?: string | null;
  category?: string | null;
};

export async function scheduleExerciseDrop(input: {
  clientId: string;
  exerciseId: string;
  weekStart: string; // ISO yyyy-mm-dd (Monday)
  day: number; // 0=Mon..6=Sun
}) {
  if ((await getRole()) !== "coach") throw new Error("coach only");
  const cid = await resolveAllowedClientId(input.clientId);
  const [ex] = await db.select().from(exercisesTable).where(eq(exercisesTable.id, input.exerciseId)).limit(1);
  if (!ex) throw new Error("exercise missing");

  const weekStart = toMondayUtc(new Date(input.weekStart));
  const existing = await db
    .select({ slot: clientSchedule.slot })
    .from(clientSchedule)
    .where(
      and(
        eq(clientSchedule.clientId, cid),
        eq(clientSchedule.weekStart, weekStart),
        eq(clientSchedule.day, input.day),
      ),
    );
  const slot = existing.reduce((m, r) => Math.max(m, r.slot), -1) + 1;

  const detail: ScheduleDetail = {
    sets: ex.defaultSets,
    reps: ex.defaultReps,
    durationMin: ex.defaultDurationMin,
    cues: ex.cues,
    mediaUrl: ex.demoUrl,
    coachNotes: ex.coachNotes,
    category: ex.category,
  };

  await db.insert(clientSchedule).values({
    clientId: cid,
    weekStart,
    day: input.day,
    slot,
    exerciseId: ex.id,
    title: ex.name,
    detail,
    lockedByCoach: false,
  });

  revalidatePath(`/app/clients/${cid}/program-builder`);
  revalidatePath(`/app/training`);
}

export async function moveScheduleBlock(input: {
  blockId: string;
  toDay: number;
}) {
  const cu = await currentUser();
  if (!cu) throw new Error("unauthenticated");
  const [block] = await db.select().from(clientSchedule).where(eq(clientSchedule.id, input.blockId)).limit(1);
  if (!block) throw new Error("not found");

  const cid = await resolveAllowedClientId(block.clientId);
  const role = await getRole();
  if (role === "client") {
    if (block.lockedByCoach) throw new Error("locked by coach");
    if (isPastWeek(new Date(block.weekStart))) throw new Error("past week is read-only");
  }

  await db
    .update(clientSchedule)
    .set({ day: input.toDay, updatedAt: new Date() })
    .where(eq(clientSchedule.id, input.blockId));

  revalidatePath(`/app/clients/${cid}/program-builder`);
  revalidatePath(`/app/training`);
}

export async function deleteScheduleBlock(blockId: string) {
  if ((await getRole()) !== "coach") throw new Error("coach only");
  const [block] = await db.select().from(clientSchedule).where(eq(clientSchedule.id, blockId)).limit(1);
  if (!block) return;
  await resolveAllowedClientId(block.clientId);
  await db.delete(clientSchedule).where(eq(clientSchedule.id, blockId));
  revalidatePath(`/app/clients/${block.clientId}/program-builder`);
  revalidatePath(`/app/training`);
}

export async function toggleBlockComplete(blockId: string) {
  const cu = await currentUser();
  if (!cu) throw new Error("unauthenticated");
  const [block] = await db.select().from(clientSchedule).where(eq(clientSchedule.id, blockId)).limit(1);
  if (!block) throw new Error("not found");
  await resolveAllowedClientId(block.clientId);

  await db
    .update(clientSchedule)
    .set({
      completedAt: block.completedAt ? null : new Date(),
      updatedAt: new Date(),
    })
    .where(eq(clientSchedule.id, blockId));

  revalidatePath(`/app/training`);
  revalidatePath(`/app/clients/${block.clientId}/program-builder`);
}

export async function toggleBlockLocked(blockId: string) {
  if ((await getRole()) !== "coach") throw new Error("coach only");
  const [block] = await db.select().from(clientSchedule).where(eq(clientSchedule.id, blockId)).limit(1);
  if (!block) throw new Error("not found");
  await db
    .update(clientSchedule)
    .set({ lockedByCoach: !block.lockedByCoach, updatedAt: new Date() })
    .where(eq(clientSchedule.id, blockId));
  revalidatePath(`/app/clients/${block.clientId}/program-builder`);
  revalidatePath(`/app/training`);
}

export async function cloneFromClient(input: {
  sourceClientId: string;
  targetClientId: string;
}) {
  if ((await getRole()) !== "coach") throw new Error("coach only");
  const src = await db.select().from(clientSchedule).where(eq(clientSchedule.clientId, input.sourceClientId));
  if (src.length === 0) return 0;

  // Wipe target's future + current weeks before cloning
  const thisMonday = currentWeekStart();
  await db
    .delete(clientSchedule)
    .where(and(eq(clientSchedule.clientId, input.targetClientId), gte(clientSchedule.weekStart, thisMonday)));

  // Snapshot rows onto target with same relative weekOffsets from source's earliest week
  const earliest = src.reduce(
    (min, r) => (new Date(r.weekStart).getTime() < min.getTime() ? new Date(r.weekStart) : min),
    new Date(src[0].weekStart),
  );
  const inserts = src.map((r) => {
    const wOffset = Math.round((new Date(r.weekStart).getTime() - earliest.getTime()) / (7 * 86_400_000));
    return {
      clientId: input.targetClientId,
      weekStart: addWeeks(thisMonday, wOffset),
      day: r.day,
      slot: r.slot,
      exerciseId: r.exerciseId,
      title: r.title,
      detail: r.detail,
      lockedByCoach: r.lockedByCoach,
    };
  });
  await db.insert(clientSchedule).values(inserts);
  revalidatePath(`/app/clients/${input.targetClientId}/program-builder`);
  return inserts.length;
}

export async function weekSchedule(clientId: string, weekStart: Date) {
  const cid = await resolveAllowedClientId(clientId);
  const rows = await db
    .select()
    .from(clientSchedule)
    .where(and(eq(clientSchedule.clientId, cid), eq(clientSchedule.weekStart, toMondayUtc(weekStart))))
    .orderBy(clientSchedule.day, clientSchedule.slot);
  return rows;
}

export async function fullProgram(clientId: string, fromWeekStart: Date, weeks: number) {
  const cid = await resolveAllowedClientId(clientId);
  const start = toMondayUtc(fromWeekStart);
  const end = addWeeks(start, weeks);
  const rows = await db
    .select()
    .from(clientSchedule)
    .where(
      and(
        eq(clientSchedule.clientId, cid),
        gte(clientSchedule.weekStart, start),
        lt(clientSchedule.weekStart, end),
      ),
    );
  return rows;
}

export async function listClientsForClone(excludeClientId: string) {
  if ((await getRole()) !== "coach") throw new Error("coach only");
  const rows = await db
    .select({
      id: clients.id,
      name: users.fullName,
      email: users.email,
    })
    .from(clients)
    .innerJoin(users, eq(users.id, clients.userId))
    .where(sql`${clients.id} != ${excludeClientId}`)
    .limit(50);
  return rows;
}
