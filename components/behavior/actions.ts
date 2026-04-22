"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq, inArray } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import {
  behaviorEntries,
  clients,
  prescriptionTemplates,
  resources,
  users,
} from "@/db/schema";
import { getRole } from "@/lib/auth";

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
    if (!row) throw new Error("not your board");
    return row.id;
  }
  throw new Error("no role");
}

export async function createBehaviorEntry(
  clientId: string,
  input: { pillar: string; current: string; desired: string },
) {
  const cid = await resolveAllowedClientId(clientId);
  const existing = await db
    .select({ position: behaviorEntries.position })
    .from(behaviorEntries)
    .where(eq(behaviorEntries.clientId, cid));
  const nextPos = existing.reduce((m, r) => Math.max(m, r.position), -1) + 1;
  const [row] = await db
    .insert(behaviorEntries)
    .values({
      clientId: cid,
      pillar: input.pillar,
      current: input.current,
      desired: input.desired,
      position: nextPos,
    })
    .returning();
  revalidatePath("/app/behavior-board");
  revalidatePath(`/app/clients/${cid}`);
  return row;
}

export async function updateBehaviorEntry(
  entryId: string,
  patch: {
    pillar?: string;
    current?: string;
    desired?: string;
    prescription?: string | null;
    status?: typeof behaviorEntries.$inferSelect["status"];
    progressPct?: number;
    resourceIds?: string[];
  },
) {
  const [existing] = await db
    .select()
    .from(behaviorEntries)
    .where(eq(behaviorEntries.id, entryId))
    .limit(1);
  if (!existing) throw new Error("not found");
  await resolveAllowedClientId(existing.clientId);

  const update: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of ["pillar", "current", "desired", "prescription", "status", "progressPct", "resourceIds"] as const) {
    if (patch[k] !== undefined) update[k] = patch[k];
  }
  await db.update(behaviorEntries).set(update).where(eq(behaviorEntries.id, entryId));
  revalidatePath("/app/behavior-board");
  revalidatePath(`/app/clients/${existing.clientId}`);
}

export async function deleteBehaviorEntry(entryId: string) {
  const [existing] = await db
    .select()
    .from(behaviorEntries)
    .where(eq(behaviorEntries.id, entryId))
    .limit(1);
  if (!existing) return;
  await resolveAllowedClientId(existing.clientId);
  await db.delete(behaviorEntries).where(eq(behaviorEntries.id, entryId));
  revalidatePath("/app/behavior-board");
  revalidatePath(`/app/clients/${existing.clientId}`);
}

export async function applyTemplateToEntry(entryId: string, templateId: string) {
  const [existing] = await db
    .select()
    .from(behaviorEntries)
    .where(eq(behaviorEntries.id, entryId))
    .limit(1);
  if (!existing) throw new Error("not found");
  await resolveAllowedClientId(existing.clientId);
  if ((await getRole()) !== "coach") throw new Error("coach only");

  const [tpl] = await db
    .select()
    .from(prescriptionTemplates)
    .where(eq(prescriptionTemplates.id, templateId))
    .limit(1);
  if (!tpl) throw new Error("template not found");

  await db
    .update(behaviorEntries)
    .set({
      prescription: tpl.body,
      resourceIds: [...new Set([...(existing.resourceIds ?? []), ...(tpl.resourceIds ?? [])])],
      pillar: existing.pillar || tpl.pillar,
      updatedAt: new Date(),
    })
    .where(eq(behaviorEntries.id, entryId));

  revalidatePath("/app/behavior-board");
  revalidatePath(`/app/clients/${existing.clientId}`);
}

export async function loadBoardForClient(clientId: string) {
  const cid = await resolveAllowedClientId(clientId);
  const entries = await db
    .select()
    .from(behaviorEntries)
    .where(eq(behaviorEntries.clientId, cid))
    .orderBy(asc(behaviorEntries.position), asc(behaviorEntries.createdAt));

  const ids = Array.from(new Set(entries.flatMap((e) => e.resourceIds ?? [])));
  const resourceRows = ids.length
    ? await db.select().from(resources).where(inArray(resources.id, ids))
    : [];

  const [templates, libraryResources] = await Promise.all([
    db.select().from(prescriptionTemplates).orderBy(prescriptionTemplates.title),
    db.select().from(resources).where(eq(resources.inLibrary, true)).orderBy(resources.title),
  ]);

  return { entries, resources: resourceRows, templates, libraryResources };
}
