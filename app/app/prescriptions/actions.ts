"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { prescriptionTemplates, users } from "@/db/schema";
import { requireRole } from "@/lib/auth";

type TemplateInput = {
  id?: string;
  title: string;
  pillar: string;
  body: string;
  resourceIds?: string[];
  tags?: string[];
};

async function authorId() {
  const cu = await currentUser();
  if (!cu) return null;
  const [u] = await db.select().from(users).where(eq(users.clerkId, cu.id)).limit(1);
  return u?.id ?? null;
}

export async function createPrescriptionTemplate(input: TemplateInput) {
  await requireRole("coach");
  const [row] = await db
    .insert(prescriptionTemplates)
    .values({
      title: input.title,
      pillar: input.pillar,
      body: input.body,
      resourceIds: input.resourceIds ?? [],
      tags: input.tags ?? [],
      authorId: await authorId(),
    })
    .returning();
  revalidatePath("/app/prescriptions");
  return row;
}

export async function updatePrescriptionTemplate(id: string, patch: Partial<TemplateInput>) {
  await requireRole("coach");
  const update: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of ["title", "pillar", "body", "resourceIds", "tags"] as const) {
    if (patch[k] !== undefined) update[k] = patch[k];
  }
  await db.update(prescriptionTemplates).set(update).where(eq(prescriptionTemplates.id, id));
  revalidatePath("/app/prescriptions");
}

export async function deletePrescriptionTemplate(id: string) {
  await requireRole("coach");
  await db.delete(prescriptionTemplates).where(eq(prescriptionTemplates.id, id));
  revalidatePath("/app/prescriptions");
}
