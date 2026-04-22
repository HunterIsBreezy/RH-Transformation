"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { put, del } from "@vercel/blob";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { resources, users } from "@/db/schema";
import { requireRole } from "@/lib/auth";

type ResourceInput = {
  id?: string;
  kind: string;
  title: string;
  author?: string | null;
  url?: string | null;
  bodyMd?: string | null;
  tags?: string[];
  behaviorsTargeted?: string[];
  inLibrary?: boolean;
};

async function coachUserId() {
  const cu = await currentUser();
  if (!cu) throw new Error("unauthenticated");
  const [u] = await db.select().from(users).where(eq(users.clerkId, cu.id)).limit(1);
  return u?.id ?? null;
}

export async function createResource(input: ResourceInput) {
  await requireRole("coach");
  const authorId = await coachUserId();
  const [row] = await db
    .insert(resources)
    .values({
      kind: input.kind,
      title: input.title,
      author: input.author ?? null,
      url: input.url ?? null,
      bodyMd: input.bodyMd ?? null,
      tags: input.tags ?? [],
      behaviorsTargeted: input.behaviorsTargeted ?? [],
      authorId,
      inLibrary: input.inLibrary ?? true,
    })
    .returning();
  revalidatePath("/app/resources");
  return row;
}

export async function updateResource(id: string, patch: Partial<ResourceInput>) {
  await requireRole("coach");
  const update: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of ["kind", "title", "author", "url", "bodyMd", "tags", "behaviorsTargeted", "inLibrary"] as const) {
    if (patch[k] !== undefined) update[k] = patch[k];
  }
  await db.update(resources).set(update).where(eq(resources.id, id));
  revalidatePath("/app/resources");
}

export async function deleteResource(id: string) {
  await requireRole("coach");
  const [existing] = await db.select().from(resources).where(eq(resources.id, id)).limit(1);
  if (existing?.url && existing.url.includes("blob.vercel-storage.com")) {
    try {
      await del(existing.url);
    } catch (err) {
      console.warn("[resources] blob delete failed", err);
    }
  }
  await db.delete(resources).where(eq(resources.id, id));
  revalidatePath("/app/resources");
}

export async function uploadResourceBlob(formData: FormData) {
  await requireRole("coach");
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("no file");
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN not set — provision Vercel Blob first");
  }
  const blob = await put(`resources/${Date.now()}-${file.name}`, file, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  return { url: blob.url, pathname: blob.pathname };
}

export async function listResourcesForPicker(query?: string, behavior?: string) {
  await requireRole("coach");
  const rows = await db
    .select()
    .from(resources)
    .where(and(eq(resources.inLibrary, true)))
    .orderBy(resources.title);
  const q = (query ?? "").toLowerCase().trim();
  return rows.filter((r) => {
    const qOk = q
      ? r.title.toLowerCase().includes(q) ||
        (r.author ?? "").toLowerCase().includes(q) ||
        r.kind.toLowerCase().includes(q)
      : true;
    const bOk = behavior ? r.behaviorsTargeted.includes(behavior) : true;
    return qOk && bOk;
  });
}
