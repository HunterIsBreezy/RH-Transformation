"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { clientProfile, clients } from "@/db/schema";
import { requireRole } from "@/lib/auth";

export async function saveCoachNotes(clientId: string, notes: string) {
  await requireRole("coach");
  const existing = await db
    .select({ id: clientProfile.id })
    .from(clientProfile)
    .where(eq(clientProfile.clientId, clientId))
    .limit(1);

  if (existing[0]) {
    await db
      .update(clientProfile)
      .set({ motivationNotes: notes, updatedAt: new Date() })
      .where(eq(clientProfile.id, existing[0].id));
  } else {
    await db.insert(clientProfile).values({ clientId, motivationNotes: notes });
  }
  revalidatePath(`/app/clients/${clientId}`);
}

export async function updateClientStatus(
  clientId: string,
  patch: {
    status: (typeof clients.$inferSelect)["status"];
    startDate: string | null;
  },
) {
  await requireRole("coach");
  await db
    .update(clients)
    .set({
      status: patch.status,
      startDate: patch.startDate ? new Date(patch.startDate) : null,
      updatedAt: new Date(),
    })
    .where(eq(clients.id, clientId));
  revalidatePath(`/app/clients/${clientId}`);
  revalidatePath(`/app/roster`);
}
