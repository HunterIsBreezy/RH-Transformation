"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { put, del } from "@vercel/blob";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { exercises, users } from "@/db/schema";
import { requireRole } from "@/lib/auth";

type ExerciseInput = {
  id?: string;
  name: string;
  category: string;
  primaryMuscles?: string[];
  demoUrl?: string | null;
  cues?: string | null;
  defaultSets?: number | null;
  defaultReps?: string | null;
  defaultDurationMin?: number | null;
  coachNotes?: string | null;
  tags?: string[];
  inLibrary?: boolean;
};

async function coachUserId() {
  const cu = await currentUser();
  if (!cu) return null;
  const [u] = await db.select().from(users).where(eq(users.clerkId, cu.id)).limit(1);
  return u?.id ?? null;
}

export async function createExercise(input: ExerciseInput) {
  await requireRole("coach");
  const [row] = await db
    .insert(exercises)
    .values({
      name: input.name,
      category: input.category,
      primaryMuscles: input.primaryMuscles ?? [],
      demoUrl: input.demoUrl ?? null,
      cues: input.cues ?? null,
      defaultSets: input.defaultSets ?? null,
      defaultReps: input.defaultReps ?? null,
      defaultDurationMin: input.defaultDurationMin ?? null,
      coachNotes: input.coachNotes ?? null,
      tags: input.tags ?? [],
      inLibrary: input.inLibrary ?? true,
      authorId: await coachUserId(),
    })
    .returning();
  revalidatePath("/app/exercises");
  return row;
}

export async function updateExercise(id: string, patch: Partial<ExerciseInput>) {
  await requireRole("coach");
  const update: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of [
    "name","category","primaryMuscles","demoUrl","cues","defaultSets","defaultReps",
    "defaultDurationMin","coachNotes","tags","inLibrary",
  ] as const) {
    if (patch[k] !== undefined) update[k] = patch[k];
  }
  await db.update(exercises).set(update).where(eq(exercises.id, id));
  revalidatePath("/app/exercises");
}

export async function deleteExercise(id: string) {
  await requireRole("coach");
  const [existing] = await db.select().from(exercises).where(eq(exercises.id, id)).limit(1);
  if (existing?.demoUrl && existing.demoUrl.includes("blob.vercel-storage.com")) {
    try { await del(existing.demoUrl); } catch (e) { console.warn("[exercises] blob del failed", e); }
  }
  await db.delete(exercises).where(eq(exercises.id, id));
  revalidatePath("/app/exercises");
}

export async function uploadExerciseBlob(formData: FormData) {
  await requireRole("coach");
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("no file");
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN not set");
  const blob = await put(`exercises/${Date.now()}-${file.name}`, file, {
    access: "private",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  return { url: blob.url };
}
